# ChatGPT Clone

A simple chat application that uses the OpenAI GPT API with streaming responses, designed to look like ChatGPT.

## Features

- 🎨 ChatGPT-like dark theme UI
- ⚡ Streaming responses for real-time chat experience
- 💬 Clean and modern interface
- 🔒 Secure API key handling via environment variables
- 🔍 **Deep Research Mode** - Comprehensive web research with multiple sources
- 📎 File attachments (PDFs, images, text files)
- 🖼️ Image upload and vision capabilities
- ⏱️ Message timestamps synced with device time
- 📋 Message queue for follow-up prompts
- 🎭 Smooth animations throughout

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```env
OPENAI_API_KEY=your_openai_api_key_here

# Optional: For Deep Research feature (web search)
# Get your API key from https://tavily.com
TAVILY_API_KEY=your_tavily_api_key_here

# Alternative: SerpAPI for web search
# Get your API key from https://serpapi.com
SERP_API_KEY=your_serpapi_key_here
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **OpenAI SDK** - GPT API integration with streaming support

## Usage

1. Enter your message in the input field at the bottom
2. Press Enter or click the send button
3. Watch the AI response stream in real-time
4. Continue the conversation by sending more messages

## Notes

- Make sure you have a valid OpenAI API key
- The app uses `gpt-3.5-turbo` model by default
- Responses are streamed in real-time for a better user experience


