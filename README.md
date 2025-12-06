# TweetClone - Clone Anyone

TweetClone lets you clone anyone's Twitter/X personality and chat with an AI that responds exactly like them. Using statistical analysis of writing patterns, rhythm, vocabulary, and communication style, TweetClone tries to create highly accurate personality clones from Twitter profiles.

## 🌟 Features

### Core Functionality
- **Personality Cloning**: Clone any Twitter/X user's writing style and personality
- **Advanced Style Analysis**: Analyzes 1000+ tweets with comprehensive statistical breakdown
- **Real-time Chat**: Chat with cloned personalities in real-time
- **Conversation Management**: Organize conversations into folders, pin messages, and manage threads
- **Memory System**: Save important context that persists across conversations
- **File Support**: Upload images, PDFs, and text files for analysis

### Personality Analysis Features
- **Statistical Style Analysis**: Deep analysis of:
  - Vocabulary complexity and word choice patterns
  - Sentence structure and rhythm
  - Punctuation patterns (periods, commas, exclamations, questions, ellipses)
  - Casing patterns (lowercase, uppercase, mixed)
  - Communication patterns (questions, statements, rhetorical questions)
  - Pacing and tweet length distribution
  - Language style (contractions, slang, technical terms)

- **Comprehensive Tweet Analysis**: 
  - Analyzes up to 1000 tweets per profile
  - Uses 100+ tweets as few-shot examples
  - Multiple web searches for additional context
  - Strategic sampling across timeline for style consistency

- **Advanced AI Model**: Uses GPT-4o for sophisticated personality analysis and chat

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- OpenAI API key
- Twitter/X Bearer Token (for fetching tweets)
- (Optional) Tavily API key or SerpAPI key for enhanced web search

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Krishiv-Thakuria/TweetClone.git
   cd TweetClone
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Required
   OPENAI_API_KEY=your_openai_api_key_here
   TWITTER_BEARER_TOKEN=your_twitter_bearer_token_here
   
   # Optional (for enhanced web search)
   TAVILY_API_KEY=your_tavily_api_key_here
   # OR
   SERP_API_KEY=your_serpapi_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 How to Use

### Creating a Clone

1. **Click "New Clone"** in the sidebar
2. **Enter a Twitter/X handle** (e.g., `@elonmusk` or just `elonmusk`)
3. **Click "Go"** - The system will:
   - Fetch the user's profile information
   - Analyze up to 1000 of their tweets
   - Perform statistical analysis of their writing style
   - Create a comprehensive personality profile
4. **Review the preview** showing the person's name and profile picture
5. **Click "Continue to chat"** to start chatting with the clone

### Chatting with Clones

- **Send messages** as you would in any chat app
- **Upload files** (images, PDFs, text files) for analysis
- **Pin messages** for quick reference
- **Create threads** by clicking on messages to reply in context
- **Save conversations** to your sidebar for later

### Managing Conversations

- **Organize with folders**: Create folders and move conversations into them
- **Rename conversations**: Click the edit icon on any conversation
- **Delete conversations**: Click the delete icon
- **Search and navigate**: Use the sidebar to switch between conversations

### Memory System

- **Save memories**: Click the memory icon on user messages to save important context
- **Manage memories**: Click the memory icon in the header to view and edit all memories
- **Persistent context**: Memories are automatically included in all conversations

## 🏗️ Project Structure

```
TweetClone/
├── app/
│   ├── api/
│   │   ├── chat/          # Chat API endpoint
│   │   ├── persona/       # Personality cloning API
│   │   └── research/      # Research mode API
│   ├── components/         # React components
│   │   ├── ChatInput.tsx
│   │   ├── ChatMessage.tsx
│   │   ├── ConversationSidebar.tsx
│   │   ├── MemoryManager.tsx
│   │   ├── PinnedMessagesModal.tsx
│   │   ├── QueueDisplay.tsx
│   │   └── ThreadSidebar.tsx
│   ├── utils/              # Utility functions
│   │   ├── dateFormat.ts
│   │   ├── fileProcessor.ts
│   │   ├── styleAnalyzer.ts  # Advanced style analysis
│   │   ├── twitter.ts         # Twitter API integration
│   │   └── webSearch.ts      # Web search utilities
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── public/
├── .env                    # Environment variables (not committed)
├── .gitignore
├── package.json
├── README.md
└── tsconfig.json
```

## 🔧 Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | Your OpenAI API key for GPT-4o |
| `TWITTER_BEARER_TOKEN` | Yes | Twitter/X API v2 Bearer Token |
| `TAVILY_API_KEY` | No | Tavily API key for web search (recommended) |
| `SERP_API_KEY` | No | SerpAPI key (alternative to Tavily) |

### Getting API Keys

#### OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key

#### Twitter Bearer Token
1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a developer account and app
3. Generate a Bearer Token in your app settings
4. Copy the token to your `.env` file

#### Tavily API Key (Optional)
1. Go to [Tavily](https://tavily.com/)
2. Sign up for an account
3. Get your API key from the dashboard

## 🎨 Features in Detail

### Personality Cloning Algorithm

The cloning process uses a sophisticated multi-step analysis:

1. **Data Collection**: Fetches up to 1000 tweets from the target profile
2. **Statistical Analysis**: Analyzes vocabulary, sentence structure, punctuation, casing, and rhythm
3. **Web Research**: Performs multiple web searches for additional context
4. **Style Profiling**: Creates a comprehensive profile using GPT-4o
5. **Few-Shot Examples**: Selects 100+ representative tweets as examples
6. **Personality Synthesis**: Combines all data into a detailed personality profile

### Style Analysis Metrics

The system analyzes:
- **Vocabulary**: Complexity, word length, unique word ratio, technical terms
- **Structure**: Sentence length, fragment ratio, words per sentence
- **Punctuation**: Frequency of periods, commas, exclamations, questions, ellipses
- **Casing**: Lowercase/uppercase/mixed patterns
- **Rhythm**: Tweet length distribution, pacing patterns
- **Communication**: Question/statement ratios, rhetorical patterns
- **Language**: Contraction frequency, slang indicators

## 🛠️ Development

### Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI**: OpenAI GPT-4o
- **Markdown**: React Markdown with GFM support
- **File Processing**: PDF.js for PDF handling

### Available Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## 📝 License

This project is private and proprietary. All rights reserved.

## 🤝 Contributing

This is a private project. Contributions are not currently accepted.

## ⚠️ Important Notes

- **Privacy**: This tool clones public Twitter personalities. Do not use it to impersonate or misrepresent others.
- **API Costs**: Using GPT-4o and fetching many tweets can incur API costs. Monitor your usage.
- **Rate Limits**: Twitter API has rate limits. The app handles this gracefully, but very active usage may hit limits.
- **Data Storage**: All conversations and memories are stored locally in your browser (localStorage).

## 🐛 Troubleshooting

### Clone not working?
- Check that `TWITTER_BEARER_TOKEN` is set correctly
- Verify the Twitter handle is correct and the account is public
- Check browser console for errors

### API errors?
- Verify all API keys are set in `.env`
- Check API key permissions and quotas
- Ensure you have internet connectivity

### Style not matching?
- The algorithm analyzes up to 1000 tweets - accounts with fewer tweets may have less accurate clones
- Very new or inactive accounts may not have enough data
- Some writing styles are inherently harder to capture

## 📧 Support

For issues or questions, please open an issue on the GitHub repository.
