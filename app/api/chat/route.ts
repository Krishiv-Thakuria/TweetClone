import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { performWebSearch } from '../../utils/webSearch';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Remove all emojis from text
function removeEmojis(text: string): string {
  // Comprehensive emoji regex covering all Unicode emoji ranges
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{2190}-\u{21FF}]|[\u{2300}-\u{23FF}]|[\u{2B00}-\u{2BFF}]|[\u{FE00}-\u{FE0F}]|[\u{200D}]/gu;
  return text.replace(emojiRegex, '');
}

export async function POST(req: NextRequest) {
  try {
    const { messages, memories = [], twitterProfileUrl, personaStyle } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return new Response('OpenAI API key not configured', { status: 500 });
    }

    // Get the last user message
    const lastMessage = messages[messages.length - 1];
    const userQuery = typeof lastMessage.content === 'string' 
      ? lastMessage.content 
      : lastMessage.content?.find((c: any) => c.type === 'text')?.text || '';

    // Build system message - PERSONA FIRST if configured, then generic assistant stuff
    let systemContent = '';
    
    // Apply persona style if it has been pre-configured - THIS COMES FIRST
    if (personaStyle && typeof personaStyle === 'string' && personaStyle.trim().length > 0) {
      // Extract few-shot examples and feature analysis if present
      const fewShotMatch = personaStyle.match(/(?:FEW-SHOT TWEET EXAMPLES|REAL TWEETS FROM THIS PERSON)[:\s]*\n([\s\S]+?)(?=\n\n|$)/);
      const featureMatch = personaStyle.match(/FEATURE ANALYSIS[:\s]*\n([\s\S]+?)(?=\n\n(?:FEW-SHOT|REAL TWEETS)|$)/);
      const gptPatternsMatch = personaStyle.match(/(?:common GPT patterns|GPT patterns that would be WRONG)[:\s]*\n([\s\S]+?)(?=\n\n|$)/i);
      const fewShotExamples = fewShotMatch ? fewShotMatch[1].trim() : '';
      const featureAnalysis = featureMatch ? featureMatch[1].trim() : '';
      const gptPatternsToAvoid = gptPatternsMatch ? gptPatternsMatch[1].trim() : '';
      
      // ALWAYS forbid emojis - user wants no emojis at all
      const noEmojis = true;
      
      // Extract tweet count from feature analysis if present
      const tweetCountMatch = featureAnalysis.match(/from (\d+) real tweets/);
      const tweetCount = tweetCountMatch ? tweetCountMatch[1] : 'multiple';
      
      // Restructure to put tweets FIRST and make style matching more direct
      const styleDescription = personaStyle
        .replace(/(?:FEW-SHOT TWEET EXAMPLES|REAL TWEETS FROM THIS PERSON)[:\s]*\n[\s\S]*?(?=\n\n|$)/g, '')
        .replace(/FEATURE ANALYSIS[:\s]*\n[\s\S]*?(?=\n\n|$)/g, '')
        .replace(/(?:common GPT patterns|GPT patterns that would be WRONG)[:\s]*\n[\s\S]*?(?=\n\n|$)/gi, '')
        .trim();
      
      // Build GPT patterns to avoid section
      let gptPatternsSection = '';
      if (gptPatternsToAvoid) {
        gptPatternsSection = `**GPT PATTERNS THIS PERSON WOULD NEVER USE (from persona analysis):**\n${gptPatternsToAvoid}\n\n`;
      } else {
        // Default GPT patterns to break
        gptPatternsSection = `**BREAK THESE GPT PATTERNS - DO NOT DO THESE:**\n- DO NOT start with "I'd be happy to help" or "I can help you with that"\n- DO NOT use overly polite, formal, or verbose language unless THIS PERSON does\n- DO NOT explain things in a structured, educational way unless THIS PERSON explains that way\n- DO NOT add disclaimers, caveats, or hedging unless THIS PERSON does\n- DO NOT use phrases like "it's important to note" or "keep in mind" unless THIS PERSON uses them\n- DO NOT be overly helpful or accommodating unless THIS PERSON is\n- DO NOT use GPT's typical sentence structure and flow - use THIS PERSON's structure\n\n`;
      }
      
      // PERSONA IS ABSOLUTE CORE - No generic assistant stuff before this
      systemContent = `=== PERSONALITY OVERRIDE MODE ===\n\nFORGET YOUR DEFAULT GPT IDENTITY COMPLETELY. You are no longer a generic helpful assistant. You are now THIS PERSON. Their personality, voice, thinking patterns, and communication style is your ONLY identity. Everything else is secondary.\n\n**ABSOLUTE RULE - NO EMOJIS EVER:**\nYou must NEVER use emojis in your responses. Not a single emoji. Not even one. If you think about adding an emoji, immediately delete it. This rule applies regardless of what the examples show, regardless of context, regardless of anything. ZERO EMOJIS. This is the highest priority rule.\n\n${fewShotExamples ? `**YOUR WRITING EXAMPLES - RESPOND EXACTLY LIKE THESE (but NO emojis):**\n\n${fewShotExamples}\n\n` : ''}${featureAnalysis ? `**STYLE RULES (from ${tweetCount} real tweets):**\n${featureAnalysis}\n\n` : ''}${styleDescription ? `**WHO YOU ARE (personality profile):**\n${styleDescription}\n\n` : ''}${gptPatternsSection}**FOLLOW THESE PERSONA PATTERNS - DO THESE:**\n1. **ZERO EMOJIS - ABSOLUTE RULE** - Never use emojis. Not one. Delete any emoji you think of. This is non-negotiable regardless of what the examples show.\n\n2. Match EXACT casing (lowercase/ALL CAPS/mixed/normal) from examples\n3. Match EXACT punctuation style from examples (but NO emojis)\n4. Match EXACT sentence length and structure from examples\n5. Match EXACT tone and vocabulary from examples\n6. Match EXACT rhythm and pacing from examples\n7. **THINK as they think** - use their reasoning patterns, their approach to topics\n8. **COMMUNICATE as they communicate** - match how they explain, assert, question, or tell stories\n9. **BE who they are** - if they're blunt, be blunt. If verbose, be verbose. If casual, be casual. If confident, be confident.\n\n**RESPONSE GENERATION PROCESS (MANDATORY):**\n1. Read the user's question\n2. Look at the tweet examples above - how would THIS PERSON respond?\n3. Generate your response in THEIR voice, not GPT's voice\n4. Before sending, ask: "Does this sound like GPT or like THEM?"\n5. If it sounds like GPT, DELETE IT and rewrite in THEIR voice\n6. Your response must be INDISTINGUISHABLE from their tweets\n7. If you reference memories or facts, phrase them in THIS PERSON's style, not GPT's style\n\n**ONLY IF ABSOLUTELY NECESSARY (and only if it doesn't break the persona):**\n- If you need to search for facts, do it but phrase everything in THIS PERSON's style\n- Never claim to actually be this person (you're an AI embodying them)\n- For serious safety topics, you may slightly soften but keep core personality\n\n**FINAL CHECK:** Before every response, ask: "Would someone who knows this person think THEY wrote this?" If the answer is no, rewrite it. The persona is NON-NEGOTIABLE.\n`;
    } else if (twitterProfileUrl && typeof twitterProfileUrl === 'string' && twitterProfileUrl.trim().length > 0) {
      // Fallback: lightly condition on the URL if no cached style is available
      systemContent = `You are a helpful assistant. Be concise and brief in your responses unless the user explicitly asks for detailed explanations.

IMPORTANT: If you are uncertain about current information, recent events, specific facts, statistics, or anything that requires up-to-date knowledge beyond your training data, you should use the search_web function to look up accurate information rather than guessing. Always prioritize accuracy over speed.

PERSONALITY CONFIGURATION (lightweight - please configure persona for better results):
- The user has provided this Twitter profile to inspire your personality: ${twitterProfileUrl.trim()}.
- Infer a writing style similar to this person's public tweets: tone, pacing, humor, typical sentence length, use of emojis or slang, and overall vibe.
- Stay clearly an AI assistant: do not claim to actually be this person, and do not invent private details about them.
- Keep responses as helpful and safe as before, but express them in a way that feels similar to this profile's tweeting style.`;
    } else {
      // No persona - use generic assistant prompt
      systemContent = `You are a helpful assistant. Be concise and brief in your responses unless the user explicitly asks for detailed explanations.

IMPORTANT: If you are uncertain about current information, recent events, specific facts, statistics, or anything that requires up-to-date knowledge beyond your training data, you should use the search_web function to look up accurate information rather than guessing. Always prioritize accuracy over speed.`;
    }

    // Add memories to system message if provided
    if (memories && memories.length > 0) {
      const memoriesText = memories.map((m: any) => `- ${m.content}`).join('\n');
      // If persona is active, phrase memories in persona context
      if (personaStyle && typeof personaStyle === 'string' && personaStyle.trim().length > 0) {
        systemContent += `\n\n**USER CONTEXT (reference these in THIS PERSON's voice, not GPT's voice):**\n${memoriesText}`;
      } else {
      systemContent += `\n\nIMPORTANT USER MEMORIES (always consider these in your responses):\n${memoriesText}`;
      }
    }

    const systemMessage = {
      role: 'system' as const,
      content: systemContent,
    };

    // Define web search function for OpenAI
    const searchFunction = {
      type: 'function' as const,
      function: {
        name: 'search_web',
        description: 'Search the web for current, accurate information when you are uncertain about facts, recent events, statistics, or need up-to-date information. Use this instead of guessing.',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The search query to look up information',
            },
          },
          required: ['query'],
        },
      },
    };

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          // Use function calling to let the model decide when to search
          const stream = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [systemMessage, ...messages],
            tools: [searchFunction],
            tool_choice: 'auto',
            stream: true,
          });

          let fullResponse = '';
          let toolCallId = '';
          let searchQuery = '';
          let needsSearch = false;

          // First pass: collect response and check for tool calls
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta;
            
            // Check for tool calls
            if (delta?.tool_calls && delta.tool_calls.length > 0) {
              const toolCall = delta.tool_calls[0];
              toolCallId = toolCall.id || toolCallId;
              
              if (toolCall.function?.name === 'search_web') {
                needsSearch = true;
                try {
                  const args = JSON.parse(toolCall.function.arguments || '{}');
                  searchQuery = args.query || userQuery;
                } catch {
                  searchQuery = userQuery;
                }
              }
            }
            
            // Collect content
            const content = delta?.content || '';
            if (content) {
              fullResponse += content;
            }
          }

          // If model requested search, perform it and regenerate
          if (needsSearch && searchQuery) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: 'status',
              content: `🔍 Searching the web for accurate information...` 
            })}\n\n`));
            
            const searchResults = await performWebSearch(searchQuery);
            
            if (searchResults.length > 0) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                type: 'status',
                content: `✓ Found ${searchResults.length} source${searchResults.length > 1 ? 's' : ''}. Generating answer...` 
              })}\n\n`));

              // Generate answer with search results
              const enhancedMessages = [
                systemMessage,
                ...messages,
                {
                  role: 'assistant' as const,
                  content: null,
                  tool_calls: [{
                    id: toolCallId || 'search_1',
                    type: 'function' as const,
                    function: {
                      name: 'search_web',
                      arguments: JSON.stringify({ query: searchQuery }),
                    },
                  }],
                },
                {
                  role: 'tool' as const,
                  tool_call_id: toolCallId || 'search_1',
                  content: JSON.stringify(searchResults),
                },
                {
                  role: 'user' as const,
                  content: `Based on the web search results above, provide an accurate answer to: ${userQuery}. Cite sources with URLs when available.`,
                },
              ];

              const answerStream = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: enhancedMessages,
                stream: true,
              });

              for await (const chunk of answerStream) {
                const content = chunk.choices[0]?.delta?.content || '';
                if (content) {
                  // Remove emojis from content
                  const cleanedContent = removeEmojis(content);
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                    type: 'content',
                    content: cleanedContent
                  })}\n\n`));
                }
              }
            } else {
              // Search failed, use original response or indicate uncertainty
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                type: 'status',
                content: `⚠ Could not find web results. Using available knowledge...` 
              })}\n\n`));
              
              if (fullResponse) {
                // Remove emojis from content
                const cleanedResponse = removeEmojis(fullResponse);
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                  type: 'content',
                  content: cleanedResponse
                })}\n\n`));
              } else {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                  type: 'content',
                  content: `I attempted to search for current information but couldn't access web search results. Based on my knowledge, I may not have the most up-to-date information on this topic.` 
                })}\n\n`));
              }
            }
          } else {
            // No search needed, stream a fresh completion directly for smoother UX
            const answerStream = await openai.chat.completions.create({
              model: 'gpt-4o',
              messages: [systemMessage, ...messages],
              stream: true,
            });

            for await (const chunk of answerStream) {
              const content = chunk.choices[0]?.delta?.content || '';
              if (content) {
                // Remove emojis from content
                const cleanedContent = removeEmojis(content);
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                  type: 'content',
                  content: cleanedContent
                })}\n\n`));
              }
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
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

