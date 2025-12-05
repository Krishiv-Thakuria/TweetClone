'use client';

import { useState, useEffect } from 'react';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import ThreadSidebar from './components/ThreadSidebar';
import QueueDisplay from './components/QueueDisplay';
import ConversationSidebar from './components/ConversationSidebar';
import MemoryManager, { Memory } from './components/MemoryManager';
import PinnedMessagesModal from './components/PinnedMessagesModal';
import CloneModal from './components/CloneModal';
import ChatHeader from './components/ChatHeader';
import { useConversations } from './hooks/useConversations';
import { usePersona } from './hooks/usePersona';
import { useMessages } from './hooks/useMessages';
import { useQueue } from './hooks/useQueue';
import { useLocalStorage } from './hooks/useLocalStorage';
import { createPersona } from './services/personaService';
import { ProcessedFile } from './utils/fileProcessor';
import { Message } from './types';

export default function Home() {
  const [queueMode, setQueueMode] = useState(false);
  const [researchMode, setResearchMode] = useState(false);
  const [showPinnedModal, setShowPinnedModal] = useState(false);
  const [showMemoryManager, setShowMemoryManager] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloneHandle, setCloneHandle] = useState('');
  const [clonePreviewName, setClonePreviewName] = useState<string | null>(null);
  const [clonePreviewAvatar, setClonePreviewAvatar] = useState<string | null>(null);
  const [isCloning, setIsCloning] = useState(false);
  const [cloneError, setCloneError] = useState<string>('');

  const [memories, setMemories] = useLocalStorage<Memory[]>('chat_memories', []);

  const conversationsHook = useConversations();
  const personaHook = usePersona();
  const messagesHook = useMessages({
    memories,
    twitterProfileUrl: personaHook.twitterProfileUrl,
    personaStyle: personaHook.personaStyle,
  });

  const queueHook = useQueue({
    queueMode,
    isLoading: messagesHook.isLoading,
    onSendMessage: messagesHook.sendMessage,
  });

  useEffect(() => {
    const savedMemories = localStorage.getItem('chat_memories');
    if (savedMemories) {
      try {
        const parsed = JSON.parse(savedMemories);
        setMemories(
          parsed.map((m: any) => ({
          ...m,
          createdAt: new Date(m.createdAt),
          updatedAt: new Date(m.updatedAt),
          }))
        );
      } catch (e) {
        console.error('Error loading memories:', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('chat_memories', JSON.stringify(memories));
  }, [memories]);

  useEffect(() => {
    if (messagesHook.messages.length > 0 && conversationsHook.currentConversationId) {
      const conversation = conversationsHook.conversations.find(
        (c) => c.id === conversationsHook.currentConversationId
      );
      if (conversation) {
        conversationsHook.setConversations((prev) =>
          prev.map((c) =>
            c.id === conversationsHook.currentConversationId
              ? { ...c, messages: messagesHook.messages, updatedAt: new Date() }
              : c
          )
        );
      }
    }
  }, [messagesHook.messages, conversationsHook.currentConversationId]);

  const loadConversation = (conversationId: string) => {
    const conversation = conversationsHook.loadConversation(conversationId);
    if (conversation) {
      messagesHook.setMessages(conversation.messages);
      const pinned = new Set<number>();
      conversation.messages.forEach((msg, idx) => {
        if (msg.pinned) pinned.add(idx);
      });
      messagesHook.setPinnedMessages(pinned);
      messagesHook.setOpenThreadIndex(null);
    }
  };

  const newConversation = () => {
    if (messagesHook.messages.length > 0) {
      conversationsHook.saveConversation(messagesHook.messages);
    }
    messagesHook.setMessages([]);
    messagesHook.setOpenThreadIndex(null);
    conversationsHook.setCurrentConversationId(null);
    queueHook.clearQueue();
  };

  const openCloneModal = () => {
    if (messagesHook.messages.length > 0) {
      conversationsHook.saveConversation(messagesHook.messages);
    }
    messagesHook.setMessages([]);
    messagesHook.setOpenThreadIndex(null);
    conversationsHook.setCurrentConversationId(null);
    queueHook.clearQueue();
    personaHook.setActiveCloneName(null);
    setCloneHandle('');
    setClonePreviewName(null);
    setClonePreviewAvatar(null);
    setCloneError('');
    setIsCloning(false);
    setShowCloneModal(true);
  };

  const handleStartClone = async () => {
    if (!cloneHandle.trim() || isCloning) return;

    const rawHandle = cloneHandle.trim().replace(/^@/, '');
    const profileUrl = `https://x.com/${rawHandle}`;

    setCloneError('');
    setIsCloning(true);

    try {
      personaHook.setTwitterProfileUrl(profileUrl);
      const data = await createPersona(profileUrl);

      personaHook.setPersonaStyle(data.personaStyle);
      personaHook.setProfilePictureUrl(data.profilePictureUrl || '');
      setClonePreviewAvatar(data.profilePictureUrl);
      personaHook.setLoadingImageError(false);

      const displayName = data.displayName || rawHandle || 'Clone';
      setClonePreviewName(displayName);
    } catch (e: any) {
      console.error('Error creating clone:', e);
      setCloneError(e.message || 'Error while creating clone. Please try again.');
    } finally {
      setIsCloning(false);
    }
  };

  const handleConfirmClone = () => {
    if (!clonePreviewName) return;

    const newConversation = conversationsHook.saveConversation([], undefined);
    if (newConversation) {
      conversationsHook.renameConversation(newConversation.id, clonePreviewName);
    }
    personaHook.setActiveCloneName(clonePreviewName);
    setShowCloneModal(false);
  };

  const handleSend = async (
    input: string,
    images?: string[],
    files?: ProcessedFile[],
    useResearch = false
  ) => {
    if (queueMode) {
      queueHook.addToQueue(input, images, files);
      } else {
      await messagesHook.sendMessage(input, images, files, useResearch);
    }
  };

  const handleOpenThread = (messageIndex: number) => {
    messagesHook.setOpenThreadIndex(messageIndex);
  };

  const handleCloseThread = () => {
    messagesHook.setOpenThreadIndex(null);
  };

  const handleThreadReply = async (content: string, images?: string[]) => {
    if (messagesHook.openThreadIndex !== null) {
      await messagesHook.handleThreadReply(content, images, messagesHook.openThreadIndex);
    }
  };

  const addMemory = (content: string) => {
    const exists = memories.some((m) => m.content.trim() === content.trim());
    if (exists) return;
    
    const newMemory: Memory = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setMemories([...memories, newMemory]);
  };

  const updateMemory = (id: string, content: string) => {
    setMemories((prev: Memory[]) =>
      prev.map((m: Memory) => (m.id === id ? { ...m, content, updatedAt: new Date() } : m))
    );
  };

  const deleteMemory = (id: string) => {
    setMemories((prev: Memory[]) => prev.filter((m: Memory) => m.id !== id));
  };

  const activeAssistantName =
    personaHook.activeCloneName ||
    (conversationsHook.currentConversationId
      ? conversationsHook.conversations.find((c) => c.id === conversationsHook.currentConversationId)
          ?.title || 'Clone'
      : 'Clone');

  const sortedMessages = [...messagesHook.messages].sort((a, b) => {
    const aIndex = messagesHook.messages.indexOf(a);
    const bIndex = messagesHook.messages.indexOf(b);
    const aPinned = messagesHook.pinnedMessages.has(aIndex);
    const bPinned = messagesHook.pinnedMessages.has(bIndex);

    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return aIndex - bIndex;
  });

  return (
    <div className="flex flex-col h-screen bg-chat-bg relative">
      <ConversationSidebar
        conversations={conversationsHook.conversations}
        folders={conversationsHook.folders}
        currentConversationId={conversationsHook.currentConversationId}
        onSelectConversation={loadConversation}
        onNewConversation={openCloneModal}
        onDeleteConversation={conversationsHook.deleteConversation}
        onRenameConversation={conversationsHook.renameConversation}
        onCreateFolder={conversationsHook.createFolder}
        onDeleteFolder={conversationsHook.deleteFolder}
        onRenameFolder={conversationsHook.renameFolder}
        onMoveToFolder={conversationsHook.moveToFolder}
      />
      <div className="flex flex-col h-screen bg-chat-bg" style={{ marginLeft: '256px' }}>
        <ChatHeader
          assistantName={activeAssistantName}
          pinnedMessagesCount={messagesHook.pinnedMessages.size}
          onShowMemories={() => setShowMemoryManager(true)}
          onShowPinned={() => setShowPinnedModal(true)}
        />

      <main className="flex-1 overflow-y-auto">
          {messagesHook.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4">
            <h2 className="text-4xl font-semibold mb-8 text-center text-white">
                What&apos;s on your mind today?
            </h2>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-8">
              {sortedMessages.map((message, index) => {
                const originalIndex = messagesHook.messages.indexOf(message);
                const replyCount = messagesHook.threads.get(originalIndex)?.length || 0;
                const isPinned = messagesHook.pinnedMessages.has(originalIndex);
              return (
                <div
                    key={originalIndex}
                  ref={(el) => {
                    if (el) {
                        messagesHook.messageRefs.current.set(originalIndex, el);
                    } else {
                        messagesHook.messageRefs.current.delete(originalIndex);
                    }
                  }}
                >
                  <ChatMessage
                    message={{ ...message, pinned: isPinned }}
                      messageIndex={originalIndex}
                    replyCount={replyCount}
                    onOpenThread={handleOpenThread}
                      onTogglePin={messagesHook.togglePinMessage}
                    isPinned={isPinned}
                    onSaveAsMemory={addMemory}
                      profilePictureUrl={
                        message.role === 'assistant' ? personaHook.profilePictureUrl : undefined
                      }
                      assistantName={activeAssistantName}
                  />
                </div>
              );
            })}
              {messagesHook.isLoading &&
                messagesHook.messages.length > 0 &&
                messagesHook.messages[messagesHook.messages.length - 1]?.role !== 'assistant' && (
              <div className="flex items-start gap-4 py-6 bg-[#343541] animate-fade-in">
                <div className="w-8 h-8 rounded-full bg-[#19C37D] flex items-center justify-center flex-shrink-0 ml-4 overflow-hidden">
                      {personaHook.profilePictureUrl && !personaHook.loadingImageError ? (
                    <img
                          src={personaHook.profilePictureUrl}
                      alt="Chatbot profile"
                      className="w-full h-full object-cover"
                          onError={() => personaHook.setLoadingImageError(true)}
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
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white">
                          {messagesHook.researchStatus ? '🔍 Research' : activeAssistantName}
                    </span>
                  </div>
                      {messagesHook.researchStatus && (
                    <div className="text-xs text-[#3B82F6] mb-2 animate-pulse">
                          {messagesHook.researchStatus}
                    </div>
                  )}
                  <div className="text-[#d1d5db] flex items-center gap-1">
                    <div className="flex gap-1">
                          <div
                            className="w-1.5 h-1.5 bg-[#19C37D] rounded-full animate-pulse"
                            style={{ animationDelay: '0s' }}
                          />
                          <div
                            className="w-1.5 h-1.5 bg-[#19C37D] rounded-full animate-pulse"
                            style={{ animationDelay: '0.2s' }}
                          />
                          <div
                            className="w-1.5 h-1.5 bg-[#19C37D] rounded-full animate-pulse"
                            style={{ animationDelay: '0.4s' }}
                          />
                    </div>
                  </div>
                </div>
              </div>
            )}
              <div ref={messagesHook.messagesEndRef} />
          </div>
        )}
      </main>

      <div className="border-t border-chat-border">
          {(messagesHook.messages.length > 0 || queueHook.queue.length > 0) && (
          <QueueDisplay
              queue={queueHook.queue}
              onRemove={queueHook.removeFromQueue}
              onClear={queueHook.clearQueue}
              isProcessing={queueHook.isProcessingQueue}
          />
        )}
        <div className="max-w-3xl mx-auto">
            {messagesHook.messages.length > 0 && (
              <div className="px-4 py-2 flex justify-center gap-2">
                {!conversationsHook.currentConversationId && (
                  <button
                    onClick={() => conversationsHook.saveConversation(messagesHook.messages)}
                    className="px-4 py-2 bg-[#40414f] hover:bg-[#565869] text-white rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 text-sm font-medium flex items-center gap-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M4 12h8M4 8h8M4 4h6"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                    Save Conversation
                  </button>
                )}
                {conversationsHook.currentConversationId &&
                  conversationsHook.folders.length > 0 && (
                  <div className="relative">
                    <div className="inline-flex items-center gap-2 px-3 py-2 bg-[#202123] border border-[#565869] rounded-full text-xs text-gray-300 shadow-sm">
                      <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wide text-gray-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#19C37D]" />
                        Folder
                      </span>
                      <div className="h-4 w-px bg-[#565869]/60" />
                      <div className="relative">
                        <select
                            value={
                              conversationsHook.conversations.find(
                                (c) => c.id === conversationsHook.currentConversationId
                              )?.folderId || ''
                            }
                          onChange={(e) => {
                              if (conversationsHook.currentConversationId) {
                                conversationsHook.moveToFolder(
                                  conversationsHook.currentConversationId,
                                  e.target.value || null
                                );
                            }
                          }}
                          className="bg-transparent pr-6 pl-1 py-0.5 text-sm text-white appearance-none cursor-pointer focus:outline-none"
                        >
                          <option value="">Move to folder...</option>
                            {conversationsHook.folders.map((folder) => (
                            <option key={folder.id} value={folder.id}>
                              {folder.name}
                            </option>
                          ))}
                            {conversationsHook.conversations.find(
                              (c) => c.id === conversationsHook.currentConversationId
                            )?.folderId && <option value="">Remove from folder</option>}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1.5">
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 16 16"
                            fill="none"
                            className="text-gray-400"
                          >
                            <path
                              d="M4 6l4 4 4-4"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            <ChatInput
              onSend={handleSend}
              disabled={!queueMode && (messagesHook.isLoading || queueHook.isProcessingQueue)}
              queueMode={queueMode}
              onQueueModeChange={setQueueMode}
              researchMode={researchMode}
              onResearchModeChange={setResearchMode}
            />
        </div>
      </div>

        {messagesHook.openThreadIndex !== null && (
        <ThreadSidebar
            isOpen={messagesHook.openThreadIndex !== null}
          onClose={handleCloseThread}
            messageIndex={messagesHook.openThreadIndex}
            messageContent={messagesHook.messages[messagesHook.openThreadIndex]?.content || ''}
            messageImages={messagesHook.messages[messagesHook.openThreadIndex]?.images}
            threadReplies={messagesHook.threads.get(messagesHook.openThreadIndex) || []}
          onSendReply={handleThreadReply}
            isLoading={messagesHook.isThreadLoading}
            profilePictureUrl={personaHook.profilePictureUrl}
            assistantName={activeAssistantName}
        />
      )}

      <PinnedMessagesModal
        isOpen={showPinnedModal}
        onClose={() => setShowPinnedModal(false)}
          pinnedMessages={messagesHook.pinnedMessages}
          messages={messagesHook.messages}
          onNavigateToMessage={messagesHook.jumpToMessage}
          onTogglePin={messagesHook.togglePinMessage}
        />

        <MemoryManager
          isOpen={showMemoryManager}
          onClose={() => setShowMemoryManager(false)}
          memories={memories}
          onAddMemory={addMemory}
          onUpdateMemory={updateMemory}
          onDeleteMemory={deleteMemory}
        />

        <CloneModal
          isOpen={showCloneModal}
          cloneHandle={cloneHandle}
          setCloneHandle={setCloneHandle}
          isCloning={isCloning}
          cloneError={cloneError}
          clonePreviewName={clonePreviewName}
          clonePreviewAvatar={clonePreviewAvatar}
          loadingImageError={personaHook.loadingImageError}
          setLoadingImageError={personaHook.setLoadingImageError}
          onStartClone={handleStartClone}
          onConfirmClone={handleConfirmClone}
          onClose={() => setShowCloneModal(false)}
      />
      </div>
    </div>
  );
}
