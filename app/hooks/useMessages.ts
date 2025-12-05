import { useState, useRef, useEffect } from 'react';
import { Message, ThreadReply } from '../types';
import { sendChatMessage, sendThreadReply } from '../services/chatService';
import { Memory } from '../types';

interface UseMessagesProps {
  memories: Memory[];
  twitterProfileUrl: string;
  personaStyle: string;
}

export function useMessages({ memories, twitterProfileUrl, personaStyle }: UseMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [threads, setThreads] = useState<Map<number, ThreadReply[]>>(new Map());
  const [openThreadIndex, setOpenThreadIndex] = useState<number | null>(null);
  const [isThreadLoading, setIsThreadLoading] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState<Set<number>>(new Set());
  const [researchStatus, setResearchStatus] = useState<string>('');
  const messageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    setMessages((prev) =>
      prev.map((msg, idx) => (idx === messageIndex ? { ...msg, pinned: !msg.pinned } : msg))
    );
  };

  const setPinnedMessagesSet = (pinned: Set<number>) => {
    setPinnedMessages(pinned);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const jumpToMessage = (messageIndex: number) => {
    const messageElement = messageRefs.current.get(messageIndex);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (
    input: string,
    images?: string[],
    files?: any[],
    useResearch = false
  ) => {
    if ((!input.trim() && (!images || images.length === 0) && (!files || files.length === 0)) || isLoading) {
      return;
    }

    if (useResearch && !images && !files) {
      await sendResearchMessage(input);
      return;
    }

    let combinedContent = input;
    if (files && files.length > 0) {
      const textFiles = files.filter((f) => f.type === 'text');
      if (textFiles.length > 0) {
        const fileTexts = textFiles.map((f) => `[File: ${f.name}]\n${f.content}`).join('\n\n');
        combinedContent = combinedContent ? `${combinedContent}\n\n${fileTexts}` : fileTexts;
      }
    }

    const userMessage: Message = {
      role: 'user',
      content: combinedContent,
      images,
      files,
      timestamp: new Date(),
      pinned: false,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setResearchStatus('');

    const updatedMessages = [...messages, userMessage];
    let assistantMessage = '';

    try {
      await sendChatMessage(
        updatedMessages,
        memories,
        twitterProfileUrl,
        personaStyle,
        (status) => setResearchStatus(status),
        (content) => {
          assistantMessage += content;
          setMessages((prev) => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage && lastMessage.role === 'assistant') {
              newMessages[newMessages.length - 1] = {
                ...lastMessage,
                content: assistantMessage,
              };
            } else {
              newMessages.push({
                role: 'assistant',
                content: assistantMessage,
                timestamp: new Date(),
                pinned: false,
              });
            }
            return newMessages;
          });
        }
      );

      if (assistantMessage === '') {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            pinned: false,
          },
        ]);
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
      pinned: false,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setResearchStatus('Breaking down research question...');

    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          researchDepth: 'standard',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get research response');
      }

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
              if (data === '[DONE]') break;
              if (data) {
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.type === 'thinking') {
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
                    if (isThinking && thinkingContent) {
                      isThinking = false;
                      finalContent = '**Research Results:**\n\n';
                    }
                    finalContent += parsed.content;
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

  const handleThreadReply = async (content: string, images?: string[], messageIndex: number) => {
    if ((!content.trim() && (!images || images.length === 0)) || isThreadLoading || openThreadIndex === null) {
      return;
    }

    const reply: ThreadReply = {
      role: 'user',
      content,
      timestamp: new Date(),
      images,
    };

    const originalMessage = messages[messageIndex];
    const currentThreadReplies = threads.get(messageIndex) || [];

    const allThreadMessages: any[] = [];

    if (originalMessage.images && originalMessage.images.length > 0) {
      const content: any[] = [];
      if (originalMessage.content.trim()) {
        content.push({ type: 'text', text: originalMessage.content });
      }
      originalMessage.images.forEach((image) => {
        content.push({ type: 'image_url', image_url: { url: image } });
      });
      allThreadMessages.push({ role: originalMessage.role, content });
    } else {
      allThreadMessages.push({ role: originalMessage.role, content: originalMessage.content });
    }

    currentThreadReplies.forEach((tr) => {
      if (tr.images && tr.images.length > 0) {
        const content: any[] = [];
        if (tr.content.trim()) {
          content.push({ type: 'text', text: tr.content });
        }
        tr.images.forEach((image) => {
          content.push({ type: 'image_url', image_url: { url: image } });
        });
        allThreadMessages.push({ role: tr.role, content });
      } else {
        allThreadMessages.push({ role: tr.role, content: tr.content });
      }
    });

    if (images && images.length > 0) {
      const replyContent: any[] = [];
      if (content.trim()) {
        replyContent.push({ type: 'text', text: content });
      }
      images.forEach((image) => {
        replyContent.push({ type: 'image_url', image_url: { url: image } });
      });
      allThreadMessages.push({ role: 'user', content: replyContent });
    } else {
      allThreadMessages.push({ role: 'user', content });
    }

    setThreads((prev) => {
      const newThreads = new Map(prev);
      const existingReplies = newThreads.get(messageIndex) || [];
      newThreads.set(messageIndex, [
        ...existingReplies,
        reply,
        { role: 'assistant', content: '', timestamp: new Date() },
      ]);
      return newThreads;
    });

    setIsThreadLoading(true);
    let assistantReply = '';

    try {
      await sendThreadReply(
        allThreadMessages,
        memories,
        twitterProfileUrl,
        personaStyle,
        (content) => {
          assistantReply += content;
          setThreads((prev) => {
            const newThreads = new Map(prev);
            const existingReplies = newThreads.get(messageIndex) || [];
            const updatedReplies = [...existingReplies];
            const lastIndex = updatedReplies.length - 1;
            if (lastIndex >= 0 && updatedReplies[lastIndex].role === 'assistant') {
              updatedReplies[lastIndex] = {
                ...updatedReplies[lastIndex],
                content: assistantReply,
              };
              newThreads.set(messageIndex, updatedReplies);
            }
            return newThreads;
          });
        }
      );
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsThreadLoading(false);
    }
  };

  return {
    messages,
    setMessages,
    isLoading,
    threads,
    openThreadIndex,
    setOpenThreadIndex,
    isThreadLoading,
    pinnedMessages,
    setPinnedMessages: setPinnedMessagesSet,
    researchStatus,
    messageRefs,
    messagesEndRef,
    sendMessage,
    sendResearchMessage,
    handleThreadReply,
    togglePinMessage,
    jumpToMessage,
  };
}

