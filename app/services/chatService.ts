import { Message, ThreadReply } from '../types';
import { ProcessedFile } from '../utils/fileProcessor';
import { Memory } from '../types';

interface ChatRequest {
  messages: any[];
  memories?: Memory[];
  twitterProfileUrl?: string;
  personaStyle?: string;
}

export async function sendChatMessage(
  messages: Message[],
  memories: Memory[],
  twitterProfileUrl?: string,
  personaStyle?: string,
  onStatus?: (status: string) => void,
  onContent?: (content: string) => void
): Promise<void> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: messages.map((msg) => {
        if (
          (msg.images && msg.images.length > 0) ||
          (msg.files && msg.files.some((f) => f.type === 'pdf' || f.type === 'image'))
        ) {
          const content: any[] = [];
          if (msg.content.trim()) {
            content.push({ type: 'text', text: msg.content });
          }
          if (msg.images) {
            msg.images.forEach((image) => {
              content.push({ type: 'image_url', image_url: { url: image } });
            });
          }
          if (msg.files) {
            msg.files.forEach((file) => {
              if (file.type === 'pdf' || file.type === 'image') {
                content.push({ type: 'image_url', image_url: { url: file.content } });
              }
            });
          }
          return { role: msg.role, content };
        }
        return { role: msg.role, content: msg.content };
      }),
      memories: memories.map((m) => ({ id: m.id, content: m.content })),
      twitterProfileUrl: twitterProfileUrl || undefined,
      personaStyle: personaStyle || undefined,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to get response');
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;
          if (data) {
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'status' && onStatus) {
                onStatus(parsed.content);
              } else if (parsed.type === 'content' || parsed.content) {
                if (parsed.type === 'content' && onStatus) {
                  onStatus('');
                }
                if (onContent) {
                  onContent(parsed.type === 'content' ? parsed.content : parsed.content);
                }
              }
            } catch (e) {
              // Ignore JSON parse errors
            }
          }
        }
      }
    }
  }
}

export async function sendThreadReply(
  allThreadMessages: any[],
  memories: Memory[],
  twitterProfileUrl?: string,
  personaStyle?: string,
  onContent?: (content: string) => void
): Promise<void> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: allThreadMessages,
      memories: memories.map((m) => ({ id: m.id, content: m.content })),
      twitterProfileUrl: twitterProfileUrl || undefined,
      personaStyle: personaStyle || undefined,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to get response');
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;
          if (data) {
            try {
              const parsed = JSON.parse(data);
              if (parsed.content && onContent) {
                onContent(parsed.content);
              }
            } catch (e) {
              // Ignore JSON parse errors
            }
          }
        }
      }
    }
  }
}

