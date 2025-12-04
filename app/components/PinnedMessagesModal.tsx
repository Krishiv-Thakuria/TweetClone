'use client';

import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { formatMessageTimestamp } from '../utils/dateFormat';
import { ProcessedFile } from '../utils/fileProcessor';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  images?: string[];
  files?: ProcessedFile[];
  timestamp: Date;
  pinned?: boolean;
}

interface PinnedMessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  pinnedMessages: Set<number>;
  messages: Message[];
  onNavigateToMessage: (index: number) => void;
  onTogglePin: (messageIndex: number) => void;
}

export default function PinnedMessagesModal({
  isOpen,
  onClose,
  pinnedMessages,
  messages,
  onNavigateToMessage,
  onTogglePin,
}: PinnedMessagesModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const pinnedIndices = Array.from(pinnedMessages).sort((a, b) => a - b);
  const pinnedMessagesList = pinnedIndices.map(index => ({
    index,
    message: messages[index],
  }));

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#343541] rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#565869]">
            <div className="flex items-center gap-2">
              <svg
                width="20"
                height="20"
                viewBox="0 0 16 16"
                fill="none"
                className="text-[#F59E0B]"
              >
                <path d="M8 1l2 5h5l-4 3 1.5 5L8 12l-4.5 2L5 9 1 6h5l2-5z" fill="currentColor"/>
              </svg>
              <h2 className="text-lg font-semibold text-white">
                Pinned Messages ({pinnedMessages.size})
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#40414f] rounded transition-all duration-200 hover:scale-110 active:scale-95 text-gray-400 hover:text-white"
              title="Close"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="text-current"
              >
                <path
                  d="M12 4L4 12M4 4l8 8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {pinnedMessagesList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="mb-4 opacity-50"
                >
                  <path d="M8 1l2 5h5l-4 3 1.5 5L8 12l-4.5 2L5 9 1 6h5l2-5z" fill="currentColor"/>
                </svg>
                <p className="text-sm">No pinned messages yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pinnedMessagesList.map(({ index, message }) => {
                  const isUser = message.role === 'user';
                  return (
                    <div
                      key={index}
                      className="bg-[#40414f] rounded-lg p-4 hover:bg-[#565869] transition-colors duration-200 cursor-pointer border border-[#565869] hover:border-[#8e8ea0]"
                      onClick={() => {
                        onNavigateToMessage(index);
                        onClose();
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
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
                            >
                              <circle cx="8" cy="5.5" r="2" fill="currentColor" />
                              <ellipse cx="8" cy="11" rx="3" ry="2.5" fill="currentColor" />
                            </svg>
                          ) : (
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 16 16"
                              fill="none"
                              className="text-white"
                            >
                              <circle cx="8" cy="8" r="2.5" fill="white" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-400">
                              {isUser ? 'You' : 'Assistant'}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">
                                {formatMessageTimestamp(message.timestamp)}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onTogglePin(index);
                                }}
                                className="p-1 hover:bg-[#40414f] rounded transition-all duration-200 text-[#F59E0B] hover:text-[#F59E0B]"
                                title="Unpin message"
                              >
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 16 16"
                                  fill="none"
                                  className="text-current"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M8 1l2 5h5l-4 3 1.5 5L8 12l-4.5 2L5 9 1 6h5l2-5z" />
                                </svg>
                              </button>
                            </div>
                          </div>
                          <div className="text-sm text-[#d1d5db] line-clamp-3">
                            {isUser ? (
                              <div className="whitespace-pre-wrap">
                                {String(message.content || '').substring(0, 200)}
                                {String(message.content || '').length > 200 ? '...' : ''}
                              </div>
                            ) : (
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                className="prose prose-invert prose-sm max-w-none"
                                components={{
                                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                  ul: ({ children }) => <ul className="mb-2 list-disc list-inside">{children}</ul>,
                                  ol: ({ children }) => <ol className="mb-2 list-decimal list-inside">{children}</ol>,
                                  li: ({ children }) => <li className="mb-1">{children}</li>,
                                  code: ({ children, className }) => {
                                    const isInline = !className;
                                    const codeContent = Array.isArray(children) ? children.join('') : String(children || '');
                                    return isInline ? (
                                      <code className="bg-[#565869] px-1 py-0.5 rounded text-xs">{codeContent}</code>
                                    ) : (
                                      <code className={className}>{children}</code>
                                    );
                                  },
                                  pre: ({ children }) => (
                                    <pre className="bg-[#565869] p-2 rounded overflow-x-auto text-xs mb-2">{children}</pre>
                                  ),
                                }}
                              >
                                {String(message.content || '').substring(0, 200) + (String(message.content || '').length > 200 ? '...' : '')}
                              </ReactMarkdown>
                            )}
                          </div>
                          {message.images && message.images.length > 0 && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                                <circle cx="6" cy="6" r="1.5" fill="currentColor"/>
                                <path d="M2 10l3-3 2 2 4-4 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                              </svg>
                              {message.images.length} image{message.images.length > 1 ? 's' : ''}
                            </div>
                          )}
                          {message.files && message.files.length > 0 && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                <path d="M4 2h8l2 4v8H4V2z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                                <path d="M4 2v12" stroke="currentColor" strokeWidth="1.5"/>
                              </svg>
                              {message.files.length} file{message.files.length > 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

