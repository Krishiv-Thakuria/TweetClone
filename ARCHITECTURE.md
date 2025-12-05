# TweetClone Architecture Guide

## How TweetClone Works

TweetClone uses a sophisticated multi-stage process to clone Twitter personalities. Here's how it works and where to find each part:

---

## 🎯 The Complete Flow

### Stage 1: Clone Creation (When you click "New Clone")

**Location:** `app/api/persona/route.ts`

1. **Fetch Tweets** (Lines 37)
   - Fetches up to **1000 tweets** from Twitter/X API
   - See: `app/utils/twitter.ts` → `getRecentTweetsFromProfileUrl()`

2. **Statistical Analysis** (Lines 60-61)
   - Analyzes writing style using advanced metrics
   - See: `app/utils/styleAnalyzer.ts` → `analyzeWritingStyle()`
   - Calculates:
     - Vocabulary complexity (word length, unique words)
     - Sentence structure (length, fragments)
     - Punctuation patterns (periods, commas, exclamations, questions, ellipses)
     - Casing patterns (lowercase, uppercase, mixed)
     - Rhythm & pacing (tweet length distribution)
     - Communication patterns (questions vs statements)

3. **Web Research** (Lines 40-57)
   - Performs 4 parallel web searches for additional context
   - See: `app/utils/webSearch.ts`

4. **Tweet Sampling** (Lines 68-103)
   - Strategically samples up to **150 tweets** for analysis
   - Takes 80 most recent tweets (current style)
   - Samples evenly across timeline (style consistency)
   - These become the **few-shot examples**

5. **GPT-4o Analysis** (Lines 125-159)
   - Sends everything to GPT-4o with a detailed 11-step prompt
   - GPT analyzes and creates a comprehensive personality profile
   - The prompt asks for:
     - Rhythm & pacing analysis
     - Vocabulary depth analysis
     - Punctuation pattern analysis
     - Casing pattern analysis
     - Communication pattern analysis
     - Tone & personality deep dive
     - Content patterns
     - Comprehensive style profile (20-25 bullet points)
     - **80-100 best tweet examples** (few-shot examples)
     - 20-25 synthetic example sentences
     - GPT patterns to avoid

6. **Few-Shot Examples Extraction** (Lines 245-265)
   - Extracts up to **100 real tweets** as few-shot examples
   - Formats them as numbered examples
   - **THIS IS WHERE THE FEW-SHOT PROMPTING HAPPENS**

7. **Style Rules Generation** (Lines 173-243)
   - Creates enforced style rules based on statistical analysis
   - Includes casing rules, length patterns, punctuation patterns, vocabulary level

8. **Return Persona** (Lines 267-279)
   - Combines everything: `personaStyle + featureAnalysis + fewShotExamples`
   - Stores in localStorage
   - Returns to frontend

---

### Stage 2: Chat (When you send a message)

**Location:** `app/api/chat/route.ts`

1. **Extract Persona Components** (Lines 34-55)
   - Parses the stored persona to extract:
     - Few-shot examples (the 100 tweets)
     - Feature analysis (statistical rules)
     - Style description (personality profile)
     - GPT patterns to avoid

2. **Build System Prompt** (Lines 67)
   - Creates a powerful system prompt that:
     - Tells GPT to forget its default identity
     - Includes the few-shot examples
     - Includes statistical style rules
     - Includes personality profile
     - Includes GPT patterns to avoid
   - **THIS IS WHERE FEW-SHOT PROMPTING IS APPLIED**

3. **Send to GPT-4o** (Lines 126-132)
   - Sends user message with the persona system prompt
   - GPT responds in the cloned personality's style

---

## 📍 Where to See Few-Shot Prompting

### 1. **Few-Shot Examples Creation**
**File:** `app/api/persona/route.ts`
- **Lines 245-265**: Where 100 tweets are formatted as few-shot examples
- **Lines 253-264**: The exact format of few-shot examples
- Look for: `=== REAL TWEETS FROM THIS PERSON`

