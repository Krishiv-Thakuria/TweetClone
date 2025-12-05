'use client';

import { useState } from 'react';

export interface Memory {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

interface MemoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
  memories: Memory[];
  onAddMemory: (content: string) => void;
  onUpdateMemory: (id: string, content: string) => void;
  onDeleteMemory: (id: string) => void;
}

export default function MemoryManager({
  isOpen,
  onClose,
  memories,
  onAddMemory,
  onUpdateMemory,
  onDeleteMemory,
}: MemoryManagerProps) {
  const [newMemory, setNewMemory] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  if (!isOpen) return null;

  const handleAdd = () => {
    if (newMemory.trim()) {
      onAddMemory(newMemory.trim());
      setNewMemory('');
    }
  };

  const startEdit = (memory: Memory) => {
    setEditingId(memory.id);
    setEditValue(memory.content);
  };

  const finishEdit = () => {
    if (editingId && editValue.trim()) {
      onUpdateMemory(editingId, editValue.trim());
    }
    setEditingId(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-[#2f3136] rounded-lg w-full max-w-3xl max-h-[85vh] flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#202225]">
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none" className="text-white">
              <path
                d="M8 0C3.6 0 0 3.6 0 8c0 1.4.4 2.7 1.1 3.8L0 16l4.2-1.1C5.3 15.6 6.6 16 8 16c4.4 0 8-3.6 8-8s-3.6-8-8-8z"
                fill="currentColor"
              />
            </svg>
            <h2 className="text-lg font-semibold text-white">Memories</h2>
            <span className="text-sm text-[#8e8ea0]">({memories.length})</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#40444b] rounded transition-all text-[#8e8ea0] hover:text-white"
          >
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Add New Memory */}
        <div className="p-4 border-b border-[#202225]">
          <div className="flex gap-2">
            <textarea
              value={newMemory}
              onChange={(e) => setNewMemory(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleAdd();
                }
              }}
              placeholder="Add a new memory... (Cmd/Ctrl + Enter to save)"
              className="flex-1 bg-[#40444b] border border-[#202225] rounded-lg px-3 py-2 text-white placeholder-[#8e8ea0] resize-none focus:outline-none focus:border-[#19C37D] min-h-[80px]"
              rows={3}
            />
            <button
              onClick={handleAdd}
              disabled={!newMemory.trim()}
              className="px-4 py-2 bg-[#19C37D] hover:bg-[#16B373] disabled:bg-[#40444b] disabled:text-[#8e8ea0] disabled:cursor-not-allowed text-white rounded-lg transition-all font-medium"
            >
              Add
            </button>
          </div>
        </div>

        {/* Memories List */}
        <div className="flex-1 overflow-y-auto p-4">
          {memories.length === 0 ? (
            <div className="text-center py-12 text-[#8e8ea0]">
              <svg width="48" height="48" viewBox="0 0 16 16" fill="none" className="mx-auto mb-4 opacity-50">
                <path
                  d="M8 0C3.6 0 0 3.6 0 8c0 1.4.4 2.7 1.1 3.8L0 16l4.2-1.1C5.3 15.6 6.6 16 8 16c4.4 0 8-3.6 8-8s-3.6-8-8-8z"
                  fill="currentColor"
                />
              </svg>
              <p>No memories yet. Add your first memory above!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {memories
                .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                .map((memory) => (
                  <div
                    key={memory.id}
                    className="p-3 bg-[#36393f] rounded-lg border border-[#202225] hover:border-[#40444b] transition-all group"
                  >
                    {editingId === memory.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                              finishEdit();
                            }
                            if (e.key === 'Escape') {
                              cancelEdit();
                            }
                          }}
                          className="w-full bg-[#40444b] border border-[#202225] rounded-lg px-3 py-2 text-white resize-none focus:outline-none focus:border-[#19C37D] min-h-[80px]"
                          rows={3}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={finishEdit}
                            className="px-3 py-1.5 bg-[#19C37D] hover:bg-[#16B373] text-white rounded text-sm transition-all"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="px-3 py-1.5 bg-[#40444b] hover:bg-[#565869] text-white rounded text-sm transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[#d1d5db] whitespace-pre-wrap break-words">
                            {memory.content}
                          </p>
                          <p className="text-xs text-[#8e8ea0] mt-2">
                            {new Date(memory.updatedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                          <button
                            onClick={() => startEdit(memory)}
                            className="p-1.5 hover:bg-[#40444b] rounded transition-all text-[#8e8ea0] hover:text-white"
                            title="Edit"
                          >
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                              <path
                                d="M11 2l3 3M10 3L3 10v3h3l7-7M10 3l3 3"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => onDeleteMemory(memory.id)}
                            className="p-1.5 hover:bg-[#40444b] rounded transition-all text-[#8e8ea0] hover:text-red-400"
                            title="Delete"
                          >
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                              <path
                                d="M4 4l8 8M12 4l-8 8"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}





