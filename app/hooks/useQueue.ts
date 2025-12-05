import { useState, useEffect } from 'react';
import { QueuedMessage } from '../types';

interface UseQueueProps {
  queueMode: boolean;
  isLoading: boolean;
  onSendMessage: (content: string, images?: string[], files?: any[]) => Promise<void>;
}

export function useQueue({ queueMode, isLoading, onSendMessage }: UseQueueProps) {
  const [queue, setQueue] = useState<QueuedMessage[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);

  useEffect(() => {
    const processNext = async () => {
      if (queue.length === 0 || isLoading || isProcessingQueue) return;

      setIsProcessingQueue(true);
      const nextMessage = queue[0];
      setQueue((prev) => prev.slice(1));
      await onSendMessage(nextMessage.content, nextMessage.images, nextMessage.files);
      setIsProcessingQueue(false);
    };

    if (!isLoading && !isProcessingQueue && queue.length > 0) {
      processNext();
    }
  }, [isLoading, queue.length, isProcessingQueue, onSendMessage]);

  const addToQueue = (content: string, images?: string[], files?: any[]) => {
    const queuedMessage: QueuedMessage = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      content,
      images,
      files,
      timestamp: new Date(),
    };
    setQueue((prev) => [...prev, queuedMessage]);
  };

  const removeFromQueue = (id: string) => {
    setQueue((prev) => prev.filter((msg) => msg.id !== id));
  };

  const clearQueue = () => {
    setQueue([]);
  };

  return {
    queue,
    isProcessingQueue,
    addToQueue,
    removeFromQueue,
    clearQueue,
  };
}

