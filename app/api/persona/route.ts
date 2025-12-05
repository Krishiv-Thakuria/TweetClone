import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { performWebSearch } from '../../utils/webSearch';
import { getRecentTweetsFromProfileUrl, getTwitterProfilePictureUrl, getTwitterProfileDisplayName } from '../../utils/twitter';
import { analyzeWritingStyle, formatStyleMetricsForPrompt } from '../../utils/styleAnalyzer';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { twitterProfileUrl } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return new Response('OpenAI API key not configured', { status: 500 });
    }

    if (!twitterProfileUrl || typeof twitterProfileUrl !== 'string') {
      return new Response(JSON.stringify({ error: 'twitterProfileUrl is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const trimmedUrl = twitterProfileUrl.trim();

    // Get profile picture URL + display name
    const [profilePictureUrl, displayName] = await Promise.all([
      getTwitterProfilePictureUrl(trimmedUrl),
      getTwitterProfileDisplayName(trimmedUrl),
    ]);

    // First attempt: use the official Twitter/X API (via helper) to get recent tweets.
    // This requires TWITTER_BEARER_TOKEN to be set in the environment.
    // Fetch up to 1000 tweets for comprehensive analysis
    const tweets = await getRecentTweetsFromProfileUrl(trimmedUrl, 1000);

    // Comprehensive web research for additional context
    let searchResults: any[] = [];
    const searchQueries = [
      `Recent tweets and writing style of ${trimmedUrl} - analyze their communication patterns`,
      `Writing style analysis of Twitter user ${trimmedUrl} - tone, vocabulary, sentence structure`,
      `How does ${trimmedUrl} write on Twitter - communication patterns and linguistic style`,
      `Twitter writing patterns of ${trimmedUrl} - analyze their tweet style and personality`,
    ];

    // Perform multiple web searches in parallel for comprehensive coverage
    try {
      const searchPromises = searchQueries.map(query => performWebSearch(query));
      const allSearchResults = await Promise.all(searchPromises);
      searchResults = allSearchResults.flat().filter((r, idx, self) => 
        idx === self.findIndex((t) => t.url === r.url) // Deduplicate by URL
      );
    } catch (err) {
      console.error('Error during persona web search for profile:', trimmedUrl, err);
    }

    // Perform detailed statistical analysis of writing style
    const styleMetrics = analyzeWritingStyle(tweets);
    const metricsAnalysis = formatStyleMetricsForPrompt(styleMetrics);

    let systemMessage;
    let userMessage;

    // Case 1: we have some tweet-like content (tweets and/or search snippets)
    if ((tweets && tweets.length > 0) || (searchResults && searchResults.length > 0)) {
      // Sample tweets strategically for comprehensive coverage:
      // - Take more recent tweets (they reflect current style)
      // - Sample from across the timeline for style consistency
      // - Use up to 150 tweets for few-shot examples (much more than before)
      const maxExamples = 150;
      const sampledTweets: string[] = [];
      const uniqueTweets = Array.from(new Set(tweets)); // basic de-dup

      const addSample = (idx: number) => {
        if (idx >= 0 && idx < uniqueTweets.length && !sampledTweets.includes(uniqueTweets[idx])) {
          sampledTweets.push(uniqueTweets[idx]);
        }
      };

      // Strategy: Take more from recent (most representative of current style)
      // Then sample evenly across timeline for consistency
      const recentCount = Math.min(80, uniqueTweets.length); // More recent tweets
      for (let i = 0; i < recentCount; i++) addSample(i);

      // Sample from across the timeline for style consistency
      if (uniqueTweets.length > recentCount) {
        const sections = 5; // Divide timeline into 5 sections
        for (let section = 1; section < sections; section++) {
          const sectionStart = Math.floor((section / sections) * uniqueTweets.length);
          const sectionSize = Math.min(20, Math.floor(uniqueTweets.length / sections));
          for (let i = 0; i < sectionSize && sampledTweets.length < maxExamples; i++) {
            addSample(sectionStart + i);
          }
        }
      }

      // Ensure we have enough examples
      while (sampledTweets.length < maxExamples && sampledTweets.length < uniqueTweets.length) {
        const randomIdx = Math.floor(Math.random() * uniqueTweets.length);
        addSample(randomIdx);
      }

      const tweetsSection =
        sampledTweets.length > 0
          ? `RAW TWEETS (${sampledTweets.length} examples, sampled from ${uniqueTweets.length} total tweets for style coverage):\n${sampledTweets
              .slice(0, maxExamples)
              .map((t, i) => `${i + 1}. ${t}`)
              .join('\n')}`
          : '';

      const searchContext =
        searchResults && searchResults.length > 0
          ? searchResults
              .map(
                (r: any, idx: number) =>
                  `SOURCE ${idx + 1} (${r.url || 'no-url'}):\n${(r.snippet || r.content || '').toString()}`
              )
              .join('\n\n')
          : '';

      const combinedContext = [tweetsSection, searchContext].filter(Boolean).join('\n\n');

      systemMessage = {
        role: 'system' as const,
        content:
          'You are an expert linguist and personality analyst specializing in distilling authentic writing style from large datasets. You analyze EVERY aspect of writing: vocabulary complexity, sentence rhythm, punctuation patterns, pacing, tone, and psychological traits. You create comprehensive profiles that capture not just surface features but the DEEP STRUCTURE of how someone thinks and communicates.',
      };

      userMessage = {
        role: 'user' as const,
        content: `You have access to ${tweets.length} real tweets and web search results for this Twitter/X user: ${trimmedUrl}\n\n${metricsAnalysis}\n\n${combinedContext}\n\n**YOUR MISSION:** Create an ULTRA-DETAILED personality and writing style profile that captures EVERY nuance of how this person writes. This profile will be used to make an AI respond EXACTLY like this person - indistinguishable from their actual tweets.\n\n**STEP 1: RHYTHM & PACING ANALYSIS** (use the statistical data above):\n- Analyze their sentence rhythm: Are sentences short and punchy? Long and flowing? Varied?\n- What's their pacing? Fast (quick thoughts)? Slow (deliberate)? Erratic?\n- How do they structure thoughts? Linear? Jumping? Stream-of-consciousness?\n- What's the cadence? Staccato? Smooth? Choppy?\n- Do they use fragments intentionally? What's the fragment-to-sentence ratio?\n- How do they handle pauses? (ellipses, dashes, line breaks)\n\n**STEP 2: VOCABULARY & LANGUAGE DEPTH** (use statistical data):\n- Vocabulary level: ${styleMetrics.vocabularyComplexity} (avg word length: ${styleMetrics.avgWordLength} chars, unique ratio: ${(styleMetrics.uniqueWordRatio * 100).toFixed(1)}%)\n- Do they use simple words? Complex words? Technical terms? Slang?\n- What's their word choice pattern? Precise? Vague? Colorful? Plain?\n- Do they use contractions? (${(styleMetrics.contractionFrequency * 100).toFixed(1)}% frequency)\n- How do they handle formality? Academic? Casual? Street? Mixed?\n- What linguistic register do they operate in?\n\n**STEP 3: PUNCTUATION & STRUCTURE PATTERNS** (use statistical data):\n- Period frequency: ${styleMetrics.periodFrequency.toFixed(2)} per 100 chars - What does this tell you about their sentence completion style?\n- Comma frequency: ${styleMetrics.commaFrequency.toFixed(2)} - Do they use commas for rhythm or structure?\n- Exclamation: ${styleMetrics.exclamationFrequency.toFixed(2)} - Are they emphatic? Reserved?\n- Question marks: ${styleMetrics.questionFrequency.toFixed(2)} - Do they ask questions? Rhetorical? Genuine?\n- Ellipses: ${styleMetrics.ellipsisFrequency.toFixed(2)} - Do they trail off? Create suspense?\n- Dashes: ${styleMetrics.dashFrequency.toFixed(2)} - How do they use dashes?\n- What punctuation patterns create their unique rhythm?\n\n**STEP 4: CASING & TYPOGRAPHY** (use statistical data):\n- Lowercase ratio: ${(styleMetrics.lowercaseRatio * 100).toFixed(1)}% - Do they write in lowercase intentionally?\n- Uppercase ratio: ${(styleMetrics.uppercaseRatio * 100).toFixed(1)}% - Do they use caps for emphasis?\n- Mixed case: ${(styleMetrics.mixedCaseRatio * 100).toFixed(1)}% - What's their capitalization pattern?\n- All-caps tweets: ${styleMetrics.allCapsTweets} - When do they shout?\n- What does their casing tell you about their personality and communication style?\n\n**STEP 5: COMMUNICATION PATTERNS** (use statistical data):\n- Questions: ${(styleMetrics.questionRatio * 100).toFixed(1)}% of tweets - Do they ask questions? What kind?\n- Rhetorical questions: ${(styleMetrics.rhetoricalQuestionRatio * 100).toFixed(1)}% - Do they use rhetorical questions?\n- Statements: ${(styleMetrics.statementRatio * 100).toFixed(1)}% - Are they declarative? Assertive?\n- Exclamations: ${(styleMetrics.exclamationRatio * 100).toFixed(1)}% - How emphatic are they?\n- What's their default communication mode? Questions? Statements? Both?\n\n**STEP 6: TONE & PERSONALITY DEEP DIVE:**\n- What's their emotional baseline? Confident? Anxious? Playful? Serious? Cynical? Optimistic?\n- How do they express emotion? Directly? Indirectly? Through tone? Through structure?\n- What's their humor style? (if any) Dry? Self-deprecating? Dark? Light? Witty? Absent?\n- How do they handle disagreement? Confrontational? Diplomatic? Avoidant?\n- What's their relationship with language? Do they play with words? Are they direct? Poetic? Technical?\n- How do they think? Analytical? Emotional? Logical? Intuitive? Quick? Methodical?\n- What makes them unique? What patterns or quirks stand out across ALL their tweets?\n\n**STEP 7: CONTENT PATTERNS:**\n- What topics/themes do they gravitate toward?\n- How do they approach different topics? (serious vs casual, technical vs simple)\n- Do they explain things? Make assertions? Tell stories? Share thoughts? Debate?\n- What's their information density? Dense? Sparse? Varied?\n\n**STEP 8: CREATE COMPREHENSIVE STYLE PROFILE** (20-25 detailed bullet points):\nBased on ALL the analysis above, create a profile that captures:\n- Their core personality (who they are at their essence)\n- Their thinking patterns (how they process and express thoughts)\n- Their communication style (how they structure and deliver messages)\n- Their linguistic fingerprint (vocabulary, rhythm, pacing, punctuation, casing)\n- Their emotional patterns (how they express and handle emotions)\n- Their unique quirks and patterns (what makes them unmistakably them)\n- What would make a response sound "off" or "not them"\n\n**STEP 9: EXTRACT 80-100 BEST TWEET EXAMPLES** (from the ${sampledTweets.length} provided):\nSelect the tweets that BEST represent their style, personality, and communication patterns. Preserve EXACT casing, punctuation, and structure. These will be used as few-shot examples.\n\n**STEP 10: CREATE 20-25 SYNTHETIC EXAMPLE SENTENCES:**\nGenerate example sentences that feel EXACTLY like them but are generic (no private details). Show how they'd respond to:\n- Questions\n- Statements\n- Debates\n- Casual conversation\n- Technical topics\n- Emotional topics\n- Different contexts\n\n**STEP 11: IDENTIFY GPT PATTERNS TO BREAK** (10-15 examples):\nWhat would generic GPT say that this person would NEVER say? List specific phrases, patterns, structures, and approaches that must be avoided.\n\n**CRITICAL REQUIREMENTS:**\n1. Use the statistical data provided to ground your analysis in REAL patterns, not assumptions\n2. The profile must be so detailed that someone could write EXACTLY like them\n3. Focus on DEEP STRUCTURE (how they think) not just surface features (what they say)\n4. Make it VERY clear if they do NOT use emojis, write in lowercase, etc.\n5. Every aspect of writing style must be analyzed and documented\n\nReturn everything as a single markdown-formatted blob. The description should be ULTRA-DETAILED - comprehensive enough that an AI could embody this person's personality and write authentically as them.`,
      };
    } else {
      // Case 2: no external tweet-like content available (e.g., dev environment without network).
      // Fall back to a synthetic style approximation so the feature still works.
      const handleMatch = trimmedUrl.match(/(?:twitter\.com|x\.com)\/([A-Za-z0-9_]+)/i);
      const handle = handleMatch?.[1] || 'unknown_user';

      systemMessage = {
        role: 'system' as const,
        content:
          'You are an expert at approximating Twitter/X writing style from prior general knowledge. You DO NOT need live tweets. You focus on surface-level style (casing, punctuation, emojis, slang, rhythm) and give tweet-like micro-examples, not biography.',
      };

      userMessage = {
        role: 'user' as const,
        content: `You do NOT have access to live tweets right now.\n\nHowever, the user wants a persona based on this Twitter/X profile:\n- URL: ${trimmedUrl}\n- Handle (best guess): @${handle}\n\nYour tasks:\n1. If this is a well-known public figure and you know their general tweeting style from your training data (up to your knowledge cutoff), approximate it.\n2. If you do NOT recognize them, invent a *distinct* but generic Twitter persona that feels realistic (e.g., a tech founder, a VC, a meme account, etc.).\n\nIn either case, output:\n- A clear feature analysis: Do they use emojis? (YES/NO - be explicit) What casing? (lowercase/ALL CAPS/mixed)\n- 3–6 bullet points describing their style (tone, pacing, sentence length, emoji usage OR lack thereof, slang, humor, etc.).\n- 15–25 bullet points under a heading like \"Example tweet-style lines\" that look like plausible tweets for this persona.\n  - Make it visually obvious if the persona is \"always lowercase\", \"shouts in ALL CAPS\", or uses standard casing.\n  - If the persona does NOT use emojis, make sure NONE of the example lines include emojis.\n- 3–5 more short example sentences that are generic but clearly in this voice.\n\nReturn everything as a single markdown-formatted blob. Do NOT include any biography, only style and tweet-like examples.`,
      };
    }

    // Use GPT-4o for more sophisticated analysis (better at understanding nuanced style)
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [systemMessage, userMessage],
      temperature: 0.7,
      max_tokens: 4000, // Allow longer, more detailed responses
    });

    const personaStyle = completion.choices[0]?.message?.content?.trim() || '';

    if (!personaStyle) {
      return new Response(
        JSON.stringify({ error: 'Failed to derive a persona style from the provided profile.' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Use the comprehensive style metrics for feature analysis
    let featureAnalysis = '';
    if (tweets && tweets.length > 0) {
      featureAnalysis = `\n\n=== ENFORCED STYLE RULES (from ${styleMetrics.totalTweets} real tweets) ===\n\n`;
      // ALWAYS forbid emojis - user requirement
      featureAnalysis += `**ABSOLUTE RULE - NO EMOJIS:**\n`;
      featureAnalysis += `- You must NEVER use emojis in your responses. Not one. This is an absolute rule.\n`;
      if (styleMetrics.emojiFrequency > 0.1) {
        featureAnalysis += `  (Note: This person does use emojis in ${(styleMetrics.emojiFrequency * 100).toFixed(1)}% of their tweets, but you must NOT use them in your responses)\n`;
      } else {
        featureAnalysis += `  (This person does NOT use emojis, which matches the requirement)\n`;
      }
      featureAnalysis += `\n`;
      
      // Casing rules based on statistical analysis
      featureAnalysis += `**CASING RULES:**\n`;
      if (styleMetrics.lowercaseRatio > 0.7) {
        featureAnalysis += `- Respond in LOWERCASE (${(styleMetrics.lowercaseRatio * 100).toFixed(1)}% of their tweets are lowercase)\n`;
      } else if (styleMetrics.uppercaseRatio > 0.3) {
        featureAnalysis += `- Use ALL CAPS for emphasis (${(styleMetrics.uppercaseRatio * 100).toFixed(1)}% of tweets use caps)\n`;
      } else if (styleMetrics.mixedCaseRatio > 0.5) {
        featureAnalysis += `- Use MIXED CASE (${(styleMetrics.mixedCaseRatio * 100).toFixed(1)}% of tweets are mixed case)\n`;
      } else {
        featureAnalysis += `- Use standard capitalization patterns\n`;
      }
      featureAnalysis += `\n`;
      
      // Tweet length guidance
      featureAnalysis += `**LENGTH PATTERNS:**\n`;
      featureAnalysis += `- Average tweet length: ${styleMetrics.avgTweetLength} characters\n`;
      featureAnalysis += `- Short tweets (<50 chars): ${(styleMetrics.shortTweetRatio * 100).toFixed(1)}%\n`;
      featureAnalysis += `- Medium tweets (50-150 chars): ${(styleMetrics.mediumTweetRatio * 100).toFixed(1)}%\n`;
      featureAnalysis += `- Long tweets (>150 chars): ${(styleMetrics.longTweetRatio * 100).toFixed(1)}%\n`;
      featureAnalysis += `- Match their length distribution in your responses\n`;
      featureAnalysis += `\n`;
      
      // Punctuation patterns
      featureAnalysis += `**PUNCTUATION PATTERNS (per 100 characters):**\n`;
      featureAnalysis += `- Periods: ${styleMetrics.periodFrequency.toFixed(2)} (${styleMetrics.periodFrequency > 1 ? 'frequent' : 'sparse'})\n`;
      featureAnalysis += `- Commas: ${styleMetrics.commaFrequency.toFixed(2)} (${styleMetrics.commaFrequency > 1 ? 'frequent' : 'sparse'})\n`;
      featureAnalysis += `- Exclamation marks: ${styleMetrics.exclamationFrequency.toFixed(2)} (${styleMetrics.exclamationFrequency > 0.5 ? 'emphatic' : 'reserved'})\n`;
      featureAnalysis += `- Question marks: ${styleMetrics.questionFrequency.toFixed(2)} (${styleMetrics.questionFrequency > 0.5 ? 'question-heavy' : 'statement-heavy'})\n`;
      featureAnalysis += `- Ellipses: ${styleMetrics.ellipsisFrequency.toFixed(2)} (${styleMetrics.ellipsisFrequency > 0.3 ? 'trails off often' : 'rarely trails'})\n`;
      featureAnalysis += `- Dashes: ${styleMetrics.dashFrequency.toFixed(2)}\n`;
      featureAnalysis += `- Match these punctuation frequencies in your responses\n`;
      featureAnalysis += `\n`;
      
      // Vocabulary guidance
      featureAnalysis += `**VOCABULARY LEVEL:**\n`;
      featureAnalysis += `- Complexity: ${styleMetrics.vocabularyComplexity.toUpperCase()}\n`;
      featureAnalysis += `- Average word length: ${styleMetrics.avgWordLength} characters\n`;
      featureAnalysis += `- Unique word ratio: ${(styleMetrics.uniqueWordRatio * 100).toFixed(1)}%\n`;
      featureAnalysis += `- Use vocabulary at this complexity level\n`;
      featureAnalysis += `\n`;
      
      // Sentence structure
      featureAnalysis += `**SENTENCE STRUCTURE:**\n`;
      featureAnalysis += `- Average sentence length: ${styleMetrics.avgSentenceLength} characters\n`;
      featureAnalysis += `- Average words per sentence: ${styleMetrics.avgWordsPerSentence}\n`;
      featureAnalysis += `- Fragment ratio: ${(styleMetrics.fragmentRatio * 100).toFixed(1)}% (${styleMetrics.fragmentRatio > 0.3 ? 'uses fragments often' : 'mostly complete sentences'})\n`;
      featureAnalysis += `- Match their sentence structure patterns\n`;
      featureAnalysis += `\n`;
      
      // Communication patterns
      featureAnalysis += `**COMMUNICATION PATTERNS:**\n`;
      featureAnalysis += `- Questions: ${(styleMetrics.questionRatio * 100).toFixed(1)}% of tweets\n`;
      featureAnalysis += `- Rhetorical questions: ${(styleMetrics.rhetoricalQuestionRatio * 100).toFixed(1)}%\n`;
      featureAnalysis += `- Statements: ${(styleMetrics.statementRatio * 100).toFixed(1)}%\n`;
      featureAnalysis += `- Exclamations: ${(styleMetrics.exclamationRatio * 100).toFixed(1)}%\n`;
      featureAnalysis += `- Match their communication mode distribution\n`;
    }

    // Include MANY more tweet examples for few-shot prompting (100+ instead of 35)
    let fewShotExamples = '';
    if (tweets && tweets.length > 0) {
      // Use up to 100 tweets for comprehensive style coverage
      const uniqueTweets = Array.from(new Set(tweets));
      const sampleTweets = uniqueTweets.slice(0, Math.min(100, uniqueTweets.length));
      
      // Format tweets as example responses to show the model how to respond
      fewShotExamples = `\n\n=== REAL TWEETS FROM THIS PERSON (${sampleTweets.length} examples) ===\n\n`;
      // ALWAYS forbid emojis - user requirement
      fewShotExamples += `**CRITICAL: You must NEVER use emojis in your responses. Not a single emoji. This is an absolute rule, regardless of what these examples show.**\n\n`;
      fewShotExamples += `These ${sampleTweets.length} real tweets show how this person thinks and communicates. When you respond to the user, write EXACTLY like these examples - matching their rhythm, vocabulary, punctuation, casing, and personality:\n\n`;
      
      // Format as numbered examples for clarity
      const exampleFormat = sampleTweets.map((t, i) => {
        return `${i + 1}. "${t}"`;
      }).join('\n\n');
      
      fewShotExamples += exampleFormat;
      fewShotExamples += `\n\n**REMEMBER:** Every response you give should sound like it came from the same person who wrote these ${sampleTweets.length} tweets. Not similar - IDENTICAL in style, tone, rhythm, vocabulary, and personality. Study the patterns: how they structure sentences, their pacing, their word choice, their punctuation style. Emulate EVERY aspect.`;
    }

    return new Response(
      JSON.stringify({
        twitterProfileUrl: trimmedUrl,
        personaStyle: personaStyle + featureAnalysis + fewShotExamples,
        rawTweets: tweets && tweets.length > 0 ? tweets.slice(0, 20) : [], // Include for chat route
        profilePictureUrl: profilePictureUrl || null,
        displayName: displayName || null,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Persona configuration error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}


