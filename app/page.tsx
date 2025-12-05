'use client';

import { useState, useRef, useEffect } from 'react';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import ThreadSidebar from './components/ThreadSidebar';
import QueueDisplay from './components/QueueDisplay';
import ConversationSidebar, { Conversation, Folder } from './components/ConversationSidebar';
import MemoryManager, { Memory } from './components/MemoryManager';
import PinnedMessagesModal from './components/PinnedMessagesModal';
import { ProcessedFile } from './utils/fileProcessor';
import { formatMessageTimestamp } from './utils/dateFormat';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  images?: string[];
  files?: ProcessedFile[];
  timestamp: Date;
  pinned?: boolean;
}

interface ThreadReply {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  images?: string[];
}

interface QueuedMessage {
  id: string;
  content: string;
  images?: string[];
  files?: ProcessedFile[];
  timestamp: Date;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [threads, setThreads] = useState<Map<number, ThreadReply[]>>(new Map());
  const [openThreadIndex, setOpenThreadIndex] = useState<number | null>(null);
  const [isThreadLoading, setIsThreadLoading] = useState(false);
  const [queue, setQueue] = useState<QueuedMessage[]>([]);
  const [queueMode, setQueueMode] = useState(false);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [researchMode, setResearchMode] = useState(false);
  const [researchStatus, setResearchStatus] = useState<string>('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [pinnedMessages, setPinnedMessages] = useState<Set<number>>(new Set());
  const [showPinnedModal, setShowPinnedModal] = useState(false);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [showMemoryManager, setShowMemoryManager] = useState(false);
  const [twitterProfileUrl, setTwitterProfileUrl] = useState<string>('');
  const [personaStyle, setPersonaStyle] = useState<string>('');
  const [profilePictureUrl, setProfilePictureUrl] = useState<string>('');
  const [isConfiguringPersona, setIsConfiguringPersona] = useState(false);
  const [personaStatus, setPersonaStatus] = useState<string>('');
  const [loadingImageError, setLoadingImageError] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloneHandle, setCloneHandle] = useState('');
  const [clonePreviewName, setClonePreviewName] = useState<string | null>(null);
  const [clonePreviewAvatar, setClonePreviewAvatar] = useState<string | null>(null);
  const [isCloning, setIsCloning] = useState(false);
  const [cloneError, setCloneError] = useState<string>('');
  const [activeCloneName, setActiveCloneName] = useState<string | null>(null);
  const messageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations, folders, and memories from localStorage
  useEffect(() => {
    const savedConversations = localStorage.getItem('chat_conversations');
    const savedFolders = localStorage.getItem('chat_folders');
    const savedMemories = localStorage.getItem('chat_memories');
    const savedTwitterProfileUrl = localStorage.getItem('chat_twitter_profile_url');
    const savedPersonaStyle = localStorage.getItem('chat_persona_style');
    const savedProfilePictureUrl = localStorage.getItem('chat_profile_picture_url');
    
    if (savedConversations) {
      try {
        const parsed = JSON.parse(savedConversations);
        setConversations(parsed.map((c: any) => ({
          ...c,
          messages: c.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          })),
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
        })));
      } catch (e) {
        console.error('Error loading conversations:', e);
      }
    }
    
    if (savedFolders) {
      try {
        const parsed = JSON.parse(savedFolders);
        setFolders(parsed.map((f: any) => ({
          ...f,
          createdAt: new Date(f.createdAt),
        })));
      } catch (e) {
        console.error('Error loading folders:', e);
      }
    }

    if (savedMemories) {
      try {
        const parsed = JSON.parse(savedMemories);
        setMemories(parsed.map((m: any) => ({
          ...m,
          createdAt: new Date(m.createdAt),
          updatedAt: new Date(m.updatedAt),
        })));
      } catch (e) {
        console.error('Error loading memories:', e);
      }
    }

    if (savedTwitterProfileUrl) {
      setTwitterProfileUrl(savedTwitterProfileUrl);
    }

    if (savedPersonaStyle) {
      setPersonaStyle(savedPersonaStyle);
    }

    if (savedProfilePictureUrl) {
      setProfilePictureUrl(savedProfilePictureUrl);
    }
  }, []);

  // Save conversations to localStorage
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem('chat_conversations', JSON.stringify(conversations));
    }
  }, [conversations]);

  // Save folders to localStorage
  useEffect(() => {
    if (folders.length > 0) {
      localStorage.setItem('chat_folders', JSON.stringify(folders));
    }
  }, [folders]);

  // Save memories to localStorage
  useEffect(() => {
    localStorage.setItem('chat_memories', JSON.stringify(memories));
  }, [memories]);

  // Save twitter profile URL to localStorage
  useEffect(() => {
    if (twitterProfileUrl) {
      localStorage.setItem('chat_twitter_profile_url', twitterProfileUrl);
    } else {
      localStorage.removeItem('chat_twitter_profile_url');
    }
  }, [twitterProfileUrl]);

  // Save persona style to localStorage
  useEffect(() => {
    if (personaStyle) {
      localStorage.setItem('chat_persona_style', personaStyle);
    } else {
      localStorage.removeItem('chat_persona_style');
    }
  }, [personaStyle]);

  // Save profile picture URL to localStorage
  useEffect(() => {
    if (profilePictureUrl) {
      localStorage.setItem('chat_profile_picture_url', profilePictureUrl);
    } else {
      localStorage.removeItem('chat_profile_picture_url');
    }
  }, [profilePictureUrl]);

  // Auto-save current conversation
  useEffect(() => {
    if (messages.length > 0 && currentConversationId) {
      const conversation = conversations.find(c => c.id === currentConversationId);
      if (conversation) {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === currentConversationId
              ? {
                  ...c,
                  messages,
                  updatedAt: new Date(),
                }
              : c
          )
        );
      }
    }
  }, [messages, currentConversationId]);

  const generateConversationTitle = (messages: Message[]): string => {
    const firstUserMessage = messages.find(m => m.role === 'user');
    if (firstUserMessage) {
      const text = firstUserMessage.content.substring(0, 50);
      return text.length < firstUserMessage.content.length ? text + '...' : text;
    }
    return 'New Conversation';
  };

  const saveCurrentConversation = (folderId?: string) => {
    if (messages.length === 0) return;

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
  };

  const loadConversation = (conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      setMessages(conversation.messages);
      // Restore pinned messages
      const pinned = new Set<number>();
      conversation.messages.forEach((msg, idx) => {
        if (msg.pinned) {
          pinned.add(idx);
        }
      });
      setPinnedMessages(pinned);
      setCurrentConversationId(conversationId);
      setThreads(new Map());
      setOpenThreadIndex(null);
    }
  };

  const newConversation = () => {
    if (messages.length > 0) {
      saveCurrentConversation();
    }
    setMessages([]);
    setThreads(new Map());
    setOpenThreadIndex(null);
    setCurrentConversationId(null);
    setQueue([]);
  };

  const deleteConversation = (conversationId: string) => {
    setConversations((prev) => prev.filter(c => c.id !== conversationId));
    if (currentConversationId === conversationId) {
      newConversation();
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
    setFolders((prev) => prev.filter(f => f.id !== folderId));
    setConversations((prev) =>
      prev.map((c) => (c.folderId === folderId ? { ...c, folderId: null } : c))
    );
  };

  const renameFolder = (folderId: string, newName: string) => {
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? { ...f, name: newName } : f))
    );
  };

  const moveToFolder = (conversationId: string, folderId: string | null) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, folderId } : c))
    );
  };

  const togglePinMessage = (messageIndex: number) => {
    setPinnedMessages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(messageIndex)) {
        newSet.delete(messageIndex);
      } else {
        newSet.add(messageIndex);
      }
      return newSet;
    });
    
    // Update the message in state
    setMessages((prev) =>
      prev.map((msg, idx) =>
        idx === messageIndex ? { ...msg, pinned: !msg.pinned } : msg
      )
    );
  };

  // Separate pinned and unpinned messages
  const sortedMessages = [...messages].sort((a, b) => {
    const aIndex = messages.indexOf(a);
    const bIndex = messages.indexOf(b);
    const aPinned = pinnedMessages.has(aIndex);
    const bPinned = pinnedMessages.has(bIndex);
    
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return aIndex - bIndex; // Maintain original order within pinned/unpinned groups
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const jumpToMessage = (messageIndex: number) => {
    const messageElement = messageRefs.current.get(messageIndex);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setShowPinnedModal(false);
  };

  const addMemory = (content: string) => {
    // Check if this memory already exists
    const exists = memories.some(m => m.content.trim() === content.trim());
    if (exists) {
      return; // Don't add duplicates
    }
    
    const newMemory: Memory = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setMemories((prev) => [...prev, newMemory]);
  };

  const updateMemory = (id: string, content: string) => {
    setMemories((prev) =>
      prev.map((m) => (m.id === id ? { ...m, content, updatedAt: new Date() } : m))
    );
  };

  const deleteMemory = (id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id));
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Process queue when not loading and queue has items
  useEffect(() => {
    const processNext = async () => {
      if (queue.length === 0 || isLoading || isProcessingQueue) return;
      
        setIsProcessingQueue(true);
        const nextMessage = queue[0];
        
        // Remove from queue
        setQueue((prev) => prev.slice(1));
        
        // Send the message
        await sendMessage(nextMessage.content, nextMessage.images, nextMessage.files);
        
        setIsProcessingQueue(false);
    };
    
    if (!isLoading && !isProcessingQueue && queue.length > 0) {
      processNext();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, queue.length, isProcessingQueue]);

  const sendMessage = async (input: string, images?: string[], files?: ProcessedFile[], useResearch = false) => {
    if ((!input.trim() && (!images || images.length === 0) && (!files || files.length === 0)) || isLoading) return;

    // If research mode is enabled, use research API
    if (useResearch && !images && !files) {
      await sendResearchMessage(input);
      return;
    }

    // Combine text from files with user input
    let combinedContent = input;
    if (files && files.length > 0) {
      const textFiles = files.filter(f => f.type === 'text');
      if (textFiles.length > 0) {
        const fileTexts = textFiles.map(f => `[File: ${f.name}]\n${f.content}`).join('\n\n');
        combinedContent = combinedContent ? `${combinedContent}\n\n${fileTexts}` : fileTexts;
      }
    }

    const userMessage: Message = { 
      role: 'user', 
      content: combinedContent, 
      images, 
      files,
      timestamp: new Date(),
      pinned: false
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    const updatedMessages = [...messages, userMessage];
    let assistantMessage = '';

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedMessages.map((msg) => {
            // If message has images or files, format for vision API
            if ((msg.images && msg.images.length > 0) || (msg.files && msg.files.some(f => f.type === 'pdf' || f.type === 'image'))) {
              const content: any[] = [];
              
              // Add text content
              if (msg.content.trim()) {
                content.push({ type: 'text', text: msg.content });
              }
              
              // Add images
              if (msg.images) {
                msg.images.forEach((image) => {
                  content.push({
                    type: 'image_url',
                    image_url: { url: image },
                  });
                });
              }
              
              // Add file images (PDF pages converted to images)
              if (msg.files) {
                msg.files.forEach((file) => {
                  if (file.type === 'pdf' || file.type === 'image') {
                    content.push({
                      type: 'image_url',
                      image_url: { url: file.content },
                    });
                  }
                });
              }
              
              return {
                role: msg.role,
                content,
              };
            }
            // Regular text message
            return {
              role: msg.role,
              content: msg.content,
            };
          }),
          memories: memories.map((m) => ({ id: m.id, content: m.content })),
          twitterProfileUrl: twitterProfileUrl || undefined,
          personaStyle: personaStyle || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      if (reader) {
        // Add assistant message placeholder immediately
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: '', timestamp: new Date(), pinned: false },
        ]);
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') {
                break;
              }
              if (data) {
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.type === 'status') {
                    // Show search status
                    setResearchStatus(parsed.content);
                  } else if (parsed.type === 'content' || parsed.content) {
                    // Clear status when content starts
                    if (parsed.type === 'content') {
                      setResearchStatus('');
                    }
                    assistantMessage += parsed.type === 'content' ? parsed.content : parsed.content;
                    setMessages((prev) => {
                      const newMessages = [...prev];
                      const lastMessage = newMessages[newMessages.length - 1];
                      if (lastMessage && lastMessage.role === 'assistant') {
                        newMessages[newMessages.length - 1] = {
                          ...lastMessage,
                          content: assistantMessage,
                        };
                      }
                      return newMessages;
                    });
                  }
                } catch (e) {
                  // Ignore JSON parse errors for incomplete chunks
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
          pinned: false,
        },
      ]);
    } finally {
      setIsLoading(false);
      setResearchStatus('');
    }
  };

  const sendResearchMessage = async (query: string) => {
    if (!query.trim() || isLoading) return;

    const userMessage: Message = { 
      role: 'user', 
      content: `🔍 Research: ${query}`, 
      timestamp: new Date(),
      pinned: false
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setResearchStatus('Breaking down research question...');

    let assistantMessage = '';

    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          researchDepth: 'standard',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get research response');
      }

      // Add assistant message placeholder for thinking
      let thinkingContent = '';
      let finalContent = '';
      let isThinking = true;
      
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '', timestamp: new Date(), pinned: false },
      ]);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      if (reader) {
        setResearchStatus('Starting research...');
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') {
                break;
              }
              if (data) {
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.type === 'thinking') {
                    // Update thinking content
                    thinkingContent += parsed.content;
                    setMessages((prev) => {
                      const newMessages = [...prev];
                      const lastMessage = newMessages[newMessages.length - 1];
                      if (lastMessage && lastMessage.role === 'assistant') {
                        newMessages[newMessages.length - 1] = {
                          ...lastMessage,
                          content: `**Research Process:**\n\`\`\`\n${thinkingContent}\n\`\`\`\n\n${finalContent}`,
                        };
                      }
                      return newMessages;
                    });
                  } else if (parsed.type === 'content') {
                    // Switch to final content
                    if (isThinking && thinkingContent) {
                      isThinking = false;
                      finalContent = '**Research Results:**\n\n';
                    }
                    finalContent += parsed.content;
                    assistantMessage = finalContent;
                    setMessages((prev) => {
                      const newMessages = [...prev];
                      const lastMessage = newMessages[newMessages.length - 1];
                      if (lastMessage && lastMessage.role === 'assistant') {
                        newMessages[newMessages.length - 1] = {
                          ...lastMessage,
                          content: thinkingContent 
                            ? `**Research Process:**\n\`\`\`\n${thinkingContent}\n\`\`\`\n\n${finalContent}`
                            : finalContent,
                        };
                      }
                      return newMessages;
                    });
                  } else if (parsed.content && !parsed.type) {
                    // Fallback for old format
                    finalContent += parsed.content;
                    assistantMessage = finalContent;
                    setMessages((prev) => {
                      const newMessages = [...prev];
                      const lastMessage = newMessages[newMessages.length - 1];
                      if (lastMessage && lastMessage.role === 'assistant') {
                        newMessages[newMessages.length - 1] = {
                          ...lastMessage,
                          content: thinkingContent 
                            ? `**Research Process:**\n\`\`\`\n${thinkingContent}\n\`\`\`\n\n${finalContent}`
                            : finalContent,
                        };
                      }
                      return newMessages;
                    });
                  }
                } catch (e) {
                  // Ignore JSON parse errors
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Research error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error during research. Please try again.',
          timestamp: new Date(),
          pinned: false,
        },
      ]);
    } finally {
      setIsLoading(false);
      setResearchStatus('');
    }
  };

  const handleSend = async (input: string, images?: string[], files?: ProcessedFile[], useResearch = false) => {
    if ((!input.trim() && (!images || images.length === 0) && (!files || files.length === 0)) || isLoading) return;

    if (queueMode) {
      // Add to queue
      const queuedMessage: QueuedMessage = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        content: input,
        images,
        files,
        timestamp: new Date(),
      };
      setQueue((prev) => [...prev, queuedMessage]);
      // Queue processing will be handled by useEffect
    } else {
      // Send immediately
      await sendMessage(input, images, files, useResearch);
    }
  };

  const removeFromQueue = (id: string) => {
    setQueue((prev) => prev.filter((msg) => msg.id !== id));
  };

  const clearQueue = () => {
    setQueue([]);
  };

  const handleOpenThread = (messageIndex: number) => {
    setOpenThreadIndex(messageIndex);
  };

  const handleCloseThread = () => {
    setOpenThreadIndex(null);
  };

  const handleThreadReply = async (content: string, images?: string[]) => {
    if ((!content.trim() && (!images || images.length === 0)) || isThreadLoading || openThreadIndex === null) return;

    const reply: ThreadReply = {
      role: 'user',
      content,
      timestamp: new Date(),
      images,
    };

    // Get the original message and all thread replies for context
    const originalMessage = messages[openThreadIndex];
    const currentThreadReplies = threads.get(openThreadIndex) || [];
    
    // Format messages for API
    const allThreadMessages: any[] = [];
    
    // Original message
    if (originalMessage.images && originalMessage.images.length > 0) {
      const content: any[] = [];
      if (originalMessage.content.trim()) {
        content.push({ type: 'text', text: originalMessage.content });
      }
      originalMessage.images.forEach((image) => {
        content.push({
          type: 'image_url',
          image_url: { url: image },
        });
      });
      allThreadMessages.push({
        role: originalMessage.role,
        content,
      });
    } else {
      allThreadMessages.push({
        role: originalMessage.role,
        content: originalMessage.content,
      });
    }
    
    // Thread replies
    currentThreadReplies.forEach((tr) => {
      if (tr.images && tr.images.length > 0) {
        const content: any[] = [];
        if (tr.content.trim()) {
          content.push({ type: 'text', text: tr.content });
        }
        tr.images.forEach((image) => {
          content.push({
            type: 'image_url',
            image_url: { url: image },
          });
        });
        allThreadMessages.push({
          role: tr.role,
          content,
        });
      } else {
        allThreadMessages.push({
          role: tr.role,
          content: tr.content,
        });
      }
    });
    
    // New reply
    if (images && images.length > 0) {
      const replyContent: any[] = [];
      if (content.trim()) {
        replyContent.push({ type: 'text', text: content });
      }
      images.forEach((image) => {
        replyContent.push({
          type: 'image_url',
          image_url: { url: image },
        });
      });
      allThreadMessages.push({
        role: 'user',
        content: replyContent,
      });
    } else {
      allThreadMessages.push({
        role: 'user',
        content,
      });
    }

    // Add user reply and assistant placeholder to thread
    setThreads((prev) => {
      const newThreads = new Map(prev);
      const existingReplies = newThreads.get(openThreadIndex) || [];
      newThreads.set(openThreadIndex, [
        ...existingReplies,
        reply,
        {
          role: 'assistant',
          content: '',
          timestamp: new Date(),
        },
      ]);
      return newThreads;
    });

    setIsThreadLoading(true);

    let assistantReply = '';

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: allThreadMessages,
          memories: memories.map((m) => ({ id: m.id, content: m.content })),
          twitterProfileUrl: twitterProfileUrl || undefined,
          personaStyle: personaStyle || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') {
                break;
              }
              if (data) {
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.content) {
                    assistantReply += parsed.content;
                    setThreads((prev) => {
                      const newThreads = new Map(prev);
                      const existingReplies = newThreads.get(openThreadIndex) || [];
                      const updatedReplies = [...existingReplies];
                      // The last reply should be the assistant placeholder we just added
                      const lastIndex = updatedReplies.length - 1;
                      if (lastIndex >= 0 && updatedReplies[lastIndex].role === 'assistant') {
                        updatedReplies[lastIndex] = {
                          ...updatedReplies[lastIndex],
                          content: assistantReply,
                        };
                        newThreads.set(openThreadIndex, updatedReplies);
                      }
                      return newThreads;
                    });
                  }
                } catch (e) {
                  // Ignore JSON parse errors
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsThreadLoading(false);
    }
  };

  const handleConfigurePersona = async () => {
    if (!twitterProfileUrl.trim() || isConfiguringPersona) return;
    setPersonaStatus('');
    setIsConfiguringPersona(true);
    let startedAt = Date.now();
    try {
      const res = await fetch('/api/persona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ twitterProfileUrl }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data) {
        console.error('Failed to configure persona', data);
        setPersonaStyle('');
        const serverError =
          typeof data?.error === 'string'
            ? data.error
            : 'Failed to configure persona from this profile.';
        setPersonaStatus(serverError);
        return;
      }

      if (data.personaStyle) {
        setPersonaStyle(data.personaStyle);
        setPersonaStatus('Persona configured from recent tweets / known style.');
      } else {
        setPersonaStyle('');
        setPersonaStatus('Could not extract a clear style from this profile.');
      }

      // Set profile picture URL if available
      if (data.profilePictureUrl) {
        setProfilePictureUrl(data.profilePictureUrl);
        setLoadingImageError(false); // Reset error state when new image is set
      } else {
        setProfilePictureUrl('');
        setLoadingImageError(false);
      }
    } catch (e) {
      console.error('Error configuring persona:', e);
      setPersonaStyle('');
      setPersonaStatus('Error while configuring persona. Try again.');
    } finally {
      const elapsed = Date.now() - startedAt;
      const minDuration = 800; // make the UX feel like it did some work
      if (elapsed < minDuration) {
        setTimeout(() => setIsConfiguringPersona(false), minDuration - elapsed);
      } else {
        setIsConfiguringPersona(false);
      }
    }
  };

  const activeAssistantName =
    activeCloneName ||
    (currentConversationId
      ? conversations.find((c) => c.id === currentConversationId)?.title || 'Clone'
      : 'Clone');

  const openCloneModal = () => {
    if (messages.length > 0) {
      saveCurrentConversation();
    }
    setMessages([]);
    setThreads(new Map());
    setOpenThreadIndex(null);
    setCurrentConversationId(null);
    setQueue([]);
    setActiveCloneName(null);
    setCloneHandle('');
    setClonePreviewName(null);
    setClonePreviewAvatar(null);
    setCloneError('');
    setIsCloning(false);
    setPersonaStatus('');
    setShowCloneModal(true);
  };

  const handleStartClone = async () => {
    if (!cloneHandle.trim() || isCloning) return;

    const rawHandle = cloneHandle.trim().replace(/^@/, '');
    const profileUrl = `https://x.com/${rawHandle}`;

    setCloneError('');
    setIsCloning(true);

    try {
      setTwitterProfileUrl(profileUrl);

      const res = await fetch('/api/persona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ twitterProfileUrl: profileUrl }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data) {
        const serverError =
          typeof data?.error === 'string'
            ? data.error
            : 'Failed to create clone from this profile.';
        setCloneError(serverError);
        return;
      }

      if (data.personaStyle) {
        setPersonaStyle(data.personaStyle);
      } else {
        setPersonaStyle('');
      }

      if (data.profilePictureUrl) {
        setProfilePictureUrl(data.profilePictureUrl);
        setClonePreviewAvatar(data.profilePictureUrl);
        setLoadingImageError(false);
      } else {
        setProfilePictureUrl('');
        setClonePreviewAvatar(null);
        setLoadingImageError(false);
      }

      const displayName: string =
        (data.displayName as string | null) || rawHandle || 'Clone';

      setClonePreviewName(displayName);
      setPersonaStatus('Clone ready – review and continue to chat.');
    } catch (e) {
      console.error('Error creating clone:', e);
      setCloneError('Error while creating clone. Please try again.');
    } finally {
      setIsCloning(false);
    }
  };

  const handleConfirmClone = () => {
    if (!clonePreviewName) return;

    const displayName = clonePreviewName;

    const newConversation: Conversation = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      title: displayName,
      messages: [],
      folderId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setConversations((prev) => [newConversation, ...prev]);
    setCurrentConversationId(newConversation.id);
    setActiveCloneName(displayName);
    setShowCloneModal(false);
  };

  return (
    <div className="flex flex-col h-screen bg-chat-bg relative">
      <ConversationSidebar
        conversations={conversations}
        folders={folders}
        currentConversationId={currentConversationId}
        onSelectConversation={loadConversation}
        onNewConversation={openCloneModal}
        onDeleteConversation={deleteConversation}
        onRenameConversation={renameConversation}
        onCreateFolder={createFolder}
        onDeleteFolder={deleteFolder}
        onRenameFolder={renameFolder}
        onMoveToFolder={moveToFolder}
      />
      <div className="flex flex-col h-screen bg-chat-bg" style={{ marginLeft: '256px' }}>
      <header className="flex items-center justify-between p-3 border-b border-chat-border bg-chat-bg animate-slide-in-up">
        <div className="flex items-center gap-3">
          <button className="p-1.5 hover:bg-chat-input rounded transition-all duration-200 hover:scale-110 active:scale-95">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              className="text-white"
            >
              <path
                d="M10 0a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm-1-11a1 1 0 0 1 2 0v4a1 1 0 0 1-2 0V7zm0 8a1 1 0 1 1 2 0 1 1 0 0 1-2 0z"
                fill="currentColor"
              />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-white">
            {activeAssistantName}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMemoryManager(true)}
            className="p-2 hover:bg-chat-input rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 text-gray-400 hover:text-white"
            title="Memories"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="text-current"
            >
              <path
                d="M8 0C3.6 0 0 3.6 0 8c0 1.4.4 2.7 1.1 3.8L0 16l4.2-1.1C5.3 15.6 6.6 16 8 16c4.4 0 8-3.6 8-8s-3.6-8-8-8z"
                fill="currentColor"
              />
            </svg>
          </button>
          {/* Persona configuration has been moved into the cloning flow */}
          <button
            onClick={() => setShowPinnedModal(true)}
            className={`p-2 hover:bg-chat-input rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 flex items-center gap-1.5 ${
              pinnedMessages.size > 0
                ? 'text-[#F59E0B] hover:text-[#F59E0B]'
                : 'text-gray-400 hover:text-white'
            }`}
            title="Pinned Messages"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="text-current"
            >
              <path d="M8 1l2 5h5l-4 3 1.5 5L8 12l-4.5 2L5 9 1 6h5l2-5z" fill="currentColor"/>
            </svg>
            {pinnedMessages.size > 0 && (
              <span className="text-xs font-medium">{pinnedMessages.size}</span>
            )}
          </button>
          <button className="p-2 hover:bg-chat-input rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 text-gray-400 hover:text-white">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="text-current"
            >
              <path
                d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm0 14A6 6 0 1 1 8 2a6 6 0 0 1 0 12zm-1-9h2v6H7V5zm0-2h2v2H7V3z"
                fill="currentColor"
              />
            </svg>
          </button>
          <button className="p-2 hover:bg-chat-input rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 text-gray-400 hover:text-white">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="text-current"
            >
              <path
                d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm0 14A6 6 0 1 1 8 2a6 6 0 0 1 0 12zm-1-9h2v6H7V5zm0-2h2v2H7V3z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4">
            <h2 className="text-4xl font-semibold mb-8 text-center text-white">
              What's on your mind today?
            </h2>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-8">
            {messages.map((message, index) => {
              const replyCount = threads.get(index)?.length || 0;
              const isPinned = pinnedMessages.has(index);
              return (
                <div
                  key={index}
                  ref={(el) => {
                    if (el) {
                      messageRefs.current.set(index, el);
                    } else {
                      messageRefs.current.delete(index);
                    }
                  }}
                >
                  <ChatMessage
                    message={{ ...message, pinned: isPinned }}
                    messageIndex={index}
                    replyCount={replyCount}
                    onOpenThread={handleOpenThread}
                    onTogglePin={togglePinMessage}
                    isPinned={isPinned}
                    onSaveAsMemory={addMemory}
                    profilePictureUrl={message.role === 'assistant' ? profilePictureUrl : undefined}
                    assistantName={activeAssistantName}
                  />
                </div>
              );
            })}
            {isLoading && messages.length > 0 && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex items-start gap-4 py-6 bg-[#343541] animate-fade-in">
                <div className="w-8 h-8 rounded-full bg-[#19C37D] flex items-center justify-center flex-shrink-0 ml-4 overflow-hidden">
                  {profilePictureUrl && !loadingImageError ? (
                    <img
                      src={profilePictureUrl}
                      alt="Chatbot profile"
                      className="w-full h-full object-cover"
                      onError={() => setLoadingImageError(true)}
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
                      {researchStatus ? '🔍 Research' : activeAssistantName}
                    </span>
                  </div>
                  {researchStatus && (
                    <div className="text-xs text-[#3B82F6] mb-2 animate-pulse">
                      {researchStatus}
                    </div>
                  )}
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
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      <div className="border-t border-chat-border">
        {(messages.length > 0 || queue.length > 0) && (
          <QueueDisplay
            queue={queue}
            onRemove={removeFromQueue}
            onClear={clearQueue}
            isProcessing={isProcessingQueue}
          />
        )}
        <div className="max-w-3xl mx-auto">
            {messages.length > 0 && (
              <div className="px-4 py-2 flex justify-center gap-2">
                {!currentConversationId && (
                  <button
                    onClick={() => saveCurrentConversation()}
                    className="px-4 py-2 bg-[#40414f] hover:bg-[#565869] text-white rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 text-sm font-medium flex items-center gap-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M4 12h8M4 8h8M4 4h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    Save Conversation
                  </button>
                )}
                {currentConversationId && folders.length > 0 && (
                  <div className="relative">
                    <div className="inline-flex items-center gap-2 px-3 py-2 bg-[#202123] border border-[#565869] rounded-full text-xs text-gray-300 shadow-sm">
                      <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wide text-gray-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#19C37D]" />
                        Folder
                      </span>
                      <div className="h-4 w-px bg-[#565869]/60" />
                      <div className="relative">
                        <select
                          value={conversations.find(c => c.id === currentConversationId)?.folderId || ''}
                          onChange={(e) => {
                            const conv = conversations.find(c => c.id === currentConversationId);
                            if (conv) {
                              moveToFolder(currentConversationId, e.target.value || null);
                            }
                          }}
                          className="bg-transparent pr-6 pl-1 py-0.5 text-sm text-white appearance-none cursor-pointer focus:outline-none"
                        >
                          <option value="">Move to folder...</option>
                          {folders.map((folder) => (
                            <option key={folder.id} value={folder.id}>
                              {folder.name}
                            </option>
                          ))}
                          {conversations.find(c => c.id === currentConversationId)?.folderId && (
                            <option value="">Remove from folder</option>
                          )}
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
              disabled={!queueMode && (isLoading || isProcessingQueue)}
              queueMode={queueMode}
              onQueueModeChange={setQueueMode}
              researchMode={researchMode}
              onResearchModeChange={setResearchMode}
            />
        </div>
      </div>

      {/* Thread Sidebar */}
      {openThreadIndex !== null && (
        <ThreadSidebar
          isOpen={openThreadIndex !== null}
          onClose={handleCloseThread}
          messageIndex={openThreadIndex}
          messageContent={messages[openThreadIndex]?.content || ''}
          messageImages={messages[openThreadIndex]?.images}
          threadReplies={threads.get(openThreadIndex) || []}
          onSendReply={handleThreadReply}
          isLoading={isThreadLoading}
          profilePictureUrl={profilePictureUrl}
          assistantName={activeAssistantName}
        />
      )}

      {/* Pinned Messages Modal */}
      <PinnedMessagesModal
        isOpen={showPinnedModal}
        onClose={() => setShowPinnedModal(false)}
        pinnedMessages={pinnedMessages}
        messages={messages}
        onNavigateToMessage={jumpToMessage}
        onTogglePin={togglePinMessage}
      />
      {/* Clone Modal */}
      {showCloneModal && (
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
                <label className="text-xs uppercase tracking-wide text-gray-400">
                  Handle
                </label>
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
                    onClick={handleStartClone}
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
                    <div className="text-lg font-semibold text-white">
                      {clonePreviewName}
                    </div>
                  )}
                  <div className="flex flex-col items-center gap-1 mt-2 text-xs text-gray-300">
                    {isCloning ? (
                      <>
                        <div className="flex gap-1 mb-1">
                          <div className="w-1.5 h-1.5 bg-[#19C37D] rounded-full animate-pulse" style={{ animationDelay: '0s' }} />
                          <div className="w-1.5 h-1.5 bg-[#19C37D] rounded-full animate-pulse" style={{ animationDelay: '0.15s' }} />
                          <div className="w-1.5 h-1.5 bg-[#19C37D] rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
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
                          onClick={handleConfirmClone}
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
                  onClick={() => !isCloning && setShowCloneModal(false)}
                  className="text-xs text-gray-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-[#374151] transition-all duration-200"
                  disabled={isCloning}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

