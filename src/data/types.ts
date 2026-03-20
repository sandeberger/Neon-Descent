/** Data schema types for JSON-driven game content */

export interface BalanceData {
  physics: {
    gravity: number;
    terminalVelocity: number;
    moveAccel: number;
    moveDecel: number;
    maxMoveSpeed: number;
    airSteer: number;
  };
  stomp: {
    speed: number;
    bounce: number;
    startupMs: number;
  };
  dash: {
    speed: number;
    durationMs: number;
    cooldownMs: number;
    invulnMs: number;
    maxAirDashes: number;
  };
  weapon: {
    heatPerShot: number;
    overheatPenalty: number;
    coolRate: number;
  };
  wallSlide: {
    speed: number;
    jumpVx: number;
    jumpVy: number;
  };
  combo: {
    decayTime: number;
    tierThresholds: number[];
    tierMultipliers: number[];
  };
  scroll: {
    baseSpeed: number;
    maxSpeed: number;
  };
  player: {
    baseHp: number;
    invulnDuration: number;
    width: number;
    height: number;
  };
  pickup: {
    magnetRange: number;
  };
  coyoteTimeMs: number;
}

export interface WeaponDefData {
  id: string;
  name: string;
  fireRate: number;
  damage: number;
  projectileSpeed: number;
  spread: number;
  recoilForce: number;
  projectilesPerShot: number;
  piercing: boolean;
  color: string;
  glowColor: string;
  bounceCount?: number;
  projectileLength?: number;
  chainRadius?: number;
  chainCount?: number;
  lingering?: boolean;
  lingerDuration?: number;
  droneCount?: number;
}

export interface UpgradeEffectData {
  type: string;
  value: number;
}

export interface RunUpgradeData {
  id: string;
  name: string;
  description: string;
  category: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  effects: UpgradeEffectData[];
  maxStacks: number;
  icon: string;
}

export interface MetaUpgradeData {
  id: string;
  name: string;
  description: string;
  maxLevel: number;
  costs: number[];
  effect: string;
  values: number[];
}

export interface BiomePaletteData {
  background: string;
  backgroundLine1: string;
  backgroundLine2: string;
  tile: string;
  tileAccent: string;
  platform: string;
  hazard: string;
  bounce: string;
  breakable: string;
}

export interface BiomeData {
  id: string;
  minDepth: number;
  maxDepth: number;
  palette: BiomePaletteData;
}

export interface EnemyStatData {
  id: string;
  hp: number;
  damage: number;
  scoreValue: number;
  comboValue: number;
  bodyColor: string;
  glowColor: string;
  hitboxWidth: number;
  hitboxHeight: number;
}
