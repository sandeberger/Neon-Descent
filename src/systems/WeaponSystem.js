import { FIXED_DT, WEAPON_HEAT_PER_SHOT, WEAPON_OVERHEAT_PENALTY, WEAPON_COOL_RATE, } from '@core/Constants';
import weaponsData from '@data/weapons.json';
export const WEAPONS = weaponsData;
export class WeaponSystem {
    constructor(projPool, events, vfx, upgrades) {
        this.projPool = projPool;
        this.events = events;
        this.vfx = vfx;
        this.upgrades = upgrades;
        this.fireCooldown = 0;
        this.heat = 0; // 0–1, exposed for HUD
        this.overheated = false; // locked out when true
        // Drone support state
        this.drones = [];
        this.droneOrbitRadius = 40;
    }
    update(input, player, enemies) {
        if (player.state === 'DEAD')
            return;
        this.fireCooldown -= FIXED_DT;
        // Cool down heat
        if (!input.fire || this.overheated) {
            this.heat -= WEAPON_COOL_RATE * FIXED_DT;
            if (this.heat <= 0) {
                this.heat = 0;
                this.overheated = false;
            }
        }
        const weapon = WEAPONS[player.currentWeaponId] ?? WEAPONS['balanced_auto'];
        // Update drones if weapon is drone_support
        if (weapon.droneCount && weapon.droneCount > 0) {
            this.updateDrones(player, enemies, weapon);
        }
        // Can't fire while overheated
        if (input.fire && this.fireCooldown <= 0 && !this.overheated) {
            // Apply upgrade bonuses
            const fireRateBonus = this.upgrades.getEffect('fire_rate_bonus');
            const damageBonus = this.upgrades.getEffect('damage_bonus');
            const projBonus = Math.floor(this.upgrades.getEffect('projectiles_bonus'));
            const isPiercing = weapon.piercing || this.upgrades.hasEffect('piercing');
            const recoilBonus = this.upgrades.getEffect('recoil_bonus');
            this.fireCooldown = 1 / (weapon.fireRate * (1 + fireRateBonus));
            const totalProjectiles = weapon.projectilesPerShot + projBonus;
            for (let i = 0; i < totalProjectiles; i++) {
                const proj = this.projPool.acquire();
                const spreadRad = ((Math.random() - 0.5) * weapon.spread) * (Math.PI / 180);
                let baseAngle = Math.PI / 2; // straight down
                // Aim assist: angle toward target enemy
                if (input.aimTarget !== null) {
                    const target = enemies.find(e => e.id === input.aimTarget);
                    if (target) {
                        baseAngle = Math.atan2(target.y - player.y, target.x - player.x);
                    }
                }
                proj.x = player.x;
                proj.y = player.y + player.hitbox.height / 2;
                proj.prevX = proj.x;
                proj.prevY = proj.y;
                proj.vx = Math.cos(baseAngle + spreadRad) * weapon.projectileSpeed;
                proj.vy = Math.sin(baseAngle + spreadRad) * weapon.projectileSpeed;
                proj.damage = weapon.damage + damageBonus;
                proj.active = true;
                proj.owner = 'player';
                proj.piercing = isPiercing;
                proj.color = weapon.color;
                proj.glowColor = weapon.glowColor;
                proj.life = weapon.lingering ? (weapon.lingerDuration ?? 2) : 2;
                proj.bouncesRemaining = weapon.bounceCount ?? 0;
                proj.projectileLength = weapon.projectileLength ?? 0;
            }
            // Recoil (with upgrade bonus)
            player.vy += weapon.recoilForce * (1 + recoilBonus);
            // Heat accumulation
            this.heat += WEAPON_HEAT_PER_SHOT;
            if (this.heat >= 1.0) {
                this.heat = 1.0;
                this.overheated = true;
                this.fireCooldown = WEAPON_OVERHEAT_PENALTY;
            }
            // VFX
            this.vfx.emit('muzzle_flash', player.x, player.y + player.hitbox.height / 2);
            this.events.emit('weapon:fire', { weaponId: weapon.id, x: player.x, y: player.y });
        }
    }
    /**
     * Chain Shock: when a chain_shock projectile kills an enemy,
     * call this to chain damage to nearby enemies.
     */
    chainShock(x, y, _damage, enemies) {
        const weapon = WEAPONS['chain_shock'];
        if (!weapon)
            return [];
        const radius = weapon.chainRadius ?? 80;
        const maxChains = weapon.chainCount ?? 3;
        const hit = [];
        // Find nearby enemies sorted by distance
        const nearby = enemies
            .filter(e => e.active && Math.hypot(e.x - x, e.y - y) < radius)
            .sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y));
        for (let i = 0; i < Math.min(maxChains, nearby.length); i++) {
            const target = nearby[i];
            hit.push(target);
            // VFX: lightning arc
            this.vfx.emit('chain_shock', target.x, target.y);
        }
        if (hit.length > 0) {
            this.events.emit('chain:hit', { x, y, targets: hit.length });
        }
        return hit;
    }
    updateDrones(player, enemies, weapon) {
        const count = weapon.droneCount ?? 2;
        // Initialize drones if needed
        while (this.drones.length < count) {
            this.drones.push({
                x: player.x,
                y: player.y,
                angle: (this.drones.length / count) * Math.PI * 2,
                fireTimer: 0.3 + Math.random() * 0.5,
            });
        }
        // Update drone positions (orbit around player)
        for (let i = 0; i < this.drones.length; i++) {
            const drone = this.drones[i];
            drone.angle += FIXED_DT * 3;
            drone.x = player.x + Math.cos(drone.angle) * this.droneOrbitRadius;
            drone.y = player.y + Math.sin(drone.angle) * this.droneOrbitRadius;
            // Auto-fire at nearest enemy
            drone.fireTimer -= FIXED_DT;
            if (drone.fireTimer <= 0) {
                drone.fireTimer = 0.4; // Drone fire rate
                // Find nearest enemy
                let nearest = null;
                let bestDist = 200; // Max targeting range
                for (const e of enemies) {
                    if (!e.active)
                        continue;
                    const d = Math.hypot(e.x - drone.x, e.y - drone.y);
                    if (d < bestDist) {
                        bestDist = d;
                        nearest = e;
                    }
                }
                if (nearest) {
                    const proj = this.projPool.acquire();
                    const angle = Math.atan2(nearest.y - drone.y, nearest.x - drone.x);
                    proj.x = drone.x;
                    proj.y = drone.y;
                    proj.prevX = drone.x;
                    proj.prevY = drone.y;
                    proj.vx = Math.cos(angle) * 500;
                    proj.vy = Math.sin(angle) * 500;
                    proj.damage = weapon.damage;
                    proj.active = true;
                    proj.owner = 'player';
                    proj.piercing = false;
                    proj.color = weapon.color;
                    proj.glowColor = weapon.glowColor;
                    proj.life = 1.5;
                    proj.bouncesRemaining = 0;
                    proj.projectileLength = 0;
                }
            }
        }
    }
    getDrones() {
        return this.drones;
    }
    reset() {
        this.fireCooldown = 0;
        this.heat = 0;
        this.overheated = false;
        this.drones.length = 0;
    }
}
