export interface LeaderboardEntry {
  rank: number;
  score: number;
  depth: number;
  maxCombo: number;
  timestamp: number;
  isDaily: boolean;
  weaponId: string;
}

const STORE_NAME = 'meta';
const SAVE_KEY = 'leaderboard';
const MAX_ENTRIES = 10;

/** Stored entry without rank (rank is assigned on retrieval) */
type StoredEntry = Omit<LeaderboardEntry, 'rank'>;

export class LeaderboardSystem {
  private db: IDBDatabase | null = null;
  private entries: StoredEntry[] = [];

  async init(db: IDBDatabase): Promise<void> {
    this.db = db;
    await this.load();
  }

  async addEntry(entry: Omit<LeaderboardEntry, 'rank'>): Promise<number> {
    this.entries.push({
      score: entry.score,
      depth: entry.depth,
      maxCombo: entry.maxCombo,
      timestamp: entry.timestamp,
      isDaily: entry.isDaily,
      weaponId: entry.weaponId,
    });

    // Sort descending by score
    this.entries.sort((a, b) => b.score - a.score);

    // Keep only top 10
    if (this.entries.length > MAX_ENTRIES) {
      this.entries.length = MAX_ENTRIES;
    }

    await this.save();

    // Return the rank (1-based) of the newly added entry, or 0 if it didn't make the board
    const idx = this.entries.findIndex(
      (e) => e.score === entry.score && e.timestamp === entry.timestamp,
    );
    return idx >= 0 ? idx + 1 : 0;
  }

  getTop10(): LeaderboardEntry[] {
    return this.entries.map((e, i) => ({
      rank: i + 1,
      score: e.score,
      depth: e.depth,
      maxCombo: e.maxCombo,
      timestamp: e.timestamp,
      isDaily: e.isDaily,
      weaponId: e.weaponId,
    }));
  }

  async clear(): Promise<void> {
    this.entries = [];
    await this.save();
  }

  // ── Persistence ──────────────────────────────────────────────

  private async load(): Promise<void> {
    if (!this.db) return;
    return new Promise((resolve) => {
      const tx = this.db!.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(SAVE_KEY);
      req.onsuccess = () => {
        const saved = req.result as StoredEntry[] | undefined;
        if (saved && Array.isArray(saved)) {
          this.entries = saved.sort((a, b) => b.score - a.score).slice(0, MAX_ENTRIES);
        }
        resolve();
      };
      req.onerror = () => resolve();
    });
  }

  private async save(): Promise<void> {
    if (!this.db) return;
    return new Promise((resolve) => {
      const tx = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(this.entries, SAVE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  }
}
