import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { performWebSearch } from '../../utils/webSearch';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Use shared web search utility

export async function POST(req: NextRequest) {
  try {
    const { query, researchDepth = 'standard' } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return new Response('OpenAI API key not configured', { status: 500 });
    }

    if (!query) {
      return new Response('Query is required', { status: 400 });
    }

    // Step 1: Break down the research question into sub-queries
    const breakdownResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a research assistant. Break down complex research questions into 3-5 specific search queries that will help gather comprehensive information. Return a JSON object with a "queries" array containing search query strings.',
        },
        {
          role: 'user',
          content: `Break down this research question into specific search queries: ${query}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    let searchQueries: string[] = [];
    try {
      const breakdown = JSON.parse(breakdownResponse.choices[0].message.content || '{}');
      searchQueries = breakdown.queries || [query];
      // Ensure we have at least one query
      if (searchQueries.length === 0) {
        searchQueries = [query];
      }
    } catch {
      // Fallback: use the original query
      searchQueries = [query];
    }

    // Create streaming response that shows thinking process
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          const searchResults: { query: string; results: any[] }[] = [];

          // Send thinking updates
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'thinking',
            content: `🔍 Breaking down research question into ${searchQueries.length} focused queries...\n\n` 
          })}\n\n`));

          // Send the sub-queries being used
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'thinking',
            content: `📋 Research queries:\n${searchQueries.map((q, i) => `  ${i + 1}. ${q}`).join('\n')}\n\n` 
          })}\n\n`));

          // Perform searches and send updates
          for (let i = 0; i < searchQueries.length; i++) {
            const searchQuery = searchQueries[i];
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: 'thinking',
              content: `🌐 Searching: "${searchQuery}" (${i + 1}/${searchQueries.length})...\n` 
            })}\n\n`));
            
            const results = await performWebSearch(searchQuery);
            searchResults.push({ query: searchQuery, results });
            
            if (results.length > 0) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                type: 'thinking',
                content: `✓ Found ${results.length} source${results.length > 1 ? 's' : ''}: ${results.slice(0, 3).map(r => r.title).join(', ')}${results.length > 3 ? '...' : ''}\n` 
              })}\n\n`));
            } else {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                type: 'thinking',
                content: `⚠ No direct results found, using knowledge base...\n` 
              })}\n\n`));
            }
          }

          // Send synthesis update
          const totalSources = searchResults.reduce((sum, sr) => sum + sr.results.length, 0);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'thinking',
            content: `\n📊 Synthesizing findings from ${totalSources} source${totalSources !== 1 ? 's' : ''}...\n\n---\n\n` 
          })}\n\n`));

          // Step 3: Synthesize all information into a comprehensive answer
          const synthesisPrompt = `Based on the following research findings, provide a comprehensive, well-structured answer to the original question: "${query}"

Research Findings:
${searchResults.map((sr, idx) => `
Search Query ${idx + 1}: ${sr.query}
Results:
${sr.results.map((r, rIdx) => `
  ${rIdx + 1}. ${r.title}
     URL: ${r.url}
     Content: ${r.content.substring(0, 500)}${r.content.length > 500 ? '...' : ''}
`).join('\n')}
`).join('\n')}

Please provide:
1. A comprehensive answer to the question
2. Key findings and insights
3. Sources cited with URLs (when available)
4. Any important caveats or limitations

Format your response in clear sections with markdown.`;

          const stream = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
              {
                role: 'system',
                content: 'You are an expert research assistant. Provide comprehensive, well-researched answers based on the provided sources. Always cite your sources with URLs when available. Be thorough but clear.',
              },
              {
                role: 'user',
                content: synthesisPrompt,
              },
            ],
            stream: true,
            temperature: 0.7,
          });

          // Stream the final answer
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                type: 'content',
                content 
              })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Research error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

