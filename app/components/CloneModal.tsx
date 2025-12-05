'use client';

interface CloneModalProps {
  isOpen: boolean;
  cloneHandle: string;
  setCloneHandle: (handle: string) => void;
  isCloning: boolean;
  cloneError: string;
  clonePreviewName: string | null;
  clonePreviewAvatar: string | null;
  loadingImageError: boolean;
  setLoadingImageError: (error: boolean) => void;
  onStartClone: () => void;
  onConfirmClone: () => void;
  onClose: () => void;
}

export default function CloneModal({
  isOpen,
  cloneHandle,
  setCloneHandle,
  isCloning,
  cloneError,
  clonePreviewName,
  clonePreviewAvatar,
  loadingImageError,
  setLoadingImageError,
  onStartClone,
  onConfirmClone,
  onClose,
}: CloneModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fade-in">
      <div className="bg-[#202123] rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 border border-[#565869] animate-slide-in-up">
        <div className="mb-6 text-center">
          <h2 className="text-2xl md:text-3xl font-semibold text-white mb-2">
            Who do you want to clone?
          </h2>
          <p className="text-sm text-gray-400">
            Enter their X (Twitter) handle and we&apos;ll build an AI clone of their style.
          </p>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-wide text-gray-400">Handle</label>
            <div className="flex rounded-xl overflow-hidden bg-[#343541] border border-[#565869] focus-within:border-[#8e8ea0] transition-all duration-200">
              <span className="px-3 py-3 text-sm text-gray-400 bg-[#2b2c33] flex items-center">
                @
              </span>
              <input
                type="text"
                value={cloneHandle.replace(/^@/, '')}
                onChange={(e) => setCloneHandle(e.target.value)}
                placeholder="handle"
                className="flex-1 bg-transparent px-3 py-3 text-sm text-white placeholder-gray-500 outline-none"
                autoFocus
              />
              <button
                type="button"
                onClick={onStartClone}
                disabled={isCloning || !cloneHandle.trim()}
                className="px-5 py-3 bg-white text-black text-sm font-semibold hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
              >
                Go
              </button>
            </div>
          </div>

          {cloneError && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/40 rounded-lg px-3 py-2">
              {cloneError}
            </div>
          )}

          {(clonePreviewName || clonePreviewAvatar || isCloning) && (
            <div className="mt-2 flex flex-col items-center gap-3 py-4 rounded-2xl bg-[#111827]/60 border border-[#374151]">
              <div
                className={`w-24 h-24 rounded-full flex items-center justify-center overflow-hidden ${
                  isCloning && !clonePreviewAvatar ? 'clone-avatar-loading' : 'bg-[#111827]'
                }`}
              >
                {clonePreviewAvatar && !loadingImageError ? (
                  <img
                    src={clonePreviewAvatar}
                    alt={clonePreviewName || 'Clone avatar'}
                    className="w-full h-full object-cover"
                    onError={() => setLoadingImageError(true)}
                  />
                ) : (
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 16 16"
                    fill="none"
                    className="text-white"
                  >
                    <circle cx="8" cy="5.5" r="2.5" fill="currentColor" />
                    <ellipse cx="8" cy="11" rx="3.5" ry="2.8" fill="currentColor" />
                  </svg>
                )}
              </div>
              {clonePreviewName && (
                <div className="text-lg font-semibold text-white">{clonePreviewName}</div>
              )}
              <div className="flex flex-col items-center gap-1 mt-2 text-xs text-gray-300">
                {isCloning ? (
                  <>
                    <div className="flex gap-1 mb-1">
                      <div
                        className="w-1.5 h-1.5 bg-[#19C37D] rounded-full animate-pulse"
                        style={{ animationDelay: '0s' }}
                      />
                      <div
                        className="w-1.5 h-1.5 bg-[#19C37D] rounded-full animate-pulse"
                        style={{ animationDelay: '0.15s' }}
                      />
                      <div
                        className="w-1.5 h-1.5 bg-[#19C37D] rounded-full animate-pulse"
                        style={{ animationDelay: '0.3s' }}
                      />
                    </div>
                    <span>Analyzing tweets, stealing style, spinning up your clone...</span>
                  </>
                ) : clonePreviewName ? (
                  <>
                    <span className="mb-2 text-gray-300">
                      We&apos;ll use their public tweets to mimic how they think, talk, and tweet.
                    </span>
                    <button
                      type="button"
                      onClick={onConfirmClone}
                      className="mt-1 px-4 py-2 rounded-full bg-white text-black text-xs font-semibold hover:bg-gray-100 transition-all duration-200"
                    >
                      Continue to chat
                    </button>
                  </>
                ) : (
                  <span>We&apos;ll use their public tweets to mimic their writing style.</span>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <span className="text-xs text-gray-500">
              Your clone runs locally in this browser and can be reset anytime.
            </span>
            <button
              type="button"
              onClick={() => !isCloning && onClose()}
              className="text-xs text-gray-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-[#374151] transition-all duration-200"
              disabled={isCloning}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

