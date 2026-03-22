import { useCallback, useEffect, useRef, useState } from 'react';
import socket from './socket';
import { loadQueueFromDB, saveQueueToDB, type QueueEntry } from './db';
import type { DiscordUser } from './discord';

export type { QueueEntry };

export interface UseQueueResult {
  queue: QueueEntry[];
  connected: boolean;
  raiseHand: () => void;
  lowerHand: (userId: string) => void;
  clearQueue: () => void;
  isRaised: boolean;
}

export function useQueue(user: DiscordUser | null): UseQueueResult {
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [connected, setConnected] = useState(false);
  const queueRef = useRef<QueueEntry[]>([]);

  // Keep ref in sync for use inside socket handlers
  const updateQueue = useCallback((next: QueueEntry[]) => {
    const sorted = [...next].sort((a, b) => a.raisedAt - b.raisedAt);
    queueRef.current = sorted;
    setQueue(sorted);
    saveQueueToDB(sorted);
  }, []);

  useEffect(() => {
    // Show cached queue immediately while connecting
    loadQueueFromDB().then((cached) => {
      if (cached.length > 0 && queueRef.current.length === 0) {
        setQueue(cached);
        queueRef.current = cached;
      }
    });

    socket.connect();

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    const onInit = (serverQueue: QueueEntry[]) => {
      updateQueue(serverQueue);
    };

    const onRaised = (entry: QueueEntry) => {
      const current = queueRef.current;
      if (current.find((e) => e.userId === entry.userId)) return;
      updateQueue([...current, entry]);
    };

    const onLowered = (userId: string) => {
      updateQueue(queueRef.current.filter((e) => e.userId !== userId));
    };

    const onCleared = () => {
      updateQueue([]);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('queue:init', onInit);
    socket.on('hand:raised', onRaised);
    socket.on('hand:lowered', onLowered);
    socket.on('queue:cleared', onCleared);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('queue:init', onInit);
      socket.off('hand:raised', onRaised);
      socket.off('hand:lowered', onLowered);
      socket.off('queue:cleared', onCleared);
      socket.disconnect();
    };
  }, [updateQueue]);

  const raiseHand = useCallback(() => {
    if (!user || !connected) return;
    const entry: QueueEntry = {
      userId: user.id,
      username: user.username,
      avatar: user.avatar,
      raisedAt: Date.now(),
    };
    socket.emit('hand:raise', entry);
  }, [user, connected]);

  const lowerHand = useCallback((userId: string) => {
    if (!connected) return;
    socket.emit('hand:lower', userId);
  }, [connected]);

  const clearQueue = useCallback(() => {
    if (!connected) return;
    socket.emit('queue:clear');
  }, [connected]);

  const isRaised = Boolean(user && queue.some((e) => e.userId === user.id));

  return { queue, connected, raiseHand, lowerHand, clearQueue, isRaised };
}
