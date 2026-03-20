/**
 * SaveManager — handles IndexedDB for meta progression, run state, and analytics.
 * DB version 3 adds the "analytics" store.
 */

export interface RunState {
  seed: number;
  depth: number;
  score: number;
  hp: number;
  maxHp: number;
  currency: number;
  weaponId: string;
  upgrades: string[];
  comboCount: number;
  chunkIndex: number;
  playerX: number;
  playerY: number;
  timestamp: number;
  isDaily?: boolean;
  specialCharges?: number;
  specialKillsAccum?: number;
}

const DB_NAME = 'neon_descent';
const DB_VERSION = 3;
const META_STORE = 'meta';
const RUN_STORE = 'run';
const ANALYTICS_STORE = 'analytics';
const RUN_KEY = 'current';

export class SaveManager {
  db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(META_STORE)) {
          db.createObjectStore(META_STORE);
        }
        if (!db.objectStoreNames.contains(RUN_STORE)) {
          db.createObjectStore(RUN_STORE);
        }
        if (!db.objectStoreNames.contains(ANALYTICS_STORE)) {
          const store = db.createObjectStore(ANALYTICS_STORE, { autoIncrement: true });
          store.createIndex('runId', 'runId', { unique: false });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };

      req.onsuccess = () => {
        this.db = req.result;
        resolve();
      };

      req.onerror = () => reject(req.error);
    });
  }

  async saveRun(state: RunState): Promise<void> {
    if (!this.db) return;
    return new Promise((resolve) => {
      const tx = this.db!.transaction(RUN_STORE, 'readwrite');
      const store = tx.objectStore(RUN_STORE);
      store.put(state, RUN_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  }

  async loadRun(): Promise<RunState | null> {
    if (!this.db) return null;
    return new Promise((resolve) => {
      const tx = this.db!.transaction(RUN_STORE, 'readonly');
      const store = tx.objectStore(RUN_STORE);
      const req = store.get(RUN_KEY);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => resolve(null);
    });
  }

  async clearRun(): Promise<void> {
    if (!this.db) return;
    return new Promise((resolve) => {
      const tx = this.db!.transaction(RUN_STORE, 'readwrite');
      const store = tx.objectStore(RUN_STORE);
      store.delete(RUN_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  }
}
