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
        // Can't fire while overheated
        if (input.fire && this.fireCooldown <= 0 && !this.overheated) {
            const weapon = WEAPONS[player.currentWeaponId] ?? WEAPONS['balanced_auto'];
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
                proj.life = 2;
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
    reset() {
        this.fireCooldown = 0;
        this.heat = 0;
        this.overheated = false;
    }
}
