'use client';

import { useState } from 'react';

export interface Conversation {
  id: string;
  title: string;
  messages: any[];
  folderId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Folder {
  id: string;
  name: string;
  color?: string;
  createdAt: Date;
}

interface ConversationSidebarProps {
  conversations: Conversation[];
  folders: Folder[];
  currentConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (conversationId: string) => void;
  onRenameConversation: (conversationId: string, newTitle: string) => void;
  onCreateFolder: (name: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onRenameFolder: (folderId: string, newName: string) => void;
  onMoveToFolder: (conversationId: string, folderId: string | null) => void;
}

export default function ConversationSidebar({
  conversations,
  folders,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
  onCreateFolder,
  onDeleteFolder,
  onRenameFolder,
  onMoveToFolder,
}: ConversationSidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [draggedConversationId, setDraggedConversationId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const startEdit = (id: string, currentName: string) => {
    setEditingId(id);
    setEditValue(currentName);
  };

  const finishEdit = () => {
    if (editingId && editValue.trim()) {
      if (editingId.startsWith('folder-')) {
        onRenameFolder(editingId.replace('folder-', ''), editValue.trim());
      } else {
        onRenameConversation(editingId, editValue.trim());
      }
    }
    setEditingId(null);
    setEditValue('');
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim());
      setNewFolderName('');
      setShowNewFolder(false);
    }
  };

  const conversationsByFolder = new Map<string | null, Conversation[]>();
  conversations.forEach((conv) => {
    const folderId = conv.folderId || null;
    if (!conversationsByFolder.has(folderId)) {
      conversationsByFolder.set(folderId, []);
    }
    conversationsByFolder.get(folderId)!.push(conv);
  });

  // Sort conversations by updatedAt
  conversationsByFolder.forEach((convs) => {
    convs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  });

  const folderColors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

