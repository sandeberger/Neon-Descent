import type { EventBus } from '@core/EventBus';

interface AnalyticsEvent {
  type: string;
  data: Record<string, unknown>;
  timestamp: number;
  runId: string;
}

const ANALYTICS_STORE = 'analytics';
const FLUSH_INTERVAL = 10; // seconds

export class AnalyticsManager {
  private queue: AnalyticsEvent[] = [];
  private runId = '';
  private flushTimer = 0;
  private db: IDBDatabase | null = null;

  init(db: IDBDatabase): void {
    this.db = db;
  }

  bindToEvents(events: EventBus): void {
    this.runId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this.track('run_start', {});

    events.on('player:dead', (e) => {
      this.track('death', { killer: e.killer, x: e.position.x, y: e.position.y });
      this.track('run_end', { cause: e.killer });
      this.flush();
    });

    events.on('enemy:killed', (e) => {
      this.track('enemy_kill', {
        enemyId: e.enemyId, killer: e.killer,
        scoreValue: e.scoreValue,
      });
    });

    events.on('upgrade:chosen', (e) => {
      this.track('upgrade_chosen', { id: e.id, alternatives: e.alternatives });
    });

    events.on('combo:break', (e) => {
      this.track('combo_break', { finalCount: e.finalCount });
    });

    events.on('player:damage', (e) => {
      this.track('damage_taken', { amount: e.amount, source: e.source });
    });

    events.on('biome:enter', (e) => {
      this.track('biome_enter', { id: e.id, depth: e.depth });
    });

    events.on('shop:purchase', (e) => {
      this.track('shop_purchase', { id: e.id, cost: e.cost });
    });
  }

  track(type: string, data: Record<string, unknown>): void {
    this.queue.push({
      type,
      data,
      timestamp: Date.now(),
      runId: this.runId,
    });
  }

  update(dt: number): void {
    this.flushTimer += dt;
    if (this.flushTimer >= FLUSH_INTERVAL) {
      this.flushTimer = 0;
      this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.queue.length === 0 || !this.db) return;

    const events = this.queue.splice(0);

    // Log to console for development
    for (const e of events) {
      console.log(`[analytics] ${e.type}`, e.data);
    }

    // Write to IndexedDB
    try {
      const tx = this.db.transaction(ANALYTICS_STORE, 'readwrite');
      const store = tx.objectStore(ANALYTICS_STORE);
      for (const event of events) {
        store.add(event);
      }
    } catch {
      // Silently fail — analytics should never break gameplay
    }
  }
}
