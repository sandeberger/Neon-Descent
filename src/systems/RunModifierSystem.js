/**
 * Run Modifiers — optional gameplay mutators that alter run parameters.
 * Unlocked via meta progression. Can be toggled before starting a run.
 */
export const RUN_MODIFIERS = [
    {
        id: 'iron_descent',
        name: 'Iron Descent',
        description: 'Enemies have 50% more HP. 2x score.',
        unlockCondition: 'Reach depth 3000m',
        effects: [
            { type: 'enemy_hp_mult', value: 1.5 },
            { type: 'score_mult', value: 2.0 },
        ],
    },
    {
        id: 'velocity_run',
        name: 'Velocity Run',
        description: 'Everything moves 30% faster. 1.5x score.',
        unlockCondition: 'Reach depth 2000m',
        effects: [
            { type: 'enemy_speed_mult', value: 1.3 },
            { type: 'scroll_speed_mult', value: 1.3 },
            { type: 'score_mult', value: 1.5 },
        ],
    },
    {
        id: 'glass_cannon',
        name: 'Glass Cannon',
        description: '1 HP max. 3x score.',
        unlockCondition: 'Defeat a boss',
        effects: [
            { type: 'one_hit', value: 1 },
            { type: 'score_mult', value: 3.0 },
        ],
    },
    {
        id: 'no_rest',
        name: 'No Rest',
        description: 'No recovery or shop chunks. 1.5x currency.',
        unlockCondition: 'Complete 10 runs',
        effects: [
            { type: 'no_shops', value: 1 },
            { type: 'no_recovery', value: 1 },
            { type: 'currency_mult', value: 1.5 },
        ],
    },
    {
        id: 'combo_pressure',
        name: 'Combo Pressure',
        description: 'Combo decays 50% faster. 2x combo score bonus.',
        unlockCondition: 'Reach 30x combo',
        effects: [
            { type: 'combo_decay_mult', value: 0.5 },
            { type: 'score_mult', value: 2.0 },
        ],
    },
    {
        id: 'swarm_mode',
        name: 'Swarm Mode',
        description: 'Enemies have less HP but move faster. 1.5x score.',
        unlockCondition: 'Kill 500 enemies total',
        effects: [
            { type: 'enemy_hp_mult', value: 0.6 },
            { type: 'enemy_speed_mult', value: 1.5 },
            { type: 'score_mult', value: 1.5 },
        ],
    },
];
export class RunModifierSystem {
    constructor() {
        this.activeModifiers = [];
    }
    /** Activate modifiers for this run */
    setModifiers(ids) {
        this.activeModifiers = ids
            .map(id => RUN_MODIFIERS.find(m => m.id === id))
            .filter((m) => m !== undefined);
    }
    getScoreMult() {
        let mult = 1;
        for (const mod of this.activeModifiers) {
            for (const e of mod.effects) {
                if (e.type === 'score_mult')
                    mult *= e.value;
            }
        }
        return mult;
    }
    getEnemyHpMult() {
        let mult = 1;
        for (const mod of this.activeModifiers) {
            for (const e of mod.effects) {
                if (e.type === 'enemy_hp_mult')
                    mult *= e.value;
            }
        }
        return mult;
    }
    getEnemySpeedMult() {
        let mult = 1;
        for (const mod of this.activeModifiers) {
            for (const e of mod.effects) {
                if (e.type === 'enemy_speed_mult')
                    mult *= e.value;
            }
        }
        return mult;
    }
    getCurrencyMult() {
        let mult = 1;
        for (const mod of this.activeModifiers) {
            for (const e of mod.effects) {
                if (e.type === 'currency_mult')
                    mult *= e.value;
            }
        }
        return mult;
    }
    getComboDecayMult() {
        let mult = 1;
        for (const mod of this.activeModifiers) {
            for (const e of mod.effects) {
                if (e.type === 'combo_decay_mult')
                    mult *= e.value;
            }
        }
        return mult;
    }
    isOneHit() {
        return this.activeModifiers.some(m => m.effects.some(e => e.type === 'one_hit'));
    }
    hasNoShops() {
        return this.activeModifiers.some(m => m.effects.some(e => e.type === 'no_shops'));
    }
    hasNoRecovery() {
        return this.activeModifiers.some(m => m.effects.some(e => e.type === 'no_recovery'));
    }
    get active() {
        return this.activeModifiers;
    }
    reset() {
        this.activeModifiers = [];
    }
}
