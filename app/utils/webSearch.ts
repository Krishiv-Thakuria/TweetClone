// Shared web search utility
export interface SearchResult {
  title: string;
  url: string;
  content: string;
}

export async function performWebSearch(query: string): Promise<SearchResult[]> {
  try {
    // Try Tavily API first if API key is available
    if (process.env.TAVILY_API_KEY) {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: process.env.TAVILY_API_KEY,
          query: query,
          search_depth: 'advanced',
          include_answer: true,
          include_raw_content: false,
          max_results: 5
        })
      });

      if (response.ok) {
        const data = await response.json();
        return (data.results || []).map((result: any) => ({
          title: result.title || 'Untitled',
          url: result.url || '',
          content: result.content || result.snippet || ''
        }));
      }
    }

    // Fallback: Use SerpAPI if available
    if (process.env.SERP_API_KEY) {
      const response = await fetch(
        `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${process.env.SERP_API_KEY}&num=5`
      );
      if (response.ok) {
        const data = await response.json();
        return (data.organic_results || []).map((result: any) => ({
          title: result.title || 'Untitled',
          url: result.link || '',
          content: result.snippet || ''
        }));
      }
    }

    // Free alternative: Use DuckDuckGo Instant Answer API
    try {
      const ddgResponse = await fetch(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`,
        { 
          headers: { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json'
          } 
        }
      );
      
      if (ddgResponse.ok) {
        const ddgData = await ddgResponse.json();
        const results: SearchResult[] = [];
        
        // Get abstract if available
        if (ddgData.AbstractText) {
          results.push({
            title: ddgData.Heading || query,
            url: ddgData.AbstractURL || `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
            content: ddgData.AbstractText
          });
        }
        
        // Get related topics
        if (ddgData.RelatedTopics && Array.isArray(ddgData.RelatedTopics)) {
          ddgData.RelatedTopics.slice(0, 4).forEach((topic: any) => {
            if (topic.Text && topic.FirstURL) {
              results.push({
                title: topic.Text.split(' - ')[0] || 'Related Topic',
                url: topic.FirstURL,
                content: topic.Text
              });
            }
          });
        }
        
        if (results.length > 0) {
          return results;
        }
      }
    } catch (ddgError) {
      console.log('DuckDuckGo search failed:', ddgError);
    }

    // Return empty if no search APIs available
    return [];
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}