  return (
    <div className={`fixed left-0 top-0 h-full bg-[#202123] border-r border-[#565869] z-40 transition-all duration-300 ${
      isOpen ? 'w-64' : 'w-0'
    } overflow-hidden`}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#565869] flex items-center justify-between">
          <button
            onClick={onNewConversation}
            className="flex items-center gap-2 px-3 py-2 bg-[#19C37D] hover:bg-[#16B373] text-white rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 text-sm font-medium"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            New Clone
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 text-[#8e8ea0] hover:text-white hover:bg-[#565869] rounded transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Folders */}
          <div className="p-2">
            <div className="flex items-center justify-between mb-2 px-2">
              <span className="text-xs font-semibold text-[#8e8ea0] uppercase">Folders</span>
              <button
                onClick={() => setShowNewFolder(true)}
                className="p-1 text-[#8e8ea0] hover:text-white hover:bg-[#565869] rounded transition-all"
                title="New Folder"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {showNewFolder && (
              <div className="mb-2 px-2">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateFolder();
                    if (e.key === 'Escape') {
                      setShowNewFolder(false);
                      setNewFolderName('');
                    }
                  }}
                  placeholder="Folder name"
                  className="w-full px-2 py-1.5 bg-[#40414f] border border-[#565869] rounded text-white text-sm focus:outline-none focus:border-[#19C37D]"
                  autoFocus
                />
                <div className="flex gap-1 mt-1">
                  <button
                    onClick={handleCreateFolder}
                    className="px-2 py-1 bg-[#19C37D] hover:bg-[#16B373] text-white text-xs rounded transition-all"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => {
                      setShowNewFolder(false);
                      setNewFolderName('');
                    }}
                    className="px-2 py-1 bg-[#40414f] hover:bg-[#565869] text-white text-xs rounded transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {folders.map((folder, idx) => {
              const folderConvs = conversationsByFolder.get(folder.id) || [];
              const isExpanded = expandedFolders.has(folder.id);
              const color = folder.color || folderColors[idx % folderColors.length];
              const isDragOver = dragOverFolderId === folder.id;

              return (
                <div key={folder.id} className="mb-1">
                  <div 
                    className={`flex items-center group hover:bg-[#2f3035] rounded px-2 py-1.5 transition-all ${
                      isDragOver ? 'bg-[#19C37D]/20 border-2 border-[#19C37D] border-dashed' : ''
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (draggedConversationId) {
                        setDragOverFolderId(folder.id);
                        e.dataTransfer.dropEffect = 'move';
                      }
                    }}
                    onDragLeave={(e) => {
                      // Only clear if we're actually leaving the folder element
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX;
                      const y = e.clientY;
                      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
                        setDragOverFolderId(null);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDragOverFolderId(null);
                      const conversationId = draggedConversationId || e.dataTransfer.getData('text/plain');
                      if (conversationId) {
                        onMoveToFolder(conversationId, folder.id);
                        setDraggedConversationId(null);
                      }
                    }}
                  >
                    <button
                      onClick={() => toggleFolder(folder.id)}
                      className="flex items-center gap-2 flex-1 min-w-0"
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 16 16"
                        fill="none"
                        className={`text-[#8e8ea0] transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      >
                        <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <div
                        className="w-3 h-3 rounded flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      {editingId === `folder-${folder.id}` ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={finishEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') finishEdit();
                            if (e.key === 'Escape') {
                              setEditingId(null);
                              setEditValue('');
                            }
                          }}
                          className="flex-1 bg-[#40414f] border border-[#565869] rounded px-1.5 py-0.5 text-white text-sm focus:outline-none focus:border-[#19C37D]"
                          autoFocus
                        />
                      ) : (
                        <span className="text-sm text-white truncate flex-1">{folder.name}</span>
                      )}
                      <span className="text-xs text-[#8e8ea0] ml-auto">{folderConvs.length}</span>
                    </button>
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEdit(`folder-${folder.id}`, folder.name);
                        }}
                        className="p-1 text-[#8e8ea0] hover:text-white hover:bg-[#565869] rounded transition-all"
                        title="Rename"
                      >
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                          <path d="M11 2l3 3M10 3L3 10v3h3l7-7M10 3l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteFolder(folder.id);
                        }}
                        className="p-1 text-[#8e8ea0] hover:text-red-400 hover:bg-[#565869] rounded transition-all"
                        title="Delete"
                      >
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                          <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  {isExpanded && folderConvs.map((conv) => (
                    <div
                      key={conv.id}
                      draggable={true}
                      onDragStart={(e) => {
                        setDraggedConversationId(conv.id);
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', conv.id);
                        // Change cursor to grabbing
                        if (e.currentTarget) {
                          (e.currentTarget as HTMLElement).style.cursor = 'grabbing';
                        }
                      }}
                      onDragEnd={(e) => {
                        setDraggedConversationId(null);
                        setDragOverFolderId(null);
                        // Reset cursor
                        if (e.currentTarget) {
                          (e.currentTarget as HTMLElement).style.cursor = 'grab';
                        }
                      }}
                      className={`ml-6 mr-2 mb-1 px-2 py-1.5 rounded transition-all group ${
                        currentConversationId === conv.id
                          ? 'bg-[#40414f] text-white'
                          : 'hover:bg-[#2f3035] text-[#d1d5db]'
                      } ${draggedConversationId === conv.id ? 'opacity-50 cursor-grabbing' : 'cursor-grab'}`}
                      onClick={() => onSelectConversation(conv.id)}
                      style={{ cursor: draggedConversationId === conv.id ? 'grabbing' : 'grab' }}
                    >
                      <div className="flex items-center justify-between">
                        {editingId === conv.id ? (
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={finishEdit}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') finishEdit();
                              if (e.key === 'Escape') {
                                setEditingId(null);
                                setEditValue('');
                              }
                            }}
                            className="flex-1 bg-[#40414f] border border-[#565869] rounded px-1.5 py-0.5 text-white text-sm focus:outline-none focus:border-[#19C37D]"
                            autoFocus
                          />
                        ) : (
                          <>
                            <span className="text-sm truncate flex-1">{conv.title}</span>
                            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEdit(conv.id, conv.title);
                                }}
                                className="p-1 text-[#8e8ea0] hover:text-white hover:bg-[#565869] rounded transition-all"
                                title="Rename"
                              >
                                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                                  <path d="M11 2l3 3M10 3L3 10v3h3l7-7M10 3l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                </svg>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteConversation(conv.id);
                                }}
                                className="p-1 text-[#8e8ea0] hover:text-red-400 hover:bg-[#565869] rounded transition-all"
                                title="Delete"
                              >
                                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                </svg>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Unorganized conversations - also a drop target */}
          <div 
            className="p-2 border-t border-[#565869] mt-2"
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (draggedConversationId) {
                setDragOverFolderId('recent');
                e.dataTransfer.dropEffect = 'move';
              }
            }}
            onDragLeave={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX;
              const y = e.clientY;
              if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
                setDragOverFolderId(null);
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragOverFolderId(null);
              const conversationId = draggedConversationId || e.dataTransfer.getData('text/plain');
              if (conversationId) {
                onMoveToFolder(conversationId, null);
                setDraggedConversationId(null);
              }
            }}
          >
            <span className="text-xs font-semibold text-[#8e8ea0] uppercase px-2 block mb-2">Recent</span>
            {(conversationsByFolder.get(null) || []).map((conv) => (
              <div
                key={conv.id}
                draggable={true}
                onDragStart={(e) => {
                  setDraggedConversationId(conv.id);
                  e.dataTransfer.effectAllowed = 'move';
                  e.dataTransfer.setData('text/plain', conv.id);
                  // Change cursor to grabbing
                  if (e.currentTarget) {
                    (e.currentTarget as HTMLElement).style.cursor = 'grabbing';
                  }
                }}
                onDragEnd={(e) => {
                  setDraggedConversationId(null);
                  setDragOverFolderId(null);
                  // Reset cursor
                  if (e.currentTarget) {
                    (e.currentTarget as HTMLElement).style.cursor = 'grab';
                  }
                }}
                className={`mx-2 mb-1 px-2 py-1.5 rounded transition-all group ${
                  currentConversationId === conv.id
                    ? 'bg-[#40414f] text-white'
                    : 'hover:bg-[#2f3035] text-[#d1d5db]'
                } ${draggedConversationId === conv.id ? 'opacity-50 cursor-grabbing' : 'cursor-grab'}`}
                onClick={() => onSelectConversation(conv.id)}
                style={{ cursor: draggedConversationId === conv.id ? 'grabbing' : 'grab' }}
              >
                <div className="flex items-center justify-between">
                  {editingId === conv.id ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={finishEdit}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') finishEdit();
                        if (e.key === 'Escape') {
                          setEditingId(null);
                          setEditValue('');
                        }
                      }}
                      className="flex-1 bg-[#40414f] border border-[#565869] rounded px-1.5 py-0.5 text-white text-sm focus:outline-none focus:border-[#19C37D]"
                      autoFocus
                    />
                  ) : (
                    <>
                            <span className="text-sm truncate flex-1">{conv.title}</span>
                            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEdit(conv.id, conv.title);
                                }}
                                className="p-1 text-[#8e8ea0] hover:text-white hover:bg-[#565869] rounded transition-all"
                                title="Rename"
                              >
                                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                                  <path d="M11 2l3 3M10 3L3 10v3h3l7-7M10 3l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                </svg>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteConversation(conv.id);
                                }}
                                className="p-1 text-[#8e8ea0] hover:text-red-400 hover:bg-[#565869] rounded transition-all"
                                title="Delete"
                              >
                                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                </svg>
                              </button>
                            </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Toggle button when closed */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed left-0 top-1/2 -translate-y-1/2 bg-[#202123] border-r border-y border-[#565869] p-2 rounded-r-lg hover:bg-[#2f3035] transition-all z-50"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-white">
            <path d="M6 12L10 8l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
    </div>
  );
}

