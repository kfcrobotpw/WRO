import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  setDoc,
  updateDoc,
  getDocs,
  writeBatch,
  limit,
  deleteDoc
} from 'firebase/firestore';
import { QueueItem } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyAQizCRqXWmAxOw71jyGqo_OG3TC5LdELs",
  authDomain: "gen-lang-client-0841243023.firebaseapp.com",
  projectId: "gen-lang-client-0841243023",
  storageBucket: "gen-lang-client-0841243023.firebasestorage.app",
  messagingSenderId: "482983685217",
  appId: "1:482983685217:web:dd0439aa0cb08c6a5d4e20"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with the dedicated database ID
export const db = getFirestore(app, "ai-studio-wro-5634700f-2429-4573-9d52-ac5038a01716");

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Subscribes to real-time updates of the queue collection.
 * Documents are sorted by registeredAt time in ascending order.
 */
export function subscribeToQueue(callback: (queue: QueueItem[]) => void) {
  const q = query(collection(db, 'queue'), orderBy('registeredAt', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const items: QueueItem[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      items.push({
        id: doc.id,
        number: data.number,
        name: data.name,
        registeredAt: data.registeredAt,
        calledAt: data.calledAt,
        completedAt: data.completedAt,
        status: data.status,
        remarks: data.remarks || '',
      } as QueueItem);
    });
    callback(items);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'queue');
  });
}

/**
 * Fetches the next queue number by ordering the database by number descending.
 * Starts at 101 if the queue is empty.
 */
export async function getNextNumber(): Promise<number> {
  try {
    const q = query(collection(db, 'queue'), orderBy('number', 'desc'), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return 101;
    }
    let maxNum = 100;
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.number && data.number > maxNum) {
        maxNum = data.number;
      }
    });
    return maxNum + 1;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'queue');
  }
}

/**
 * Registers a new queue item in Firestore.
 */
export async function addQueueItem(name: string, remarks?: string): Promise<QueueItem> {
  try {
    const nextNum = await getNextNumber();
    const id = doc(collection(db, 'queue')).id;
    const newItem: QueueItem = {
      id,
      number: nextNum,
      name: name.trim(),
      registeredAt: Date.now(),
      status: 'waiting',
      remarks: remarks ? remarks.trim() : '',
    };
    await setDoc(doc(db, 'queue', id), newItem);
    return newItem;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'queue');
  }
}

/**
 * Updates the status of an existing queue item.
 */
export async function updateQueueItemStatus(id: string, status: 'waiting' | 'called' | 'completed' | 'skipped') {
  try {
    const itemRef = doc(db, 'queue', id);
    if (status === 'completed') {
      await deleteDoc(itemRef);
      return;
    }
    const updates: Partial<QueueItem> = { status };
    if (status === 'called') {
      updates.calledAt = Date.now();
    }
    await updateDoc(itemRef, updates);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `queue/${id}`);
  }
}

/**
 * Clears/Resets all queue documents in Firestore.
 */
export async function resetQueue() {
  try {
    const q = query(collection(db, 'queue'));
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, 'queue');
  }
}

/**
 * Seeds the queue with sample names.
 */
export async function seedQueue(names: string[]) {
  try {
    const batch = writeBatch(db);
    let nextNum = await getNextNumber();
    for (const name of names) {
      const id = doc(collection(db, 'queue')).id;
      const newItem: QueueItem = {
        id,
        number: nextNum,
        name: name.trim(),
        registeredAt: Date.now(),
        status: 'waiting',
        remarks: '',
      };
      batch.set(doc(db, 'queue', id), newItem);
      nextNum += 1;
    }
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'queue');
  }
}
