// Advanced style analysis utilities for personality cloning

export interface StyleMetrics {
  // Basic metrics
  totalTweets: number;
  avgTweetLength: number;
  medianTweetLength: number;
  minTweetLength: number;
  maxTweetLength: number;
  
  // Vocabulary analysis
  avgWordLength: number;
  uniqueWordRatio: number;
  totalWords: number;
  uniqueWords: number;
  vocabularyComplexity: 'simple' | 'moderate' | 'complex' | 'very complex';
  
  // Sentence structure
  avgSentenceLength: number;
  avgWordsPerSentence: number;
  sentenceCount: number;
  fragmentRatio: number; // Tweets that are fragments vs complete sentences
  
  // Punctuation patterns
  periodFrequency: number; // per 100 chars
  commaFrequency: number;
  exclamationFrequency: number;
  questionFrequency: number;
  ellipsisFrequency: number;
  dashFrequency: number;
  
  // Casing patterns
  lowercaseRatio: number;
  uppercaseRatio: number;
  titleCaseRatio: number;
  mixedCaseRatio: number;
  allCapsTweets: number;
  
  // Emoji patterns
  emojiCount: number;
  tweetsWithEmojis: number;
  emojiFrequency: number;
  
  // Rhythm and pacing
  avgWordsPerTweet: number;
  shortTweetRatio: number; // < 50 chars
  mediumTweetRatio: number; // 50-150 chars
  longTweetRatio: number; // > 150 chars
  
  // Question patterns
  questionRatio: number;
  rhetoricalQuestionRatio: number;
  
  // Statement patterns
  statementRatio: number;
  exclamationRatio: number;
  
  // Special patterns
  hashtagFrequency: number;
  mentionFrequency: number;
  linkFrequency: number;
  
  // Language style
  contractionFrequency: number;
  slangIndicators: number;
  technicalTermFrequency: number;
}