### 2. **Few-Shot Examples Extraction**
**File:** `app/api/chat/route.ts`
- **Line 36**: Regex that extracts few-shot examples from persona
- **Line 39**: The extracted few-shot examples
- **Line 67**: Where few-shot examples are inserted into system prompt
- Look for: `**YOUR WRITING EXAMPLES - RESPOND EXACTLY LIKE THESE**`

### 3. **Few-Shot Examples in Action**
The few-shot examples appear in the system prompt like this:
```
**YOUR WRITING EXAMPLES - RESPOND EXACTLY LIKE THESE (but NO emojis):**

=== REAL TWEETS FROM THIS PERSON (100 examples) ===

1. "First tweet example..."
2. "Second tweet example..."
3. "Third tweet example..."
...
100. "Hundredth tweet example..."

**REMEMBER:** Every response you give should sound like it came from the same person...
```

---

## 📊 Where to See Statistical Analysis

### 1. **Style Analysis Function**
**File:** `app/utils/styleAnalyzer.ts`
- **Lines 1-401**: Complete statistical analysis implementation
- **Lines 3-100**: `StyleMetrics` interface (all metrics calculated)
- **Lines 102-401**: `analyzeWritingStyle()` function
  - Calculates vocabulary complexity
  - Analyzes sentence structure
  - Counts punctuation patterns
  - Measures casing patterns
  - Calculates rhythm & pacing
  - Detects communication patterns

### 2. **Metrics Formatting**
**File:** `app/utils/styleAnalyzer.ts`
- **Lines 403-501**: `formatStyleMetricsForPrompt()` function
- Formats all metrics into readable text for GPT

### 3. **Metrics Usage**
**File:** `app/api/persona/route.ts`
- **Line 60**: `analyzeWritingStyle(tweets)` - calculates metrics
- **Line 61**: `formatStyleMetricsForPrompt(styleMetrics)` - formats for prompt
- **Line 133**: Metrics are included in the GPT analysis prompt
- **Lines 173-243**: Metrics are used to create enforced style rules

---

## 🧠 Where to See Personality Analysis

### 1. **GPT Analysis Prompt**
**File:** `app/api/persona/route.ts`
- **Lines 131-134**: The massive 11-step analysis prompt
- Asks GPT to analyze:
  - Rhythm & pacing (Step 1)
  - Vocabulary depth (Step 2)
  - Punctuation patterns (Step 3)
  - Casing patterns (Step 4)
  - Communication patterns (Step 5)
  - Tone & personality (Step 6)
  - Content patterns (Step 7)
  - Create style profile (Step 8)
  - Extract tweet examples (Step 9)
  - Create synthetic examples (Step 10)
  - Identify GPT patterns to avoid (Step 11)

### 2. **Personality Profile Storage**
**File:** `app/api/persona/route.ts`
- **Line 161**: GPT returns the personality profile
- **Line 270**: Profile is combined with metrics and few-shot examples
- **File:** `app/hooks/usePersona.ts`
- **Lines 15-18**: Profile is stored in localStorage

---

## 💬 Where to See Chat Application

### 1. **System Prompt Construction**
**File:** `app/api/chat/route.ts`
- **Lines 34-67**: Extracts and builds the system prompt
- **Line 67**: The complete system prompt with:
  - Few-shot examples
  - Style rules
  - Personality profile
  - GPT patterns to avoid

### 2. **Message Sending**
**File:** `app/services/chatService.ts`
- **Lines 1-120**: Handles chat API calls
- Formats messages for vision API if images/files present
- Streams responses back

### 3. **Frontend Chat**
**File:** `app/page.tsx`
- **Lines 1-508**: Main chat interface
- Uses hooks to manage state
- **File:** `app/hooks/useMessages.ts`
- Handles message state and API calls

---

## 🔑 Key Files to Explore

