import { useState, useEffect } from 'react';
import { Conversation, Folder } from '../types';

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  useEffect(() => {
    const savedConversations = localStorage.getItem('chat_conversations');
    const savedFolders = localStorage.getItem('chat_folders');

    if (savedConversations) {
      try {
        const parsed = JSON.parse(savedConversations);
        setConversations(
          parsed.map((c: any) => ({
            ...c,
            messages: c.messages.map((m: any) => ({
              ...m,
              timestamp: new Date(m.timestamp),
            })),
            createdAt: new Date(c.createdAt),
            updatedAt: new Date(c.updatedAt),
          }))
        );
      } catch (e) {
        console.error('Error loading conversations:', e);
      }
    }

    if (savedFolders) {
      try {
        const parsed = JSON.parse(savedFolders);
        setFolders(parsed.map((f: any) => ({ ...f, createdAt: new Date(f.createdAt) })));
      } catch (e) {
        console.error('Error loading folders:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem('chat_conversations', JSON.stringify(conversations));
    }
  }, [conversations]);

  useEffect(() => {
    if (folders.length > 0) {
      localStorage.setItem('chat_folders', JSON.stringify(folders));
    }
  }, [folders]);

  const generateConversationTitle = (messages: any[]): string => {
    const firstUserMessage = messages.find((m) => m.role === 'user');
    if (firstUserMessage) {
      const text = firstUserMessage.content.substring(0, 50);
      return text.length < firstUserMessage.content.length ? text + '...' : text;
    }
    return 'New Conversation';
  };

  const saveConversation = (messages: any[], folderId?: string) => {
    if (messages.length === 0) return null;

    const title = generateConversationTitle(messages);
    const newConversation: Conversation = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      title,
      messages: [...messages],
      folderId: folderId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setConversations((prev) => [...prev, newConversation]);
    setCurrentConversationId(newConversation.id);
    return newConversation;
  };

  const loadConversation = (conversationId: string) => {
    const conversation = conversations.find((c) => c.id === conversationId);
    if (conversation) {
      setCurrentConversationId(conversationId);
      return conversation;
    }
    return null;
  };

  const deleteConversation = (conversationId: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== conversationId));
    if (currentConversationId === conversationId) {
      setCurrentConversationId(null);
    }
  };

  const renameConversation = (conversationId: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, title: newTitle } : c))
    );
  };

  const createFolder = (name: string) => {
    const newFolder: Folder = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name,
      createdAt: new Date(),
    };
    setFolders((prev) => [...prev, newFolder]);
  };

  const deleteFolder = (folderId: string) => {
    setFolders((prev) => prev.filter((f) => f.id !== folderId));
    setConversations((prev) =>
      prev.map((c) => (c.folderId === folderId ? { ...c, folderId: null } : c))
    );
  };

  const renameFolder = (folderId: string, newName: string) => {
    setFolders((prev) => prev.map((f) => (f.id === folderId ? { ...f, name: newName } : f)));
  };

  const moveToFolder = (conversationId: string, folderId: string | null) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, folderId } : c))
    );
  };

  return {
    conversations,
    folders,
    currentConversationId,
    setCurrentConversationId,
    saveConversation,
    loadConversation,
    deleteConversation,
    renameConversation,
    createFolder,
    deleteFolder,
    renameFolder,
    moveToFolder,
    setConversations,
  };
}

