'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ChatInput from './ChatInput';
import { formatMessageTimestamp } from '../utils/dateFormat';
import { ProcessedFile } from '../utils/fileProcessor';

interface ThreadReply {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  images?: string[];
  files?: ProcessedFile[];
}

interface ThreadSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  messageIndex: number;
  messageContent: string;
  messageImages?: string[];
  threadReplies: ThreadReply[];
  onSendReply: (content: string, images?: string[]) => void;
  isLoading?: boolean;
  profilePictureUrl?: string;
  assistantName?: string;
}

export default function ThreadSidebar({
  isOpen,
  onClose,
  messageIndex,
  messageContent,
  messageImages,
  threadReplies,
  onSendReply,
  isLoading = false,
  profilePictureUrl,
}: ThreadSidebarProps) {
  const [imageError, setImageError] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const repliesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && repliesEndRef.current) {
      repliesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, threadReplies]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);


  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`fixed top-0 right-0 h-full w-full md:w-[400px] bg-[#343541] shadow-2xl z-50 transform transition-all duration-300 ease-out ${
          isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        } flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#565869]">
          <h2 className="text-lg font-semibold text-white">Thread</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#40414f] rounded transition-all duration-200 hover:scale-110 active:scale-95 text-gray-400 hover:text-white"
              title="Close thread"
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
        </div>

        {/* Original Message */}
        <div className="p-4 border-b border-[#565869] bg-[#343541]">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#19C37D] flex items-center justify-center flex-shrink-0 overflow-hidden">
              {profilePictureUrl && !imageError ? (
                <img
                  src={profilePictureUrl}
                  alt="Chatbot profile"
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="text-white"
                  style={{ display: 'block', margin: '0 auto' }}
                >
                  <circle cx="8" cy="8" r="2.5" fill="white" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white mb-1">{assistantName || 'Chat'}</div>
              {messageImages && messageImages.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {messageImages.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`Image ${index + 1}`}
                      className="max-w-full h-auto max-h-48 rounded-lg border border-[#565869]"
                    />
                  ))}
                </div>
              )}
              <div className="text-[#d1d5db] text-sm break-words prose prose-invert prose-sm prose-p:my-2 prose-headings:my-3 prose-ul:my-2 prose-ol:my-2 prose-li:my-1 max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {messageContent}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>

        {/* Thread Replies */}
        <div className="flex-1 overflow-y-auto">
          {threadReplies.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              No replies yet
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {threadReplies.map((reply, index) => {
                const isUser = reply.role === 'user';
                return (
                  <div
                    key={index}
                    className={`flex items-start gap-3 animate-slide-in-right ${isUser ? '' : 'bg-[#343541]'}`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${
                        isUser ? 'bg-[#5436DA]' : 'bg-[#19C37D]'
                      }`}
                    >
                      {isUser ? (
                        <svg
                          width="12"
                          height="12"
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
                          width="12"
                          height="12"
                          viewBox="0 0 16 16"
                          fill="none"
                          className="text-white"
                          style={{ display: 'block', margin: '0 auto' }}
                        >
                          <circle cx="8" cy="8" r="2.5" fill="white" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-white">
                          {isUser ? 'You' : assistantName || 'Chat'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatMessageTimestamp(reply.timestamp)}
                        </span>
                      </div>
                      {reply.images && reply.images.length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-2">
                          {reply.images.map((image, imgIndex) => (
                            <img
                              key={imgIndex}
                              src={image}
                              alt={`Image ${imgIndex + 1}`}
                              className="max-w-full h-auto max-h-48 rounded-lg border border-[#565869]"
                            />
                          ))}
                        </div>
                      )}
                      {reply.files && reply.files.length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-2">
                          {reply.files.map((file, fileIndex) => (
                            <div
                              key={fileIndex}
                              className="flex items-center gap-2 px-2 py-1.5 bg-[#40414f] rounded border border-[#565869] text-xs"
                            >
                              <span>{file.type === 'pdf' ? '📄' : file.type === 'text' ? '📝' : '📎'}</span>
                              <span className="text-gray-300 truncate max-w-[150px]">{file.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="text-[#d1d5db] text-sm break-words prose prose-invert prose-sm prose-p:my-2 prose-headings:my-3 prose-ul:my-2 prose-ol:my-2 prose-li:my-1 max-w-none">
                        {isUser ? (
                          <div className="whitespace-pre-wrap">{reply.content}</div>
                        ) : (
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {reply.content}
                          </ReactMarkdown>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {isLoading && threadReplies.length > 0 && threadReplies[threadReplies.length - 1]?.role !== 'assistant' && (
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#19C37D] flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {profilePictureUrl && !imageError ? (
                      <img
                        src={profilePictureUrl}
                        alt="Chatbot profile"
                        className="w-full h-full object-cover"
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 16 16"
                        fill="none"
                        className="text-white"
                        style={{ display: 'block', margin: '0 auto' }}
                      >
                        <circle cx="8" cy="8" r="2.5" fill="white" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white mb-1">{assistantName || 'Chat'}</div>
                    <div className="text-[#d1d5db] flex items-center gap-1">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-[#19C37D] rounded-full animate-pulse" style={{ animationDelay: '0s' }}></div>
                        <div className="w-1.5 h-1.5 bg-[#19C37D] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-1.5 h-1.5 bg-[#19C37D] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={repliesEndRef} />
            </div>
          )}
        </div>

        {/* Reply Input */}
        <div className="border-t border-[#565869] p-4">
          <ChatInput onSend={onSendReply} disabled={isLoading} placeholder="Reply..." />
        </div>
      </div>
    </>
  );
}

