import type { Vec2 } from '@utils/math';

export interface GameEvents {
  'player:damage':    { amount: number; source: string };
  'player:dead':      { position: Vec2; killer: string };
  'player:heal':      { amount: number };
  'player:stomp':     { x: number; y: number };
  'player:dash':      { direction: Vec2 };
  'player:wallslide': { side: 'left' | 'right' };
  'enemy:killed':     { enemyId: number; killer: string; x: number; y: number; scoreValue: number; comboValue: number };
  'enemy:damaged':    { enemyId: number; amount: number };
  'stomp:hit':        { targetId: number; bounceForce: number; x: number; y: number };
  'combo:increment':  { count: number; tier: number };
  'combo:break':      { finalCount: number };
  'combo:threshold':  { tier: number };
  'near:miss':        { distance: number };
  'pickup:collected': { type: string; value: number };
  'upgrade:chosen':   { id: string; alternatives: string[] };
  'shop:purchase':    { id: string; cost: number };
  'biome:enter':      { id: string; depth: number };
  'chunk:entered':    { chunkIndex: number };
  'depth:update':     { depth: number; delta: number };
  'run:start':        { seed: number };
  'run:end':          { score: number; depth: number; cause: string };
  'score:update':     { score: number; delta: number };
  'weapon:fire':      { weaponId: string; x: number; y: number };
  'boss:phase':       { bossId: number; phase: number };
  'boss:defeated':    { bossId: number; timeMs: number };
  'special:ready':    {};
  'special:activate': { abilityId: string };
  'special:emp':      { x: number; y: number; enemiesHit: number };
  'achievement:unlocked': { id: string; name: string };
  'chain:hit':        { x: number; y: number; targets: number };
}

type Listener<T> = (data: T) => void;

export class EventBus {
  private listeners = new Map<string, Set<Function>>();

  on<K extends keyof GameEvents>(event: K, fn: Listener<GameEvents[K]>): void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(fn);
  }

  off<K extends keyof GameEvents>(event: K, fn: Listener<GameEvents[K]>): void {
    this.listeners.get(event)?.delete(fn);
  }

  emit<K extends keyof GameEvents>(event: K, data: GameEvents[K]): void {
    const set = this.listeners.get(event);
    if (set) {
      for (const fn of set) {
        (fn as Listener<GameEvents[K]>)(data);
      }
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}
