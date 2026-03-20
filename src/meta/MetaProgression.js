/**
 * MetaProgression — persistent upgrades between runs.
 * Uses IndexedDB for storage (DB opened by SaveManager).
 */
import metaUpgradesData from '@data/meta-upgrades.json';
const STORE_NAME = 'meta';
const SAVE_KEY = 'progression';
const DEFAULT_SAVE = {
    shards: 0,
    upgradeLevels: {},
    totalRuns: 0,
    bestScore: 0,
    bestDepth: 0,
    dailyDate: null,
    dailyBestScore: 0,
    dailyCompleted: false,
};
export const META_UPGRADES = metaUpgradesData;
export class MetaProgression {
    constructor() {
        this.db = null;
        this.data = { ...DEFAULT_SAVE };
        this.ready = false;
    }
    async init(db) {
        this.db = db;
        await this.load();
        this.ready = true;
    }
    async load() {
        if (!this.db)
            return;
        return new Promise((resolve) => {
            const tx = this.db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const req = store.get(SAVE_KEY);
            req.onsuccess = () => {
                if (req.result) {
                    this.data = { ...DEFAULT_SAVE, ...req.result };
                }
                resolve();
            };
            req.onerror = () => resolve(); // use defaults
        });
    }
    async save() {
        if (!this.db)
            return;
        return new Promise((resolve) => {
            const tx = this.db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            store.put(this.data, SAVE_KEY);
            tx.oncomplete = () => resolve();
            tx.onerror = () => resolve();
        });
    }
    get shards() { return this.data.shards; }
    get totalRuns() { return this.data.totalRuns; }
    get bestScore() { return this.data.bestScore; }
    get bestDepth() { return this.data.bestDepth; }
    get isReady() { return this.ready; }
    get dailyBestScore() { return this.data.dailyBestScore; }
    get dailyCompleted() { return this.data.dailyCompleted; }
    get dailyDate() { return this.data.dailyDate; }
    getUpgradeLevel(id) {
        return this.data.upgradeLevels[id] ?? 0;
    }
    canAfford(upgrade) {
        const level = this.getUpgradeLevel(upgrade.id);
        if (level >= upgrade.maxLevel)
            return false;
        return this.data.shards >= upgrade.costs[level];
    }
    isMaxed(upgrade) {
        return this.getUpgradeLevel(upgrade.id) >= upgrade.maxLevel;
    }
    async purchaseUpgrade(upgrade) {
        const level = this.getUpgradeLevel(upgrade.id);
        if (level >= upgrade.maxLevel)
            return false;
        const cost = upgrade.costs[level];
        if (this.data.shards < cost)
            return false;
        this.data.shards -= cost;
        this.data.upgradeLevels[upgrade.id] = level + 1;
        await this.save();
        return true;
    }
    isDailyAvailable() {
        const today = this.getTodayDateString();
        return this.data.dailyDate !== today || !this.data.dailyCompleted;
    }
    async recordDailyEnd(score, depth, currencyEarned) {
        const today = this.getTodayDateString();
        this.data.totalRuns++;
        // Track daily best separately
        if (this.data.dailyDate !== today) {
            this.data.dailyDate = today;
            this.data.dailyBestScore = score;
            this.data.dailyCompleted = true;
        }
        else if (score > this.data.dailyBestScore) {
            this.data.dailyBestScore = score;
        }
        // Also update overall bests
        if (score > this.data.bestScore)
            this.data.bestScore = score;
        if (depth > this.data.bestDepth)
            this.data.bestDepth = depth;
        const shardBonusLevel = this.getUpgradeLevel('shard_bonus');
        const shardMultiplier = 1 + shardBonusLevel * 0.2;
        const shardsEarned = Math.floor(currencyEarned * shardMultiplier);
        this.data.shards += shardsEarned;
        await this.save();
        return shardsEarned;
    }
    async recordRunEnd(score, depth, currencyEarned) {
        this.data.totalRuns++;
        if (score > this.data.bestScore)
            this.data.bestScore = score;
        if (depth > this.data.bestDepth)
            this.data.bestDepth = depth;
        // Convert run currency to shards
        const shardBonusLevel = this.getUpgradeLevel('shard_bonus');
        const shardMultiplier = 1 + shardBonusLevel * 0.2;
        const shardsEarned = Math.floor(currencyEarned * shardMultiplier);
        this.data.shards += shardsEarned;
        await this.save();
        return shardsEarned;
    }
    /** Get effective value for a meta upgrade to apply at run start */
    getEffectValue(effectKey) {
        const upgrade = META_UPGRADES.find(u => u.effect === effectKey);
        if (!upgrade)
            return 0;
        const level = this.getUpgradeLevel(upgrade.id);
        let total = 0;
        for (let i = 0; i < level; i++) {
            total += upgrade.values[i];
        }
        return total;
    }
    getTodayDateString() {
        const d = new Date();
        return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    }
}
