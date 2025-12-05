'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { formatMessageTimestamp } from '../utils/dateFormat';
import { ProcessedFile, getFileIcon } from '../utils/fileProcessor';

interface ChatMessageProps {
  message: {
    role: 'user' | 'assistant';
    content: string;
    images?: string[];
    files?: ProcessedFile[];
    timestamp: Date;
    pinned?: boolean;
  };
  messageIndex: number;
  replyCount: number;
  onOpenThread: (messageIndex: number) => void;
  onTogglePin?: (messageIndex: number) => void;
  isPinned?: boolean;
  onSaveAsMemory?: (content: string) => void;
  profilePictureUrl?: string;
  assistantName?: string;
}

export default function ChatMessage({
  message,
  messageIndex,
  replyCount,
  onOpenThread,
  onTogglePin,
  isPinned = false,
  onSaveAsMemory,
  profilePictureUrl,
  assistantName = 'Chat',
}: ChatMessageProps) {
  const isUser = message.role === 'user';
  const [imageError, setImageError] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    // TODO: Add toast notification
  };

  const handleMoreOptions = () => {
    onOpenThread(messageIndex);
  };

  return (
    <div className={`group flex items-start gap-4 py-6 bg-[#343541]`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ml-4 overflow-hidden ${
          isUser ? 'bg-[#5436DA]' : 'bg-[#19C37D]'
        }`}
      >
        {isUser ? (
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="text-white"
            style={{ display: 'block', margin: '0 auto' }}
          >
            <circle cx="8" cy="5.5" r="2" fill="currentColor" />
            <ellipse cx="8" cy="11" rx="3" ry="2.5" fill="currentColor" />
          </svg>
        ) : profilePictureUrl && !imageError ? (
          <img
            src={profilePictureUrl}
            alt="Chatbot profile"
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="text-white"
            style={{ display: 'block', margin: '0 auto' }}
          >
            <circle cx="8" cy="8" r="2.5" fill="white" />
          </svg>
        )}
      </div>
      <div className="flex-1 min-w-0 pr-4">
        <div className="flex items-center gap-2 mb-1">
          {isPinned && (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-[#F59E0B] flex-shrink-0" title="Pinned">
              <path d="M8 1l2 5h5l-4 3 1.5 5L8 12l-4.5 2L5 9 1 6h5l2-5z" fill="currentColor"/>
            </svg>
          )}
          <span className="text-sm font-medium text-white">
            {isUser ? 'You' : assistantName}
          </span>
          <span className="text-xs text-gray-400">
            {formatMessageTimestamp(message.timestamp)}
          </span>
        </div>
        {message.images && message.images.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {message.images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Image ${index + 1}`}
                className="max-w-full h-auto max-h-64 rounded-lg border border-[#565869] cursor-pointer hover:opacity-90 hover:scale-[1.02] transition-all duration-300 animate-scale-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              />
            ))}
          </div>
        )}
        {message.files && message.files.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {message.files.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-2 bg-[#40414f] rounded-lg border border-[#565869] hover:bg-[#565869] hover:border-[#8e8ea0] transition-all duration-300 animate-scale-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <span className="text-lg">{getFileIcon(file.name, file.mimeType)}</span>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm text-white truncate max-w-[200px]">{file.name}</span>
                  {file.type === 'text' && (
                    <span className="text-xs text-gray-400">
                      {file.content.length > 100
                        ? `${file.content.substring(0, 100)}...`
                        : file.content}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="text-[#d1d5db] break-words leading-relaxed prose prose-invert prose-p:my-2 prose-headings:my-3 prose-ul:my-2 prose-ol:my-2 prose-li:my-1 max-w-none">
          {isUser ? (
            <div className="whitespace-pre-wrap">{message.content}</div>
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          )}
        </div>
        {replyCount > 0 && (
          <div className="mt-2 flex items-center gap-1.5 text-sm text-[#10a37f] cursor-pointer hover:text-[#0d8c6e] transition-colors duration-200">
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              className="text-current"
            >
              <path
                d="M8 0C3.6 0 0 3.6 0 8c0 1.4.4 2.7 1.1 3.8L0 16l4.2-1.1C5.3 15.6 6.6 16 8 16c4.4 0 8-3.6 8-8s-3.6-8-8-8z"
                fill="currentColor"
              />
            </svg>
            <span onClick={handleMoreOptions}>
              {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
            </span>
          </div>
        )}
        {isUser && onSaveAsMemory && (
          <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSaveAsMemory(message.content);
              }}
              className="p-1.5 hover:bg-[#40414f] rounded transition-all duration-200 hover:scale-110 active:scale-95 text-[#8e8ea0] hover:text-[#19C37D]"
              title="Save as memory"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="text-current"
              >
                <path
                  d="M8 0C3.6 0 0 3.6 0 8c0 1.4.4 2.7 1.1 3.8L0 16l4.2-1.1C5.3 15.6 6.6 16 8 16c4.4 0 8-3.6 8-8s-3.6-8-8-8z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
        )}
        {!isUser && (
          <div className="flex items-center gap-1 mt-3">
            {onTogglePin && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin(messageIndex);
                }}
                className={`p-1.5 hover:bg-[#40414f] rounded transition-all duration-200 hover:scale-110 active:scale-95 ${
                  isPinned
                    ? 'text-[#F59E0B] hover:text-[#F59E0B]'
                    : 'text-[#8e8ea0] hover:text-[#ececf1]'
                }`}
                title={isPinned ? 'Unpin message' : 'Pin message'}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="text-current"
                  stroke={isPinned ? 'currentColor' : 'none'}
                  fill={isPinned ? 'none' : 'currentColor'}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M8 1l2 5h5l-4 3 1.5 5L8 12l-4.5 2L5 9 1 6h5l2-5z" />
                </svg>
              </button>
            )}
            <button
              onClick={handleCopy}
              className="p-1.5 hover:bg-[#40414f] rounded transition-all duration-200 hover:scale-110 active:scale-95 text-[#8e8ea0] hover:text-[#ececf1]"
              title="Copy"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="text-current"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="5" y="5" width="8" height="8" rx="1" />
                <path d="M5 5V3a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
            <button
              onClick={handleMoreOptions}
              className="p-1.5 hover:bg-[#40414f] rounded transition-all duration-200 hover:scale-110 active:scale-95 text-[#8e8ea0] hover:text-[#ececf1]"
              title="Open thread"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="text-current"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 2h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H8l-3 3v-3H3a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
                <line x1="5" y1="7" x2="11" y2="7" strokeWidth="1.5" />
                <line x1="5" y1="9" x2="9" y2="9" strokeWidth="1.5" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

