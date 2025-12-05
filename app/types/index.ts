import { ProcessedFile } from '../utils/fileProcessor';
import { Conversation, Folder } from '../components/ConversationSidebar';
import { Memory } from '../components/MemoryManager';

export { Memory };

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  images?: string[];
  files?: ProcessedFile[];
  timestamp: Date;
  pinned?: boolean;
}

export interface ThreadReply {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  images?: string[];
}

export interface QueuedMessage {
  id: string;
  content: string;
  images?: string[];
  files?: ProcessedFile[];
  timestamp: Date;
}

export { Conversation, Folder };

