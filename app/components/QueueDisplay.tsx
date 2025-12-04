'use client';

import { formatMessageTimestamp } from '../utils/dateFormat';
import { ProcessedFile } from '../utils/fileProcessor';

interface QueuedMessage {
  id: string;
  content: string;
  images?: string[];
  files?: ProcessedFile[];
  timestamp: Date;
}

interface QueueDisplayProps {
  queue: QueuedMessage[];
  onRemove: (id: string) => void;
  onClear: () => void;
  isProcessing: boolean;
}

export default function QueueDisplay({ queue, onRemove, onClear, isProcessing }: QueueDisplayProps) {
  if (queue.length === 0) return null;

  return (
    <div className="border-b border-chat-border bg-[#202123] px-4 py-3 animate-slide-in-up">
      <div className="max-w-3xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 overflow-x-auto">
          <div className="flex items-center gap-2 text-sm text-gray-400 flex-shrink-0">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="text-current"
            >
              <path
                d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm0 14A6 6 0 1 1 8 2a6 6 0 0 1 0 12z"
                fill="currentColor"
              />
              <path
                d="M8 4v4l3 2"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <span className="font-medium">
              {isProcessing ? 'Processing...' : 'Queued'} ({queue.length})
            </span>
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {queue.map((msg, index) => (
              <div
                key={msg.id}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border flex-shrink-0 transition-all duration-300 animate-scale-in ${
                  index === 0 && isProcessing
                    ? 'border-[#19C37D] bg-[#19C37D]/10 animate-pulse'
                    : 'border-[#565869] bg-[#40414f] hover:bg-[#565869]'
                }`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {msg.images && msg.images.length > 0 && (
                  <div className="flex items-center gap-1">
                    {msg.images.slice(0, 1).map((img, imgIndex) => (
                      <img
                        key={imgIndex}
                        src={img}
                        alt=""
                        className="w-4 h-4 rounded object-cover"
                      />
                    ))}
                    {msg.images.length > 1 && (
                      <span className="text-xs text-gray-400">+{msg.images.length - 1}</span>
                    )}
                  </div>
                )}
                <span className="text-xs text-gray-300 truncate max-w-[150px]">
                  {msg.content || 'Image'}
                </span>
                <button
                  onClick={() => onRemove(msg.id)}
                  className="p-0.5 hover:bg-[#565869] rounded transition-all duration-200 hover:scale-110 active:scale-95 text-gray-400 hover:text-white flex-shrink-0"
                  title="Remove from queue"
                >
                  <svg
                    width="12"
                    height="12"
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
            ))}
          </div>
        </div>
        {queue.length > 0 && (
          <button
            onClick={onClear}
            className="px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-[#40414f] rounded transition-all duration-200 hover:scale-105 active:scale-95 flex-shrink-0 ml-2"
            title="Clear queue"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

