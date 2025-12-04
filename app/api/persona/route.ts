import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { performWebSearch } from '../../utils/webSearch';
import { getRecentTweetsFromProfileUrl, getTwitterProfilePictureUrl } from '../../utils/twitter';

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

    // Get profile picture URL
    const profilePictureUrl = await getTwitterProfilePictureUrl(trimmedUrl);

    // First attempt: use the official Twitter/X API (via helper) to get recent tweets.
    // This requires TWITTER_BEARER_TOKEN to be set in the environment.
    const tweets = await getRecentTweetsFromProfileUrl(trimmedUrl, 200);

    // Secondary signal: fall back to web search if we couldn't pull tweets directly
    let searchResults: any[] = [];
    try {
      const genericResults = await performWebSearch(
        `Recent tweets and writing style of the person at this Twitter/X profile: ${trimmedUrl}. Focus on their most recent posts and how they write, not on biographical details.`
      );
      if (genericResults && genericResults.length > 0) {
        searchResults = genericResults;
      }
    } catch (err) {
      console.error('Error during persona web search for profile:', trimmedUrl, err);
    }

    let systemMessage;
    let userMessage;

    // Case 1: we have some tweet-like content (tweets and/or search snippets)
    if ((tweets && tweets.length > 0) || (searchResults && searchResults.length > 0)) {
      // Sample tweets to balance recency and variety:
      // - Take the first N for recency
      // - Take some from the middle and end if we have enough, to avoid only capturing a transient phase
      const maxExamples = 80;
      const sampledTweets: string[] = [];
      const uniqueTweets = Array.from(new Set(tweets)); // basic de-dup

      const addSample = (idx: number) => {
        if (idx >= 0 && idx < uniqueTweets.length) {
          sampledTweets.push(uniqueTweets[idx]);
        }
      };

      // Always take the most recent chunk
      const recentCount = Math.min(40, uniqueTweets.length);
      for (let i = 0; i < recentCount; i++) addSample(i);

      // If we have more history, sample from middle and older sections
      if (uniqueTweets.length > recentCount) {
        const middleStart = Math.floor(uniqueTweets.length / 3);
        const olderStart = Math.floor((2 * uniqueTweets.length) / 3);
        for (let i = 0; i < 20 && sampledTweets.length < maxExamples; i++) {
          addSample(middleStart + i);
          addSample(olderStart + i);
        }
      }

      const tweetsSection =
        sampledTweets.length > 0
          ? `TWEETS (mixed recent + older, de-duplicated, truncated if necessary):\n${sampledTweets
              .slice(0, maxExamples)
              .map((t) => `- ${t}`)
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
          'You are an expert at distilling Twitter/X writing style from noisy web snippets and raw tweet text. You focus on surface-level style (casing, punctuation, emojis, slang, rhythm) and give tweet-like micro-examples, not biography.',
      };

      userMessage = {
        role: 'user' as const,
        content: `Below are raw tweets (when available) and web search snippets that approximate this Twitter/X user's **recent tweets**.\n\n${combinedContext}\n\nYour task is to create a COMPREHENSIVE personality and writing style profile that captures this person's ESSENCE, not just surface features. This profile will be used to make an AI respond EXACTLY like this person, not like GPT with a personality layer.\n\n**STEP 1: Deep Analysis** (be extremely precise):\n- Emoji usage: Count them. YES/NO. If NO, state it explicitly and emphasize it.\n- Casing pattern: all lowercase / ALL CAPS / mixed / normal (be specific)\n- Punctuation: minimal / heavy / specific patterns (ellipses? exclamation marks? periods?)\n- Average tweet length: count characters\n- Tone: formal / casual / blunt / humorous / sarcastic / serious / self-deprecating / confident / aggressive / etc.\n- Vocabulary: simple / complex / technical / slang-heavy / academic / street / etc.\n- Sentence structure: simple / complex / fragments / run-ons / varied\n- Personality traits visible in writing: Are they confident? Anxious? Playful? Serious? Cynical? Optimistic? Argumentative? Supportive? Introverted? Extroverted?\n- Communication style: Do they explain things? Do they make statements? Do they ask questions? Do they tell stories? Do they debate? Do they share thoughts?\n- Thinking patterns: Are they analytical? Emotional? Logical? Intuitive? Do they jump to conclusions? Do they overthink?\n- What makes them unique? What patterns or quirks stand out?\n- How do they handle different topics? (serious vs casual, technical vs simple, etc.)\n\n**STEP 2: Create a detailed personality-rooted style description** (10–15 bullet points):\nThis should capture WHO this person is at their core, not just how they write. Include:\n- Their core personality (confident? self-deprecating? aggressive? kind? anxious? playful?)\n- Their thinking style (analytical? emotional? quick? methodical?)\n- How they communicate (do they explain? do they assert? do they question? do they tell stories?)\n- Their relationship with language (do they play with words? are they direct? are they poetic? are they technical?)\n- Their communication patterns (do they use metaphors? do they use examples? do they use data? do they use emotions?)\n- Pacing and rhythm (fast? slow? choppy? flowing?)\n- Sentence length and structure patterns\n- Formality level\n- Emoji usage (or complete absence - be EXPLICIT)\n- Slang and vocabulary choices\n- Humor style (if any) - dry? self-deprecating? dark? light? witty?\n- Any unique quirks, catchphrases, or patterns\n- What topics/themes do they gravitate toward?\n- How do they handle disagreement or criticism?\n- What would make their response sound "off" or "not them"?\n\n**STEP 3: Extract 25–35 actual tweet examples** that best represent their style and personality. Preserve EXACT casing, punctuation, and emoji patterns. These will be used as few-shot examples.\n\n**STEP 4: Provide 10–12 additional synthetic example sentences** that feel like them but are generic (no private details). These should demonstrate their personality, not just their style. Show how they'd respond to different types of questions.\n\n**STEP 5: List common GPT patterns that would be WRONG for this person** (3–5 examples):\nWhat would generic GPT say that this person would NEVER say? What phrases or patterns should be avoided?\n\nReturn everything as a single markdown-formatted blob. The description should be so detailed that someone reading it could embody this person's personality and write authentically as them. Make it VERY clear if the person does NOT use emojis, or writes in all lowercase, etc.`,
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

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [systemMessage, userMessage],
      temperature: 0.7,
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

    // Analyze tweets to detect features for explicit instructions
    let featureAnalysis = '';
    let hasEmojis = false; // Store for use in few-shot examples
    if (tweets && tweets.length > 0) {
      const allText = tweets.join(' ');
      // More comprehensive emoji detection (includes all Unicode emoji ranges)
      const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{2190}-\u{21FF}]|[\u{2300}-\u{23FF}]|[\u{2B00}-\u{2BFF}]|[\u{FE00}-\u{FE0F}]|[\u{200D}]/gu;
      const emojiMatches = allText.match(emojiRegex);
      const emojiCount = emojiMatches ? emojiMatches.length : 0;
      const tweetsWithEmojis = tweets.filter(t => emojiRegex.test(t)).length;
      const emojiFrequency = tweetsWithEmojis / tweets.length;
      hasEmojis = emojiFrequency > 0.1; // More than 10% of tweets have emojis
      
      const mostlyLowercase = tweets.filter(t => t === t.toLowerCase() && t.length > 10).length / tweets.length > 0.7;
      const hasAllCaps = tweets.some(t => t === t.toUpperCase() && t.length > 5);
      const avgLength = tweets.reduce((sum, t) => sum + t.length, 0) / tweets.length;
      
      featureAnalysis = `\n\nFEATURE ANALYSIS (from ${tweets.length} real tweets):\n`;
      // ALWAYS forbid emojis - user requirement
      featureAnalysis += `- Emojis: ABSOLUTELY FORBIDDEN - You must NEVER use emojis. Not one. This is an absolute rule.\n`;
      if (hasEmojis) {
        featureAnalysis += `  (Note: This person does use emojis in their tweets, but you must NOT use them in your responses)\n`;
      } else {
        featureAnalysis += `  (This person does NOT use emojis, which matches the requirement)\n`;
      }
      featureAnalysis += `- Casing: ${mostlyLowercase ? 'MOSTLY LOWERCASE (respond in lowercase)' : hasAllCaps ? 'OFTEN ALL CAPS (use caps for emphasis)' : 'MIXED/NORMAL'}\n`;
      featureAnalysis += `- Average tweet length: ~${Math.round(avgLength)} characters\n`;
    }

    // Include actual tweet examples for few-shot prompting - MORE examples for better style matching
    let fewShotExamples = '';
    if (tweets && tweets.length > 0) {
      // Use up to 35 tweets for better style coverage (matching the persona generation request)
      const sampleTweets = tweets.slice(0, Math.min(35, tweets.length));
      
      // Format tweets as example responses to show the model how to respond
      fewShotExamples = `\n\nREAL TWEETS FROM THIS PERSON - THESE ARE EXAMPLES OF HOW THEY RESPOND:\n`;
      // ALWAYS forbid emojis - user requirement
      fewShotExamples += `**CRITICAL: You must NEVER use emojis in your responses. Not a single emoji. This is an absolute rule, regardless of what these examples show.**\n\n`;
      fewShotExamples += `These ${sampleTweets.length} real tweets show how this person thinks and communicates. When you respond to the user, write EXACTLY like these examples:\n\n`;
      
      // Format as example responses (some as standalone thoughts, some as if responding to questions)
      const exampleFormat = sampleTweets.slice(0, 20).map((t, i) => {
        // Alternate between different formats to show variety
        if (i % 3 === 0) {
          return `Example response ${Math.floor(i/3) + 1}: "${t}"`;
        } else if (i % 3 === 1) {
          return `How they'd respond: "${t}"`;
        } else {
          return `Their style: "${t}"`;
        }
      }).join('\n\n');
      
      fewShotExamples += exampleFormat;
      fewShotExamples += `\n\n**REMEMBER:** Every response you give should sound like it came from the same person who wrote these tweets. Not similar - IDENTICAL in style, tone, and personality.`;
    }

    return new Response(
      JSON.stringify({
        twitterProfileUrl: trimmedUrl,
        personaStyle: personaStyle + featureAnalysis + fewShotExamples,
        rawTweets: tweets && tweets.length > 0 ? tweets.slice(0, 20) : [], // Include for chat route
        profilePictureUrl: profilePictureUrl || null,
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