### Core Algorithm Files:
1. **`app/api/persona/route.ts`** - Clone creation (THE MAIN ALGORITHM)
   - Lines 37: Fetches tweets
   - Lines 60-61: Statistical analysis
   - Lines 68-103: Tweet sampling for few-shot
   - Lines 131-134: GPT analysis prompt
   - Lines 245-265: Few-shot examples formatting
   - Lines 173-243: Style rules generation

2. **`app/utils/styleAnalyzer.ts`** - Statistical analysis
   - Lines 102-401: `analyzeWritingStyle()` - calculates all metrics
   - Lines 403-501: `formatStyleMetricsForPrompt()` - formats for GPT

3. **`app/api/chat/route.ts`** - Chat with persona
   - Lines 34-55: Extracts persona components
   - Line 67: Builds system prompt with few-shot examples
   - Lines 126-132: Sends to GPT-4o

### Supporting Files:
4. **`app/utils/twitter.ts`** - Twitter API integration
   - `getRecentTweetsFromProfileUrl()` - fetches up to 1000 tweets

5. **`app/utils/webSearch.ts`** - Web research
   - Performs searches for additional context

6. **`app/services/personaService.ts`** - Persona API wrapper
   - `createPersona()` - calls the persona API

7. **`app/services/chatService.ts`** - Chat API wrapper
   - `sendChatMessage()` - handles chat streaming

---

## 🎨 The Magic Formula

```
Personality Clone = 
  Statistical Analysis (1000 tweets) +
  GPT-4o Deep Analysis (11-step prompt) +
  100 Few-Shot Examples (real tweets) +
  Enforced Style Rules (from statistics) +
  Personality Profile (from GPT analysis)
```

All of this gets combined into a single system prompt that makes GPT-4o respond exactly like the cloned person.

---

## 🔍 How to Debug/Inspect

### See the Persona Being Created:
1. Open browser DevTools → Network tab
2. Click "New Clone" and enter a handle
3. Look for `/api/persona` request
4. Check the Response - you'll see the full persona with few-shot examples

### See the Chat Prompt:
1. Open browser DevTools → Network tab
2. Send a message in chat
3. Look for `/api/chat` request
4. Check the Request Payload → `personaStyle` field
5. This contains the full system prompt with few-shot examples

### See Statistical Metrics:
1. Add `console.log(styleMetrics)` in `app/api/persona/route.ts` line 61
2. Check server console when creating a clone
3. You'll see all calculated metrics

---

## 📈 The Algorithm's Strengths

1. **1000 Tweets Analyzed** - Much more data than typical approaches
2. **Statistical Grounding** - Real metrics, not just GPT guessing
3. **100 Few-Shot Examples** - Massive context for style matching
4. **Multi-Stage Analysis** - Statistical + GPT analysis + web research
5. **Enforced Rules** - Hard rules from statistics prevent drift
6. **Strategic Sampling** - Recent tweets + timeline sampling for consistency

---

## 🎯 Quick Reference: Where Things Happen

| What | Where | Lines |
|------|-------|-------|
| Fetch tweets | `app/utils/twitter.ts` | `getRecentTweetsFromProfileUrl()` |
| Statistical analysis | `app/utils/styleAnalyzer.ts` | `analyzeWritingStyle()` |
| Tweet sampling | `app/api/persona/route.ts` | 68-103 |
| Few-shot creation | `app/api/persona/route.ts` | 245-265 |
| GPT analysis | `app/api/persona/route.ts` | 131-134, 154-159 |
| Style rules | `app/api/persona/route.ts` | 173-243 |
| Extract few-shot | `app/api/chat/route.ts` | 36, 39 |
| Apply persona | `app/api/chat/route.ts` | 67 |
| Chat streaming | `app/services/chatService.ts` | `sendChatMessage()` |

---

This architecture ensures that the AI doesn't just mimic surface features, but truly understands and replicates the deep structure of how someone thinks and communicates.

