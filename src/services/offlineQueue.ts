/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Offline Mutation Queue Engine
 * Buffers write operations while offline and replays them to the backend server upon reconnection.
 */

export interface QueuedMutation {
  id: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  description: string;
  timestamp: string;
  retryCount: number;
}

const QUEUE_STORAGE_KEY = 'bakery_offline_mutations_queue_v1';

// Subscriber callbacks for reactive UI updates
type QueueSubscriber = (queue: QueuedMutation[]) => void;
const subscribers: Set<QueueSubscriber> = new Set();

function notifySubscribers(queue: QueuedMutation[]) {
  subscribers.forEach((cb) => {
    try {
      cb(queue);
    } catch (err) {
      console.error('[OfflineQueue] Subscriber error:', err);
    }
  });
}

/**
 * Loads pending mutations from local storage
 */
export function getPendingMutations(): QueuedMutation[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('[OfflineQueue] Failed to parse queued mutations:', err);
    return [];
  }
}

/**
 * Persists pending mutations to local storage and alerts subscribers
 */
function saveQueue(queue: QueuedMutation[]) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    notifySubscribers(queue);
  } catch (err) {
    console.error('[OfflineQueue] Failed to save queue to localStorage:', err);
  }
}

/**
 * Enqueues a write mutation to be sent when online
 */
export function enqueueMutation(
  mutationData: Omit<QueuedMutation, 'id' | 'timestamp' | 'retryCount'>
): QueuedMutation {
  const currentQueue = getPendingMutations();
  const newMutation: QueuedMutation = {
    ...mutationData,
    id: `mut-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    retryCount: 0,
  };

  const updatedQueue = [...currentQueue, newMutation];
  saveQueue(updatedQueue);
  console.log(`[OfflineQueue] Mutation queued: "${newMutation.description}" (${updatedQueue.length} pending)`);
  return newMutation;
}

/**
 * Returns count of uncommitted mutations in the queue
 */
export function getPendingCount(): number {
  return getPendingMutations().length;
}

/**
 * Subscribes a React component or store to queue length changes
 */
export function subscribeQueue(callback: QueueSubscriber): () => void {
  subscribers.add(callback);
  // Initial callback with current state
  callback(getPendingMutations());
  return () => {
    subscribers.delete(callback);
  };
}

// Concurrency lock to prevent race conditions during queue draining
let isDrainingMutex = false;
let autoDrainIntervalTimer: any = null;

/**
 * Sequentially drains all queued mutations against the server in FIFO order
 */
export async function drainMutationQueue(): Promise<{
  processed: number;
  remaining: number;
  errors: string[];
}> {
  if (isDrainingMutex) {
    return {
      processed: 0,
      remaining: getPendingCount(),
      errors: ['Drain operation already in progress'],
    };
  }

  const queue = getPendingMutations();
  if (queue.length === 0) {
    return { processed: 0, remaining: 0, errors: [] };
  }

  isDrainingMutex = true;
  console.log(`[OfflineQueue] Draining ${queue.length} pending mutations...`);

  let processedCount = 0;
  const errors: string[] = [];
  const remainingQueue: QueuedMutation[] = [...queue];

  try {
    while (remainingQueue.length > 0) {
      const item = remainingQueue[0];
      const url = item.endpoint.startsWith('/') ? item.endpoint : `/api/${item.endpoint}`;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const res = await fetch(url, {
          method: item.method,
          credentials: 'include',
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store',
          },
          body: item.body ? JSON.stringify(item.body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          // If server responded with 409 conflict (e.g. order/customer already exists), consider it synced
          if (res.status === 409) {
            processedCount++;
            remainingQueue.shift();
            saveQueue(remainingQueue);
            console.log(`[OfflineQueue] Record already exists on server (409): ${item.description}`);
            continue;
          }

          // If client validation error 4xx: drop item so queue isn't permanently blocked
          if (res.status >= 400 && res.status < 500) {
            const errText = await res.text();
            console.warn(`[OfflineQueue] Mutation ${item.id} rejected by server (${res.status}): ${errText}`);
            errors.push(`Rejected (${res.status}): ${item.description}`);
            remainingQueue.shift();
            saveQueue(remainingQueue);
            continue;
          } else {
            // Server error 5xx: increment retry count
            item.retryCount += 1;
            if (item.retryCount >= 5) {
              console.error(`[OfflineQueue] Mutation exceeded 5 retries, skipping to prevent blocking: ${item.description}`);
              remainingQueue.shift();
              saveQueue(remainingQueue);
              errors.push(`Skipped after 5 retries: ${item.description}`);
              continue;
            }
            saveQueue(remainingQueue);
            errors.push(`Server error (${res.status}): ${item.description}`);
            break;
          }
        }

        // Success: dequeue item
        processedCount++;
        remainingQueue.shift();
        saveQueue(remainingQueue);
        console.log(`[OfflineQueue] Successfully flushed mutation: ${item.description}`);
      } catch (networkErr: any) {
        console.warn(`[OfflineQueue] Network error while flushing: ${item.description}`, networkErr);
        item.retryCount += 1;
        if (item.retryCount >= 5) {
          console.error(`[OfflineQueue] Network error persisted 5 retries, dropping item to unblock queue: ${item.description}`);
          remainingQueue.shift();
          saveQueue(remainingQueue);
          errors.push(`Skipped after 5 retries: ${item.description}`);
          continue;
        }
        saveQueue(remainingQueue);
        errors.push(`Network error: ${networkErr?.message || 'Disconnected'}`);
        break;
      }
    }
  } finally {
    isDrainingMutex = false;
  }

  return {
    processed: processedCount,
    remaining: remainingQueue.length,
    errors,
  };
}

/**
 * Starts automatic recurring queue flush in the browser (default every 10 seconds)
 */
export function startAutoDrain(intervalMs = 10000): () => void {
  if (typeof window === 'undefined') return () => {};

  if (!autoDrainIntervalTimer) {
    autoDrainIntervalTimer = setInterval(() => {
      if (getPendingCount() > 0) {
        drainMutationQueue().catch((err) => {
          console.warn('[OfflineQueue] Background auto-drain failed:', err);
        });
      }
    }, intervalMs);
  }

  return () => {
    if (autoDrainIntervalTimer) {
      clearInterval(autoDrainIntervalTimer);
      autoDrainIntervalTimer = null;
    }
  };
}

/**
 * Resets queue if needed
 */
export function clearMutationQueue(): void {
  saveQueue([]);
}

/**
 * Removes a specific mutation from the queue by its ID
 */
export function removeMutation(mutationId: string): void {
  const current = getPendingMutations();
  const updated = current.filter((m) => m.id !== mutationId);
  saveQueue(updated);
}
