const STORE_NAME = 'meta';
const SAVE_KEY = 'achievements';
function defineAchievements() {
    return [
        {
            id: 'first_blood',
            name: 'First Blood',
            description: 'Kill your first enemy',
            condition: (s) => s.totalKills >= 1,
            unlocked: false,
        },
        {
            id: 'going_deep',
            name: 'Going Deep',
            description: 'Reach 1000m depth',
            condition: (s) => s.currentDepth >= 10000,
            unlocked: false,
        },
        {
            id: 'deeper_still',
            name: 'Deeper Still',
            description: 'Reach 2000m depth',
            condition: (s) => s.currentDepth >= 20000,
            unlocked: false,
        },
        {
            id: 'abyss_walker',
            name: 'Abyss Walker',
            description: 'Reach 5000m depth',
            condition: (s) => s.currentDepth >= 50000,
            unlocked: false,
        },
        {
            id: 'combo_starter',
            name: 'Combo Starter',
            description: 'Reach a 5x combo',
            condition: (s) => s.maxCombo >= 5,
            unlocked: false,
        },
        {
            id: 'combo_master',
            name: 'Combo Master',
            description: 'Reach a 30x combo',
            condition: (s) => s.maxCombo >= 30,
            unlocked: false,
        },
        {
            id: 'combo_legend',
            name: 'Combo Legend',
            description: 'Reach a 50x combo',
            condition: (s) => s.maxCombo >= 50,
            unlocked: false,
        },
        {
            id: 'untouchable',
            name: 'Untouchable',
            description: 'Clear 5 chunks without taking damage',
            condition: (s) => s.noDamageChunks >= 5,
            unlocked: false,
        },
        {
            id: 'ghost',
            name: 'Ghost',
            description: 'Clear 10 chunks without taking damage',
            condition: (s) => s.noDamageChunks >= 10,
            unlocked: false,
        },
        {
            id: 'boss_slayer',
            name: 'Boss Slayer',
            description: 'Defeat a boss',
            condition: (s) => s.bossesDefeated >= 1,
            unlocked: false,
        },
        {
            id: 'boss_hunter',
            name: 'Boss Hunter',
            description: 'Defeat 3 bosses',
            condition: (s) => s.bossesDefeated >= 3,
            unlocked: false,
        },
        {
            id: 'century',
            name: 'Century',
            description: 'Kill 100 enemies',
            condition: (s) => s.totalKills >= 100,
            unlocked: false,
        },
        {
            id: 'massacre',
            name: 'Massacre',
            description: 'Kill 500 enemies',
            condition: (s) => s.totalKills >= 500,
            unlocked: false,
        },
        {
            id: 'stomper',
            name: 'Stomper',
            description: 'Get 10 stomp kills',
            condition: (s) => s.stompKills >= 10,
            unlocked: false,
        },
        {
            id: 'ground_pound',
            name: 'Ground Pound',
            description: 'Get 50 stomp kills',
            condition: (s) => s.stompKills >= 50,
            unlocked: false,
        },
        {
            id: 'near_miss_expert',
            name: 'Near Miss Expert',
            description: 'Get 20 near misses',
            condition: (s) => s.nearMissCount >= 20,
            unlocked: false,
        },
        {
            id: 'bullet_dancer',
            name: 'Bullet Dancer',
            description: 'Get 50 near misses',
            condition: (s) => s.nearMissCount >= 50,
            unlocked: false,
        },
        {
            id: 'score_rookie',
            name: 'Score Rookie',
            description: 'Score 10,000 points',
            condition: (s) => s.currentScore >= 10000,
            unlocked: false,
        },
        {
            id: 'high_roller',
            name: 'High Roller',
            description: 'Score 50,000 points',
            condition: (s) => s.currentScore >= 50000,
            unlocked: false,
        },
        {
            id: 'score_king',
            name: 'Score King',
            description: 'Score 100,000 points',
            condition: (s) => s.currentScore >= 100000,
            unlocked: false,
        },
        {
            id: 'collector',
            name: 'Collector',
            description: 'Collect 100 pickups',
            condition: (s) => s.pickupsCollected >= 100,
            unlocked: false,
        },
        {
            id: 'tourist',
            name: 'Tourist',
            description: 'Visit all 6 biomes',
            condition: (s) => s.biomesVisited.size >= 6,
            unlocked: false,
        },
        // Biome mastery medals
        {
            id: 'mastery_surface',
            name: 'Surface Master',
            description: 'Reach Neon Gut without taking damage in Surface Fracture',
            condition: (s) => s.biomesVisited.has('neon_gut') && s.noDamageChunks >= 3,
            unlocked: false,
        },
        {
            id: 'mastery_neon_gut',
            name: 'Gut Runner',
            description: 'Clear Neon Gut and reach Data Crypt',
            condition: (s) => s.biomesVisited.has('data_crypt') && s.currentDepth >= 4000,
            unlocked: false,
        },
        {
            id: 'mastery_data_crypt',
            name: 'Crypt Breaker',
            description: 'Defeat the Bloom Heart boss',
            condition: (s) => s.bossesDefeated >= 1 && s.biomesVisited.has('data_crypt'),
            unlocked: false,
        },
        {
            id: 'mastery_hollow_market',
            name: 'Market Regular',
            description: 'Visit the Hollow Market 3 times',
            condition: (s) => s.biomesVisited.has('hollow_market') && s.totalRuns >= 3,
            unlocked: false,
        },
        {
            id: 'mastery_molten_grid',
            name: 'Heatproof',
            description: 'Survive the Molten Grid and reach Void Core',
            condition: (s) => s.biomesVisited.has('void_core'),
            unlocked: false,
        },
        {
            id: 'mastery_void_core',
            name: 'Void Conqueror',
            description: 'Reach depth 1000m in the Void Core',
            condition: (s) => s.currentDepth >= 105000,
            unlocked: false,
        },
        {
            id: 'veteran',
            name: 'Veteran',
            description: 'Complete 10 runs',
            condition: (s) => s.totalRuns >= 10,
            unlocked: false,
        },
        {
            id: 'dash_happy',
            name: 'Dash Happy',
            description: 'Dash 100 times',
            condition: (s) => s.dashCount >= 100,
            unlocked: false,
        },
        {
            id: 'arsenal',
            name: 'Arsenal',
            description: 'Use 4 different weapons',
            condition: (s) => s.weaponsUsed.size >= 4,
            unlocked: false,
        },
    ];
}
export class AchievementSystem {
    constructor() {
        this.achievements = defineAchievements();
        this.db = null;
        this.dirty = false;
        this.stats = {
            totalDepth: 0,
            totalKills: 0,
            maxCombo: 0,
            bossesDefeated: 0,
            currentCombo: 0,
            currentDepth: 0,
            currentHP: 0,
            maxHP: 0,
            noDamageChunks: 0,
            totalRuns: 0,
            currentScore: 0,
            stompKills: 0,
            dashCount: 0,
            nearMissCount: 0,
            pickupsCollected: 0,
            weaponsUsed: new Set(),
            biomesVisited: new Set(),
        };
    }
    async init(events, db) {
        this.events = events;
        this.db = db;
        await this.load();
        this.wireEvents();
    }
    wireEvents() {
        this.events.on('enemy:killed', (e) => {
            this.stats.totalKills++;
            if (e.killer === 'stomp')
                this.stats.stompKills++;
            this.dirty = true;
        });
        this.events.on('stomp:hit', () => {
            this.stats.stompKills++;
            this.dirty = true;
        });
        this.events.on('player:dash', () => {
            this.stats.dashCount++;
            this.dirty = true;
        });
        this.events.on('combo:increment', (d) => {
            this.stats.currentCombo = d.count;
            if (d.count > this.stats.maxCombo)
                this.stats.maxCombo = d.count;
            this.dirty = true;
        });
        this.events.on('combo:break', () => {
            this.stats.currentCombo = 0;
        });
        this.events.on('player:damage', () => {
            this.dirty = true;
        });
        this.events.on('near:miss', () => {
            this.stats.nearMissCount++;
            this.dirty = true;
        });
        this.events.on('pickup:collected', () => {
            this.stats.pickupsCollected++;
            this.dirty = true;
        });
        this.events.on('boss:defeated', () => {
            this.stats.bossesDefeated++;
            this.dirty = true;
        });
        this.events.on('depth:update', (d) => {
            this.stats.currentDepth = d.depth;
            this.dirty = true;
        });
        this.events.on('score:update', (d) => {
            this.stats.currentScore = d.score;
            this.dirty = true;
        });
        this.events.on('chunk:entered', () => {
            // Track consecutive no-damage chunks via external stat update
            this.dirty = true;
        });
        this.events.on('biome:enter', (d) => {
            this.stats.biomesVisited.add(d.id);
            this.dirty = true;
        });
        this.events.on('weapon:fire', (d) => {
            this.stats.weaponsUsed.add(d.weaponId);
            this.dirty = true;
        });
        this.events.on('run:end', () => {
            this.stats.totalRuns++;
            this.dirty = true;
        });
    }
    update() {
        if (!this.dirty)
            return;
        this.dirty = false;
        for (const ach of this.achievements) {
            if (ach.unlocked)
                continue;
            if (ach.condition(this.stats)) {
                ach.unlocked = true;
                this.events.emit('achievement:unlocked', { id: ach.id, name: ach.name });
                this.save();
            }
        }
    }
    /** Update no-damage-chunk counter from external game logic */
    setNoDamageChunks(n) {
        this.stats.noDamageChunks = n;
        this.dirty = true;
    }
    /** Set current HP/maxHP for future HP-based achievements */
    setHP(current, max) {
        this.stats.currentHP = current;
        this.stats.maxHP = max;
    }
    getUnlocked() {
        return this.achievements.filter((a) => a.unlocked);
    }
    getAll() {
        return this.achievements;
    }
    getStats() {
        return this.stats;
    }
    // ── Persistence ──────────────────────────────────────────────
    async load() {
        if (!this.db)
            return;
        return new Promise((resolve) => {
            const tx = this.db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const req = store.get(SAVE_KEY);
            req.onsuccess = () => {
                const saved = req.result;
                if (saved) {
                    // Restore unlocked flags
                    for (const id of saved.unlockedIds) {
                        const ach = this.achievements.find((a) => a.id === id);
                        if (ach)
                            ach.unlocked = true;
                    }
                    // Restore cumulative stats
                    this.stats.totalKills = saved.stats.totalKills ?? 0;
                    this.stats.totalDepth = saved.stats.totalDepth ?? 0;
                    this.stats.maxCombo = saved.stats.maxCombo ?? 0;
                    this.stats.bossesDefeated = saved.stats.bossesDefeated ?? 0;
                    this.stats.noDamageChunks = saved.stats.noDamageChunks ?? 0;
                    this.stats.totalRuns = saved.stats.totalRuns ?? 0;
                    this.stats.stompKills = saved.stats.stompKills ?? 0;
                    this.stats.dashCount = saved.stats.dashCount ?? 0;
                    this.stats.nearMissCount = saved.stats.nearMissCount ?? 0;
                    this.stats.pickupsCollected = saved.stats.pickupsCollected ?? 0;
                    this.stats.weaponsUsed = new Set(saved.stats.weaponsUsed ?? []);
                    this.stats.biomesVisited = new Set(saved.stats.biomesVisited ?? []);
                }
                resolve();
            };
            req.onerror = () => resolve();
        });
    }
    async save() {
        if (!this.db)
            return;
        const data = {
            unlockedIds: this.achievements.filter((a) => a.unlocked).map((a) => a.id),
            stats: {
                totalKills: this.stats.totalKills,
                totalDepth: this.stats.totalDepth,
                maxCombo: this.stats.maxCombo,
                bossesDefeated: this.stats.bossesDefeated,
                noDamageChunks: this.stats.noDamageChunks,
                totalRuns: this.stats.totalRuns,
                stompKills: this.stats.stompKills,
                dashCount: this.stats.dashCount,
                nearMissCount: this.stats.nearMissCount,
                pickupsCollected: this.stats.pickupsCollected,
                weaponsUsed: [...this.stats.weaponsUsed],
                biomesVisited: [...this.stats.biomesVisited],
            },
        };
        return new Promise((resolve) => {
            const tx = this.db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            store.put(data, SAVE_KEY);
            tx.oncomplete = () => resolve();
            tx.onerror = () => resolve();
        });
    }
    /** Reset per-run stats at start of a new run (cumulative stats persist) */
    resetRunStats() {
        this.stats.currentCombo = 0;
        this.stats.currentDepth = 0;
        this.stats.currentScore = 0;
        this.stats.currentHP = 0;
        this.stats.maxHP = 0;
        this.stats.noDamageChunks = 0;
    }
}
