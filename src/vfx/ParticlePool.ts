import { MAX_PARTICLES } from '@core/Constants';

export interface Particle {
  active:   boolean;
  x:        number;
  y:        number;
  vx:       number;
  vy:       number;
  life:     number;
  maxLife:  number;
  size:     number;
  color:    string;
  alpha:    number;
  gravity:  number;
  friction: number;
}

export interface ParticlePreset {
  count:       number;
  spawnRadius: number;
  vxRange:     [number, number];
  vyRange:     [number, number];
  life:        number;
  lifeVariance: number;
  size:        number;
  colors:      string[];
  gravity:     number;
  friction:    number;
}

export class ParticlePool {
  readonly particles: Particle[];
  private head = 0;

  constructor() {
    this.particles = [];
    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.particles.push({
        active: false, x: 0, y: 0, vx: 0, vy: 0,
        life: 0, maxLife: 0, size: 0, color: '', alpha: 0,
        gravity: 0, friction: 1,
      });
    }
  }

  emit(preset: ParticlePreset, x: number, y: number): void {
    for (let i = 0; i < preset.count; i++) {
      const p = this.particles[this.head]!;
      this.head = (this.head + 1) % MAX_PARTICLES;

      p.active   = true;
      p.x        = x + (Math.random() - 0.5) * preset.spawnRadius;
      p.y        = y + (Math.random() - 0.5) * preset.spawnRadius;
      p.vx       = preset.vxRange[0] + Math.random() * (preset.vxRange[1] - preset.vxRange[0]);
      p.vy       = preset.vyRange[0] + Math.random() * (preset.vyRange[1] - preset.vyRange[0]);
      p.life     = preset.life + (Math.random() - 0.5) * preset.lifeVariance;
      p.maxLife  = p.life;
      p.size     = preset.size;
      p.color    = preset.colors[Math.floor(Math.random() * preset.colors.length)]!;
      p.alpha    = 1;
      p.gravity  = preset.gravity;
      p.friction = preset.friction;
    }
  }

  update(dt: number): void {
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p = this.particles[i]!;
      if (!p.active) continue;

      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }

      p.vy += p.gravity * dt;
      p.vx *= p.friction;
      p.vy *= p.friction;
      p.x  += p.vx * dt;
      p.y  += p.vy * dt;
      p.alpha = p.life / p.maxLife;
    }
  }
}

// Presets
export const VFX_PRESETS: Record<string, ParticlePreset> = {
  enemy_death: {
    count: 12, spawnRadius: 8,
    vxRange: [-200, 200], vyRange: [-300, 100],
    life: 0.4, lifeVariance: 0.15, size: 4,
    colors: ['#ff4466', '#ff6644', '#ffaa22'],
    gravity: 400, friction: 0.95,
  },
  stomp_impact: {
    count: 20, spawnRadius: 4,
    vxRange: [-300, 300], vyRange: [-50, 50],
    life: 0.3, lifeVariance: 0.1, size: 3,
    colors: ['#44ffff', '#88ffff', '#ffffff'],
    gravity: 0, friction: 0.9,
  },
  muzzle_flash: {
    count: 6, spawnRadius: 2,
    vxRange: [-50, 50], vyRange: [100, 300],
    life: 0.15, lifeVariance: 0.05, size: 3,
    colors: ['#ffff44', '#ffaa22', '#ffffff'],
    gravity: 0, friction: 0.85,
  },
  dash_trail: {
    count: 8, spawnRadius: 6,
    vxRange: [-30, 30], vyRange: [-30, 30],
    life: 0.25, lifeVariance: 0.1, size: 3,
    colors: ['#44aaff', '#88ccff', '#ffffff'],
    gravity: 0, friction: 0.92,
  },
  wall_sparks: {
    count: 5, spawnRadius: 4,
    vxRange: [-100, 100], vyRange: [-150, -30],
    life: 0.2, lifeVariance: 0.08, size: 2,
    colors: ['#ffcc44', '#ff8822', '#ffeeaa'],
    gravity: 300, friction: 0.9,
  },
  player_death: {
    count: 30, spawnRadius: 6,
    vxRange: [-250, 250], vyRange: [-350, 150],
    life: 0.6, lifeVariance: 0.2, size: 5,
    colors: ['#ff2244', '#ff4466', '#ff6688', '#ffffff'],
    gravity: 200, friction: 0.93,
  },
  pickup_collect: {
    count: 8, spawnRadius: 4,
    vxRange: [-80, 80], vyRange: [-120, -20],
    life: 0.3, lifeVariance: 0.1, size: 3,
    colors: ['#44ff88', '#88ffaa', '#ffffff'],
    gravity: 0, friction: 0.88,
  },
  boss_phase_shift: {
    count: 25, spawnRadius: 10,
    vxRange: [-200, 200], vyRange: [-200, 200],
    life: 0.5, lifeVariance: 0.15, size: 4,
    colors: ['#ff44cc', '#ff88ee', '#ffffff'],
    gravity: 0, friction: 0.92,
  },
  boss_death: {
    count: 50, spawnRadius: 12,
    vxRange: [-350, 350], vyRange: [-400, 200],
    life: 0.8, lifeVariance: 0.3, size: 6,
    colors: ['#ff44cc', '#ff2266', '#ffaa22', '#44ffff', '#ffffff'],
    gravity: 150, friction: 0.94,
  },
  emp_blast: {
    count: 30, spawnRadius: 20,
    vxRange: [-300, 300], vyRange: [-300, 300],
    life: 0.35, lifeVariance: 0.12, size: 4,
    colors: ['#44ffff', '#88ffff', '#ffffff'],
    gravity: 0, friction: 0.88,
  },
  near_miss: {
    count: 4, spawnRadius: 3,
    vxRange: [-60, 60], vyRange: [-60, 60],
    life: 0.2, lifeVariance: 0.05, size: 2,
    colors: ['#ffffff', '#ffff44', '#ffaa22'],
    gravity: 0, friction: 0.9,
  },
  chain_shock: {
    count: 8, spawnRadius: 6,
    vxRange: [-100, 100], vyRange: [-100, 100],
    life: 0.25, lifeVariance: 0.08, size: 3,
    colors: ['#44ddff', '#88eeff', '#ffffff'],
    gravity: 0, friction: 0.85,
  },
  acid_linger: {
    count: 6, spawnRadius: 10,
    vxRange: [-20, 20], vyRange: [-30, 10],
    life: 0.5, lifeVariance: 0.15, size: 3,
    colors: ['#88ff22', '#44cc00', '#aaff44'],
    gravity: 50, friction: 0.95,
  },
  explosion: {
    count: 20, spawnRadius: 8,
    vxRange: [-250, 250], vyRange: [-250, 250],
    life: 0.4, lifeVariance: 0.12, size: 5,
    colors: ['#ff6622', '#ff4400', '#ffaa22', '#ffffff'],
    gravity: 200, friction: 0.92,
  },
  drill_debris: {
    count: 15, spawnRadius: 10,
    vxRange: [-200, 200], vyRange: [-100, 200],
    life: 0.5, lifeVariance: 0.15, size: 4,
    colors: ['#ff8844', '#dd6622', '#886633'],
    gravity: 400, friction: 0.93,
  },
};
