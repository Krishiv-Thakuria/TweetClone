'use client';

interface ChatHeaderProps {
  assistantName: string;
  pinnedMessagesCount: number;
  onShowMemories: () => void;
  onShowPinned: () => void;
}

export default function ChatHeader({
  assistantName,
  pinnedMessagesCount,
  onShowMemories,
  onShowPinned,
}: ChatHeaderProps) {
  return (
    <header className="flex items-center justify-between p-3 border-b border-chat-border bg-chat-bg animate-slide-in-up">
      <div className="flex items-center gap-3">
        <button className="p-1.5 hover:bg-chat-input rounded transition-all duration-200 hover:scale-110 active:scale-95">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-white">
            <path
              d="M10 0a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm-1-11a1 1 0 0 1 2 0v4a1 1 0 0 1-2 0V7zm0 8a1 1 0 1 1 2 0 1 1 0 0 1-2 0z"
              fill="currentColor"
            />
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-white">{assistantName}</h1>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onShowMemories}
          className="p-2 hover:bg-chat-input rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 text-gray-400 hover:text-white"
          title="Memories"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-current">
            <path
              d="M8 0C3.6 0 0 3.6 0 8c0 1.4.4 2.7 1.1 3.8L0 16l4.2-1.1C5.3 15.6 6.6 16 8 16c4.4 0 8-3.6 8-8s-3.6-8-8-8z"
              fill="currentColor"
            />
          </svg>
        </button>
        <button
          onClick={onShowPinned}
          className={`p-2 hover:bg-chat-input rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 flex items-center gap-1.5 ${
            pinnedMessagesCount > 0
              ? 'text-[#F59E0B] hover:text-[#F59E0B]'
              : 'text-gray-400 hover:text-white'
          }`}
          title="Pinned Messages"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-current">
            <path
              d="M8 1l2 5h5l-4 3 1.5 5L8 12l-4.5 2L5 9 1 6h5l2-5z"
              fill="currentColor"
            />
          </svg>
          {pinnedMessagesCount > 0 && (
            <span className="text-xs font-medium">{pinnedMessagesCount}</span>
          )}
        </button>
      </div>
    </header>
  );
}

