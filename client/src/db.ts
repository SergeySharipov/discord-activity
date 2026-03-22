import { openDB, type IDBPDatabase } from 'idb';

export interface QueueEntry {
  userId: string;
  username: string;
  avatar: string | null;
  raisedAt: number;
}

interface HandQueueSchema {
  queue: {
    key: string;
    value: QueueEntry;
    indexes: { by_raisedAt: number };
  };
}

let dbPromise: Promise<IDBPDatabase<HandQueueSchema>> | null = null;

function getDb(): Promise<IDBPDatabase<HandQueueSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<HandQueueSchema>('hand-queue-db', 1, {
      upgrade(db) {
        const store = db.createObjectStore('queue', { keyPath: 'userId' });
        store.createIndex('by_raisedAt', 'raisedAt');
      },
    });
  }
  return dbPromise;
}

export async function loadQueueFromDB(): Promise<QueueEntry[]> {
  const db = await getDb();
  return db.getAllFromIndex('queue', 'by_raisedAt');
}

export async function saveQueueToDB(entries: QueueEntry[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction('queue', 'readwrite');
  await tx.store.clear();
  await Promise.all(entries.map((e) => tx.store.put(e)));
  await tx.done;
}

export async function clearQueueDB(): Promise<void> {
  const db = await getDb();
  await db.clear('queue');
}
