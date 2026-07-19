export interface QueueItem {
  id: string;
  number: number;
  name: string;
  registeredAt: number;
  calledAt?: number;
  completedAt?: number;
  status: 'waiting' | 'called' | 'completed' | 'skipped';
  remarks?: string;
}

export interface QueueState {
  queue: QueueItem[];
  lastNumber: number;
}

export type ViewMode = 'select' | 'ipad' | 'pc';

export const DEFAULT_PRACTITIONERS = [
  '배지훈',
  '이서진',
  '이원준',
  '박도현',
  '장원우',
  '김규민',
];
