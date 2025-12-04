'use client';

import { useState, useRef, useEffect } from 'react';
import { processFile, ProcessedFile, getFileIcon } from '../utils/fileProcessor';

interface ChatInputProps {
  onSend: (message: string, images?: string[], files?: ProcessedFile[], researchMode?: boolean) => void;
  disabled?: boolean;
  placeholder?: string;
  queueMode?: boolean;
  onQueueModeChange?: (enabled: boolean) => void;
  researchMode?: boolean;
  onResearchModeChange?: (enabled: boolean) => void;
}

export default function ChatInput({
  onSend,
  disabled,
  placeholder = 'Ask anything',
  queueMode = false,
  onQueueModeChange,
  researchMode = false,
  onResearchModeChange,
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  useEffect(() => {
    // Focus the textarea when it becomes enabled
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImagePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          try {
            const base64 = await convertFileToBase64(file);
            setImages((prev) => [...prev, base64]);
          } catch (error) {
            console.error('Error converting image:', error);
          }
        }
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    setIsProcessing(true);
    try {
      for (const file of Array.from(selectedFiles)) {
        try {
          // Check if it's a simple image (for backward compatibility)
          if (file.type.startsWith('image/') && !file.type.includes('pdf')) {
            const base64 = await convertFileToBase64(file);
            setImages((prev) => [...prev, base64]);
          } else {
            // Process as file attachment (PDF, text, etc.)
            const processed = await processFile(file);
            setFiles((prev) => [...prev, ...processed]);
            
            // If PDF was converted to images, also add to images array
            const pdfImages = processed.filter(f => f.type === 'pdf' || f.type === 'image');
            if (pdfImages.length > 0) {
              const imageData = pdfImages.map(f => f.content);
              setImages((prev) => [...prev, ...imageData]);
            }
          }
        } catch (error) {
          console.error('Error processing file:', error);
          alert(`Error processing ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    } finally {
      setIsProcessing(false);
      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In queue mode, allow submitting even if disabled (for queuing)
    // Only block if processing files
    if ((input.trim() || images.length > 0 || files.length > 0) && !isProcessing && (!disabled || queueMode)) {
      onSend(
        input,
        images.length > 0 ? images : undefined,
        files.length > 0 ? files : undefined,
        researchMode
      );
      setInput('');
      setImages([]);
      setFiles([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        // Focus the textarea after sending
        setTimeout(() => {
          textareaRef.current?.focus();
        }, 0);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4">
      {(images.length > 0 || files.length > 0) && (
        <div className="mb-2 flex flex-wrap gap-2 animate-slide-in-up">
          {images.map((image, index) => (
            <div 
              key={`img-${index}`} 
              className="relative inline-block animate-scale-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <img
                src={image}
                alt={`Upload ${index + 1}`}
                className="h-20 w-20 object-cover rounded-lg border border-[#565869] hover:scale-105 transition-all duration-300"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 bg-[#40414f] hover:bg-[#565869] rounded-full p-1 transition-all duration-200 hover:scale-110 active:scale-95"
                title="Remove image"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="text-white"
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
          {files.map((file, index) => (
            <div
              key={`file-${index}`}
              className="relative inline-flex items-center gap-2 px-3 py-2 bg-[#40414f] rounded-lg border border-[#565869] hover:bg-[#565869] hover:border-[#8e8ea0] transition-all duration-300 animate-scale-in"
              style={{ animationDelay: `${(images.length + index) * 0.05}s` }}
            >
              <span className="text-lg">{getFileIcon(file.name, file.mimeType)}</span>
              <div className="flex flex-col min-w-0">
                <span className="text-xs text-white truncate max-w-[120px]">{file.name}</span>
                {file.type === 'text' && (
                  <span className="text-xs text-gray-400">
                    {file.content.length > 50
                      ? `${file.content.substring(0, 50)}...`
                      : file.content}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="absolute -top-2 -right-2 bg-[#40414f] hover:bg-[#565869] rounded-full p-1 transition-all duration-200 hover:scale-110 active:scale-95"
                title="Remove file"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="text-white"
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
      )}
      {isProcessing && (
        <div className="mb-2 text-sm text-gray-400 flex items-center gap-2 animate-fade-in">
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Processing file...
        </div>
      )}
      <div className="relative flex items-center gap-0 bg-[#40414f] rounded-2xl border border-[#565869] focus-within:border-[#8e8ea0] focus-within:shadow-xl transition-all duration-300 shadow-lg">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.txt,.md,.json,.csv,.doc,.docx"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2.5 text-[#8e8ea0] hover:text-[#ececf1] hover:scale-110 active:scale-95 transition-all duration-200 flex-shrink-0 flex items-center justify-center"
          disabled={(disabled && !queueMode) || isProcessing}
          title="Attach file (images, PDFs, text files)"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="text-current"
          >
            <path
              d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm0 14A6 6 0 1 1 8 2a6 6 0 0 1 0 12zm.5-8.5V8h2.5v1H8.5v1.5h-1V9H5V8h2.5V5.5h1z"
              fill="currentColor"
            />
          </svg>
        </button>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPaste={handleImagePaste}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent text-[#ececf1] placeholder-[#8e8ea0] resize-none outline-none py-3 px-4 max-h-[200px] overflow-y-auto leading-6"
          style={{ minHeight: '24px' }}
        />
        <div className="flex items-center gap-0.5 pr-2 flex-shrink-0">
          {onResearchModeChange && (
            <button
              type="button"
              onClick={() => onResearchModeChange(!researchMode)}
              className={`p-2 rounded transition-all duration-200 hover:scale-110 active:scale-95 ${
                researchMode
                  ? 'text-[#3B82F6] bg-[#3B82F6]/10 hover:bg-[#3B82F6]/20'
                  : 'text-[#8e8ea0] hover:text-[#ececf1] hover:bg-[#565869]'
              }`}
              disabled={(disabled && !queueMode) || isProcessing}
              title={researchMode ? 'Disable deep research' : 'Enable deep research'}
            >
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
                  d="M8 3v2M8 11v2M3 8h2M11 8h2"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <circle cx="8" cy="8" r="1.5" fill="currentColor" />
              </svg>
            </button>
          )}
          {onQueueModeChange && (
            <button
              type="button"
              onClick={() => onQueueModeChange(!queueMode)}
              className={`p-2 rounded transition-all duration-200 hover:scale-110 active:scale-95 ${
                queueMode
                  ? 'text-[#19C37D] bg-[#19C37D]/10 hover:bg-[#19C37D]/20'
                  : 'text-[#8e8ea0] hover:text-[#ececf1] hover:bg-[#565869]'
              }`}
              disabled={(disabled && !queueMode) || isProcessing}
              title={queueMode ? 'Disable queue mode' : 'Enable queue mode'}
            >
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
            </button>
          )}
          {(input.trim() || images.length > 0 || files.length > 0) ? (
            <button
              type="submit"
              disabled={((disabled && !queueMode) || isProcessing || (!input.trim() && images.length === 0 && files.length === 0))}
              className="p-2 text-[#8e8ea0] hover:text-[#ececf1] hover:scale-110 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 rounded"
              title={queueMode ? 'Add to queue' : 'Send message'}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="text-current"
              >
                <path
                  d="M15.854 8.354l-7-7a.5.5 0 0 0-.708.708L14.293 8l-7.147 7.146a.5.5 0 0 0 .708.708l7-7a.5.5 0 0 0 0-.708z"
                  fill="currentColor"
                />
                <path
                  d="M1.5 8a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 0 1H2a.5.5 0 0 1-.5-.5z"
                  fill="currentColor"
                />
              </svg>
            </button>
          ) : null}
        </div>
      </div>
    </form>
  );
}