export function analyzeWritingStyle(tweets: string[]): StyleMetrics {
  if (tweets.length === 0) {
    return getEmptyMetrics();
  }

  const allText = tweets.join(' ');
  const words = allText
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 0 && !w.match(/^https?:\/\//));
  
  const uniqueWords = new Set(words);
  const totalWords = words.length;
  const uniqueWordCount = uniqueWords.size;
  
  // Tweet length analysis
  const tweetLengths = tweets.map(t => t.length);
  const avgTweetLength = tweetLengths.reduce((a, b) => a + b, 0) / tweetLengths.length;
  const sortedLengths = [...tweetLengths].sort((a, b) => a - b);
  const medianTweetLength = sortedLengths[Math.floor(sortedLengths.length / 2)];
  const minTweetLength = Math.min(...tweetLengths);
  const maxTweetLength = Math.max(...tweetLengths);
  
  // Word length analysis
  const wordLengths = words.map(w => w.replace(/[^\w]/g, '').length).filter(l => l > 0);
  const avgWordLength = wordLengths.length > 0 
    ? wordLengths.reduce((a, b) => a + b, 0) / wordLengths.length 
    : 0;
  
  // Vocabulary complexity
  const avgWordLengthForComplexity = avgWordLength;
  const uniqueWordRatio = totalWords > 0 ? uniqueWordCount / totalWords : 0;
  let vocabularyComplexity: 'simple' | 'moderate' | 'complex' | 'very complex' = 'moderate';
  if (avgWordLengthForComplexity < 4 && uniqueWordRatio < 0.3) {
    vocabularyComplexity = 'simple';
  } else if (avgWordLengthForComplexity > 5.5 && uniqueWordRatio > 0.5) {
    vocabularyComplexity = 'very complex';
  } else if (avgWordLengthForComplexity > 4.5 || uniqueWordRatio > 0.4) {
    vocabularyComplexity = 'complex';
  }
  
  // Sentence structure
  const sentences = allText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentenceCount = sentences.length;
  const avgSentenceLength = sentenceCount > 0 
    ? sentences.reduce((sum, s) => sum + s.length, 0) / sentenceCount 
    : 0;
  const avgWordsPerSentence = sentenceCount > 0 
    ? sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentenceCount 
    : 0;
  
  // Fragments (tweets without sentence-ending punctuation)
  const fragments = tweets.filter(t => !/[.!?]$/.test(t.trim()));
  const fragmentRatio = tweets.length > 0 ? fragments.length / tweets.length : 0;
  
  // Punctuation frequency (per 100 characters)
  const totalChars = allText.length;
  const periodCount = (allText.match(/\./g) || []).length;
  const commaCount = (allText.match(/,/g) || []).length;
  const exclamationCount = (allText.match(/!/g) || []).length;
  const questionCount = (allText.match(/\?/g) || []).length;
  const ellipsisCount = (allText.match(/\.{2,}/g) || []).length;
  const dashCount = (allText.match(/[-—–]/g) || []).length;
  
  const periodFrequency = totalChars > 0 ? (periodCount / totalChars) * 100 : 0;
  const commaFrequency = totalChars > 0 ? (commaCount / totalChars) * 100 : 0;
  const exclamationFrequency = totalChars > 0 ? (exclamationCount / totalChars) * 100 : 0;
  const questionFrequency = totalChars > 0 ? (questionCount / totalChars) * 100 : 0;
  const ellipsisFrequency = totalChars > 0 ? (ellipsisCount / totalChars) * 100 : 0;
  const dashFrequency = totalChars > 0 ? (dashCount / totalChars) * 100 : 0;
  
  // Casing analysis
  const lowercaseTweets = tweets.filter(t => {
    const textOnly = t.replace(/[^a-zA-Z]/g, '');
    return textOnly.length > 10 && textOnly === textOnly.toLowerCase();
  });
  const uppercaseTweets = tweets.filter(t => {
    const textOnly = t.replace(/[^a-zA-Z]/g, '');
    return textOnly.length > 5 && textOnly === textOnly.toUpperCase();
  });
  const allCapsTweets = uppercaseTweets.length;
  
  const lowercaseRatio = tweets.length > 0 ? lowercaseTweets.length / tweets.length : 0;
  const uppercaseRatio = tweets.length > 0 ? uppercaseTweets.length / tweets.length : 0;
  
  // Mixed case (has both upper and lower)
  const mixedCaseTweets = tweets.filter(t => {
    const textOnly = t.replace(/[^a-zA-Z]/g, '');
    return textOnly.length > 5 && 
           /[a-z]/.test(textOnly) && 
           /[A-Z]/.test(textOnly) &&
           textOnly !== textOnly.toUpperCase() &&
           textOnly !== textOnly.toLowerCase();
  });
  const mixedCaseRatio = tweets.length > 0 ? mixedCaseTweets.length / tweets.length : 0;
  
  // Title case (starts with capital, rest mixed)
  const titleCaseTweets = tweets.filter(t => {
    const firstChar = t.trim().charAt(0);
    return /[A-Z]/.test(firstChar) && t.length > 5;
  });
  const titleCaseRatio = tweets.length > 0 ? titleCaseTweets.length / tweets.length : 0;
  
  // Emoji analysis
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{2190}-\u{21FF}]|[\u{2300}-\u{23FF}]|[\u{2B00}-\u{2BFF}]|[\u{FE00}-\u{FE0F}]|[\u{200D}]/gu;
  const emojiMatches = allText.match(emojiRegex);
  const emojiCount = emojiMatches ? emojiMatches.length : 0;
  const tweetsWithEmojis = tweets.filter(t => emojiRegex.test(t)).length;
  const emojiFrequency = tweets.length > 0 ? tweetsWithEmojis / tweets.length : 0;
  
  // Rhythm and pacing
  const avgWordsPerTweet = tweets.length > 0
    ? tweets.reduce((sum, t) => sum + t.split(/\s+/).length, 0) / tweets.length
    : 0;
  
  const shortTweets = tweets.filter(t => t.length < 50).length;
  const mediumTweets = tweets.filter(t => t.length >= 50 && t.length <= 150).length;
  const longTweets = tweets.filter(t => t.length > 150).length;
  
  const shortTweetRatio = tweets.length > 0 ? shortTweets / tweets.length : 0;
  const mediumTweetRatio = tweets.length > 0 ? mediumTweets / tweets.length : 0;
  const longTweetRatio = tweets.length > 0 ? longTweets / tweets.length : 0;
  
  // Question patterns
  const questionTweets = tweets.filter(t => t.includes('?'));
  const questionRatio = tweets.length > 0 ? questionTweets.length / tweets.length : 0;
  
  // Rhetorical questions (questions that don't expect answers - heuristic: questions without question words)
  const rhetoricalQuestions = questionTweets.filter(t => {
    const lower = t.toLowerCase();
    return !lower.includes('what') && !lower.includes('when') && 
           !lower.includes('where') && !lower.includes('who') && 
           !lower.includes('why') && !lower.includes('how') &&
           !lower.includes('which');
  });
  const rhetoricalQuestionRatio = tweets.length > 0 ? rhetoricalQuestions.length / tweets.length : 0;
  
  // Statement patterns
  const statementTweets = tweets.filter(t => /[.!]$/.test(t.trim()));
  const statementRatio = tweets.length > 0 ? statementTweets.length / tweets.length : 0;
  
  const exclamationTweets = tweets.filter(t => t.includes('!'));
  const exclamationRatio = tweets.length > 0 ? exclamationTweets.length / tweets.length : 0;
  
  // Special patterns
  const hashtagCount = (allText.match(/#\w+/g) || []).length;
  const mentionCount = (allText.match(/@\w+/g) || []).length;
  const linkCount = (allText.match(/https?:\/\/\S+/g) || []).length;
  
  const hashtagFrequency = tweets.length > 0 ? hashtagCount / tweets.length : 0;
  const mentionFrequency = tweets.length > 0 ? mentionCount / tweets.length : 0;
  const linkFrequency = tweets.length > 0 ? linkCount / tweets.length : 0;
  
  // Language style
  const contractions = (allText.match(/\b(n't|'ll|'re|'ve|'d|'m|'s)\b/gi) || []).length;
  const contractionFrequency = totalWords > 0 ? contractions / totalWords : 0;
  
  // Slang indicators (heuristic: short words, abbreviations, etc.)
  const slangPatterns = /\b(yeah|nah|gonna|wanna|gotta|ain't|y'all|bruh|dope|lit|fire|lowkey|highkey|fr|ngl|tbh|imo|smh|fml|lol|omg|wtf)\b/gi;
  const slangMatches = allText.match(slangPatterns);
  const slangIndicators = slangMatches ? slangMatches.length : 0;
  
  // Technical terms (heuristic: longer words, specific patterns)
  const technicalPatterns = /\b(algorithm|api|database|framework|protocol|infrastructure|architecture|implementation|optimization|configuration)\b/gi;
  const technicalMatches = allText.match(technicalPatterns);
  const technicalTermFrequency = tweets.length > 0 ? (technicalMatches ? technicalMatches.length : 0) / tweets.length : 0;
  
  return {
    totalTweets: tweets.length,
    avgTweetLength: Math.round(avgTweetLength),
    medianTweetLength,
    minTweetLength,
    maxTweetLength,
    avgWordLength: Math.round(avgWordLength * 10) / 10,
    uniqueWordRatio: Math.round(uniqueWordRatio * 1000) / 1000,
    totalWords,
    uniqueWords: uniqueWordCount,
    vocabularyComplexity,
    avgSentenceLength: Math.round(avgSentenceLength),
    avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
    sentenceCount,
    fragmentRatio: Math.round(fragmentRatio * 1000) / 1000,
    periodFrequency: Math.round(periodFrequency * 100) / 100,
    commaFrequency: Math.round(commaFrequency * 100) / 100,
    exclamationFrequency: Math.round(exclamationFrequency * 100) / 100,
    questionFrequency: Math.round(questionFrequency * 100) / 100,
    ellipsisFrequency: Math.round(ellipsisFrequency * 100) / 100,
    dashFrequency: Math.round(dashFrequency * 100) / 100,
    lowercaseRatio: Math.round(lowercaseRatio * 1000) / 1000,
    uppercaseRatio: Math.round(uppercaseRatio * 1000) / 1000,
    titleCaseRatio: Math.round(titleCaseRatio * 1000) / 1000,
    mixedCaseRatio: Math.round(mixedCaseRatio * 1000) / 1000,
    allCapsTweets,
    emojiCount,
    tweetsWithEmojis,
    emojiFrequency: Math.round(emojiFrequency * 1000) / 1000,
    avgWordsPerTweet: Math.round(avgWordsPerTweet * 10) / 10,
    shortTweetRatio: Math.round(shortTweetRatio * 1000) / 1000,
    mediumTweetRatio: Math.round(mediumTweetRatio * 1000) / 1000,
    longTweetRatio: Math.round(longTweetRatio * 1000) / 1000,
    questionRatio: Math.round(questionRatio * 1000) / 1000,
    rhetoricalQuestionRatio: Math.round(rhetoricalQuestionRatio * 1000) / 1000,
    statementRatio: Math.round(statementRatio * 1000) / 1000,
    exclamationRatio: Math.round(exclamationRatio * 1000) / 1000,
    hashtagFrequency: Math.round(hashtagFrequency * 100) / 100,
    mentionFrequency: Math.round(mentionFrequency * 100) / 100,
    linkFrequency: Math.round(linkFrequency * 100) / 100,
    contractionFrequency: Math.round(contractionFrequency * 1000) / 1000,
    slangIndicators,
    technicalTermFrequency: Math.round(technicalTermFrequency * 100) / 100,
  };
}

function getEmptyMetrics(): StyleMetrics {
  return {
    totalTweets: 0,
    avgTweetLength: 0,
    medianTweetLength: 0,
    minTweetLength: 0,
    maxTweetLength: 0,
    avgWordLength: 0,
    uniqueWordRatio: 0,
    totalWords: 0,
    uniqueWords: 0,
    vocabularyComplexity: 'moderate',
    avgSentenceLength: 0,
    avgWordsPerSentence: 0,
    sentenceCount: 0,
    fragmentRatio: 0,
    periodFrequency: 0,
    commaFrequency: 0,
    exclamationFrequency: 0,
    questionFrequency: 0,
    ellipsisFrequency: 0,
    dashFrequency: 0,
    lowercaseRatio: 0,
    uppercaseRatio: 0,
    titleCaseRatio: 0,
    mixedCaseRatio: 0,
    allCapsTweets: 0,
    emojiCount: 0,
    tweetsWithEmojis: 0,
    emojiFrequency: 0,
    avgWordsPerTweet: 0,
    shortTweetRatio: 0,
    mediumTweetRatio: 0,
    longTweetRatio: 0,
    questionRatio: 0,
    rhetoricalQuestionRatio: 0,
    statementRatio: 0,
    exclamationRatio: 0,
    hashtagFrequency: 0,
    mentionFrequency: 0,
    linkFrequency: 0,
    contractionFrequency: 0,
    slangIndicators: 0,
    technicalTermFrequency: 0,
  };
}

export function formatStyleMetricsForPrompt(metrics: StyleMetrics): string {
  if (metrics.totalTweets === 0) {
    return '';
  }

  let analysis = `\n\n=== DETAILED STATISTICAL STYLE ANALYSIS (from ${metrics.totalTweets} tweets) ===\n\n`;
  
  // Basic metrics
  analysis += `**TWEET LENGTH PATTERNS:**\n`;
  analysis += `- Average: ${metrics.avgTweetLength} characters\n`;
  analysis += `- Median: ${metrics.medianTweetLength} characters\n`;
  analysis += `- Range: ${metrics.minTweetLength} - ${metrics.maxTweetLength} characters\n`;
  analysis += `- Short tweets (<50 chars): ${(metrics.shortTweetRatio * 100).toFixed(1)}%\n`;
  analysis += `- Medium tweets (50-150 chars): ${(metrics.mediumTweetRatio * 100).toFixed(1)}%\n`;
  analysis += `- Long tweets (>150 chars): ${(metrics.longTweetRatio * 100).toFixed(1)}%\n\n`;
  
  // Vocabulary
  analysis += `**VOCABULARY COMPLEXITY:**\n`;
  analysis += `- Average word length: ${metrics.avgWordLength} characters\n`;
  analysis += `- Unique word ratio: ${(metrics.uniqueWordRatio * 100).toFixed(1)}% (${metrics.uniqueWords} unique words out of ${metrics.totalWords} total)\n`;
  analysis += `- Complexity level: ${metrics.vocabularyComplexity.toUpperCase()}\n`;
  analysis += `- Technical terms frequency: ${metrics.technicalTermFrequency.toFixed(2)} per tweet\n`;
  analysis += `- Slang indicators: ${metrics.slangIndicators} instances\n\n`;
  
  // Sentence structure
  analysis += `**SENTENCE STRUCTURE:**\n`;
  analysis += `- Average sentence length: ${metrics.avgSentenceLength} characters\n`;
  analysis += `- Average words per sentence: ${metrics.avgWordsPerSentence}\n`;
  analysis += `- Average words per tweet: ${metrics.avgWordsPerTweet}\n`;
  analysis += `- Fragment ratio (incomplete sentences): ${(metrics.fragmentRatio * 100).toFixed(1)}%\n`;
  analysis += `- Total sentences analyzed: ${metrics.sentenceCount}\n\n`;
  
  // Punctuation
  analysis += `**PUNCTUATION PATTERNS (frequency per 100 characters):**\n`;
  analysis += `- Periods: ${metrics.periodFrequency.toFixed(2)}\n`;
  analysis += `- Commas: ${metrics.commaFrequency.toFixed(2)}\n`;
  analysis += `- Exclamation marks: ${metrics.exclamationFrequency.toFixed(2)}\n`;
  analysis += `- Question marks: ${metrics.questionFrequency.toFixed(2)}\n`;
  analysis += `- Ellipses (...): ${metrics.ellipsisFrequency.toFixed(2)}\n`;
  analysis += `- Dashes: ${metrics.dashFrequency.toFixed(2)}\n\n`;
  
  // Casing
  analysis += `**CASING PATTERNS:**\n`;
  analysis += `- Mostly lowercase tweets: ${(metrics.lowercaseRatio * 100).toFixed(1)}%\n`;
  analysis += `- Mostly uppercase tweets: ${(metrics.uppercaseRatio * 100).toFixed(1)}%\n`;
  analysis += `- Title case tweets: ${(metrics.titleCaseRatio * 100).toFixed(1)}%\n`;
  analysis += `- Mixed case tweets: ${(metrics.mixedCaseRatio * 100).toFixed(1)}%\n`;
  analysis += `- All-caps tweets: ${metrics.allCapsTweets}\n\n`;
  
  // Rhythm and pacing
  analysis += `**RHYTHM & PACING:**\n`;
  analysis += `- Question ratio: ${(metrics.questionRatio * 100).toFixed(1)}% of tweets\n`;
  analysis += `- Rhetorical questions: ${(metrics.rhetoricalQuestionRatio * 100).toFixed(1)}% of tweets\n`;
  analysis += `- Statement ratio: ${(metrics.statementRatio * 100).toFixed(1)}% of tweets\n`;
  analysis += `- Exclamation ratio: ${(metrics.exclamationRatio * 100).toFixed(1)}% of tweets\n\n`;
  
  // Special patterns
  analysis += `**SPECIAL PATTERNS:**\n`;
  analysis += `- Hashtags per tweet: ${metrics.hashtagFrequency.toFixed(2)}\n`;
  analysis += `- Mentions per tweet: ${metrics.mentionFrequency.toFixed(2)}\n`;
  analysis += `- Links per tweet: ${metrics.linkFrequency.toFixed(2)}\n`;
  analysis += `- Contraction frequency: ${(metrics.contractionFrequency * 100).toFixed(1)}% of words\n\n`;
  
  // Emoji (always forbidden but documented)
  analysis += `**EMOJI USAGE (FORBIDDEN IN RESPONSES):**\n`;
  analysis += `- Total emojis found: ${metrics.emojiCount}\n`;
  analysis += `- Tweets with emojis: ${metrics.tweetsWithEmojis} (${(metrics.emojiFrequency * 100).toFixed(1)}%)\n`;
  analysis += `- **CRITICAL: You must NEVER use emojis in your responses, regardless of these statistics.**\n\n`;
  
  return analysis;
}

