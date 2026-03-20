import { EnemyBase } from './EnemyBase';
import { getEnemyStats } from '@data/enemyStats';
import type { PendingSpawn } from './CoreCarrier';

/**
 * Bloom Heart — The first real boss.
 * 4 phases based on HP ratio, multi-attack patterns, spawns parasites.
 *
 * Phase 1 (>75%): 4-way cardinal shots, slow drift
 * Phase 2 (>50%): 12-shot spiral + horizontal charge + shockwave ring
 * Phase 3 (>25%): Aimed triple-burst + spawns parasite_clouds
 * Phase 4 (<=25%): All attacks faster, downward fan rain, vulnerable windows
 */
export class BloomHeart extends EnemyBase {
  role = 'boss' as const;

  pendingSpawns: PendingSpawn[] = [];

  private phase = 1;
  private prevPhase = 1;
  private angle = 0;
  private fireTimer = 0;
  private moveTimer = 0;
  private chargeVx = 0;
  private charging = false;
  private chargeTimer = 0;
  private spawnTimer = 0;
  private bossTimer = 0;

  private driftDir = 1;

  // Visual state
  private pulsePhase = 0;
  private vulnerableTimer = 0;

  onUpdate(dt: number, playerX: number, _playerY: number): void {
    this.pulsePhase += dt * 4;
    this.angle += dt * 0.6;
    this.bossTimer += dt;

    // Determine phase from HP ratio
    const hpRatio = this.hp / this.maxHp;
    if (hpRatio > 0.75) this.phase = 1;
    else if (hpRatio > 0.50) this.phase = 2;
    else if (hpRatio > 0.25) this.phase = 3;
    else this.phase = 4;

    // Phase transition tracking
    if (this.phase !== this.prevPhase) {
      this.prevPhase = this.phase;
      // Brief vulnerability window on phase change
      this.vulnerableTimer = 0.5;
    }

    if (this.vulnerableTimer > 0) {
      this.vulnerableTimer -= dt;
      return; // Pause attacks during phase transition
    }

    if (this.charging) {
      this.updateCharge(dt);
      return;
    }

    // Drift toward player
    const targetDrift = playerX > this.x ? 1 : -1;
    this.driftDir = targetDrift;
    const speed = this.getDriftSpeed();
    this.x += this.driftDir * speed * dt;

    // Clamp
    if (this.x < 50) this.x = 50;
    if (this.x > 310) this.x = 310;

    // Fire logic
    this.fireTimer -= dt;
    if (this.fireTimer <= 0) {
      this.fire(playerX);
      this.fireTimer = this.getFireInterval();
    }

    // Charge logic (phase 2+)
    if (this.phase >= 2) {
      this.moveTimer -= dt;
      if (this.moveTimer <= 0) {
        this.startCharge(playerX);
        this.moveTimer = this.phase >= 4 ? 2.0 : this.phase === 3 ? 3.0 : 4.0;
      }
    }

    // Spawn parasites (phase 3+)
    if (this.phase >= 3) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawnTimer = 6;
        this.pendingSpawns.push(
          { id: 'parasite_cloud', x: this.x - 30, y: this.y + 30 },
          { id: 'parasite_cloud', x: this.x + 30, y: this.y + 30 },
        );
      }
    }
  }

  private getDriftSpeed(): number {
    switch (this.phase) {
      case 1: return 40;
      case 2: return 60;
      case 3: return 80;
      case 4: return 100;
      default: return 40;
    }
  }

  private getFireInterval(): number {
    switch (this.phase) {
      case 1: return 2.0;
      case 2: return 1.5;
      case 3: return 1.0;
      case 4: return 0.7;
      default: return 2.0;
    }
  }

  private fire(playerX: number): void {
    const speedMod = this.phase === 4 ? 1.4 : 1.0;

    switch (this.phase) {
      case 1: {
        // 4-way cardinal shots
        const bulletSpeed = 120 * speedMod;
        for (let i = 0; i < 4; i++) {
          const a = (i * Math.PI * 2) / 4;
          this.pendingShots.push({
            x: this.x, y: this.y,
            vx: Math.cos(a) * bulletSpeed,
            vy: Math.sin(a) * bulletSpeed,
            damage: this.damage,
          });
        }
        break;
      }
      case 2: {
        // 12-shot spiral
        const bulletSpeed = 100 * speedMod;
        for (let i = 0; i < 12; i++) {
          const a = this.angle + (i * Math.PI * 2) / 12;
          this.pendingShots.push({
            x: this.x, y: this.y,
            vx: Math.cos(a) * bulletSpeed,
            vy: Math.sin(a) * bulletSpeed,
            damage: this.damage,
          });
        }
        break;
      }
      case 3: {
        // Aimed triple-burst
        const dx = playerX - this.x;
        const baseAngle = Math.atan2(60, dx);
        const bulletSpeed = 140 * speedMod;
        for (let i = -1; i <= 1; i++) {
          const a = baseAngle + i * 0.25;
          this.pendingShots.push({
            x: this.x, y: this.y + 20,
            vx: Math.cos(a) * bulletSpeed * Math.sign(dx),
            vy: Math.sin(a) * bulletSpeed,
            damage: this.damage,
          });
        }
        break;
      }
      case 4: {
        // Downward fan rain + aimed burst
        const bulletSpeed = 130 * speedMod;
        // Fan
        for (let i = 0; i < 7; i++) {
          const a = Math.PI / 2 + (i - 3) * 0.2; // centered downward
          this.pendingShots.push({
            x: this.x, y: this.y + 20,
            vx: Math.cos(a) * bulletSpeed,
            vy: Math.sin(a) * bulletSpeed,
            damage: this.damage,
          });
        }
        break;
      }
    }
  }

  private startCharge(playerX: number): void {
    this.charging = true;
    this.chargeTimer = 0.35;
    const dir = playerX > this.x ? 1 : -1;
    this.chargeVx = dir * (this.phase >= 4 ? 450 : this.phase === 3 ? 350 : 280);
  }

  private updateCharge(dt: number): void {
    this.x += this.chargeVx * dt;
    this.chargeTimer -= dt;

    if (this.x < 40) { this.x = 40; this.chargeVx = -this.chargeVx * 0.5; }
    if (this.x > 320) { this.x = 320; this.chargeVx = -this.chargeVx * 0.5; }

    if (this.chargeTimer <= 0) {
      this.charging = false;
      this.chargeVx = 0;

      // Shockwave ring on charge end (phase 2+)
      if (this.phase >= 2) {
        const ringCount = this.phase >= 4 ? 12 : 8;
        for (let i = 0; i < ringCount; i++) {
          const a = (i * Math.PI * 2) / ringCount;
          this.pendingShots.push({
            x: this.x, y: this.y,
            vx: Math.cos(a) * 110,
            vy: Math.sin(a) * 110,
            damage: 1,
          });
        }
      }
    }
  }

  reset(x: number, y: number): void {
    const stats = getEnemyStats('bloom_heart');
    this.resetBase(x, y, stats.hp);
    this.applyStats(stats);
    this.phase = 1;
    this.prevPhase = 1;
    this.angle = 0;
    this.fireTimer = 2.0; // grace period
    this.moveTimer = 4.0;
    this.spawnTimer = 6.0;
    this.bossTimer = 0;
    this.charging = false;
    this.chargeTimer = 0;
    this.chargeVx = 0;
    this.driftDir = 1;
    this.pulsePhase = 0;
    this.vulnerableTimer = 0;
    this.pendingSpawns.length = 0;
    this.pendingShots.length = 0;
  }

  renderExtra(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, rx: number, ry: number): void {
    const hw = this.hitbox.width / 2;
    const hh = this.hitbox.height / 2;

    // Phase-colored pulsing core
    const pulse = 0.5 + Math.sin(this.pulsePhase * 2) * 0.3;
    const coreColor = this.phase === 4 ? '#ff0044' :
                      this.phase === 3 ? '#ff2266' :
                      this.phase === 2 ? '#ff44aa' : '#ff44cc';
    ctx.fillStyle = coreColor;
    ctx.globalAlpha = pulse;
    ctx.fillRect(rx - 8, ry - 8, 16, 16);
    ctx.globalAlpha = 1;

    // Rotating petal arms (count scales per phase)
    const petalCount = 4 + this.phase * 2;
    ctx.strokeStyle = coreColor;
    ctx.lineWidth = 2;
    for (let i = 0; i < petalCount; i++) {
      const a = this.angle + (i * Math.PI * 2) / petalCount;
      const len = hw + 6;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx + Math.cos(a) * len, ry + Math.sin(a) * len);
      ctx.stroke();
    }

    // Charge trail
    if (this.charging) {
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.5;
      const trailW = Math.abs(this.chargeVx) * 0.04;
      ctx.fillRect(rx - hw - trailW, ry - 4, trailW, 8);
      ctx.fillRect(rx + hw, ry - 4, trailW, 8);
      ctx.globalAlpha = 1;
    }

    // Vulnerability flash
    if (this.vulnerableTimer > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.3 + Math.sin(this.vulnerableTimer * 20) * 0.3;
      ctx.fillRect(rx - hw - 4, ry - hh - 4, this.hitbox.width + 8, this.hitbox.height + 8);
      ctx.globalAlpha = 1;
    }

    // HP bar (70px wide with phase markers)
    const barW = 70;
    const barH = 5;
    const barX = rx - barW / 2;
    const barY = ry - hh - 14;

    // Background
    ctx.fillStyle = '#110011';
    ctx.fillRect(barX, barY, barW, barH);

    // HP fill
    const hpRatio = Math.max(0, this.hp / this.maxHp);
    ctx.fillStyle = coreColor;
    ctx.fillRect(barX, barY, barW * hpRatio, barH);

    // Phase markers at 75%, 50%, 25%
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.5;
    for (const mark of [0.75, 0.5, 0.25]) {
      ctx.fillRect(barX + barW * mark - 0.5, barY, 1, barH);
    }
    ctx.globalAlpha = 1;

    // Border
    ctx.strokeStyle = '#ff66cc';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);

    // Boss name
    ctx.fillStyle = coreColor;
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.globalAlpha = 0.7;
    ctx.fillText('BLOOM HEART', rx, barY - 4);
    ctx.globalAlpha = 1;
  }
}
