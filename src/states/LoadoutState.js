import { CANVAS_W, CANVAS_H } from '@core/Constants';
import weaponsData from '@data/weapons.json';
const WEAPON_DEFS = [
    { id: 'balanced_auto', name: 'Pulse Rifle', color: weaponsData.balanced_auto.color, glowColor: weaponsData.balanced_auto.glowColor, unlockRuns: 0 },
    { id: 'shotgun_burst', name: 'Scatter Cannon', color: weaponsData.shotgun_burst.color, glowColor: weaponsData.shotgun_burst.glowColor, unlockRuns: 3 },
    { id: 'beam_cutter', name: 'Beam Cutter', color: weaponsData.beam_cutter.color, glowColor: weaponsData.beam_cutter.glowColor, unlockRuns: 5 },
    { id: 'ricochet', name: 'Ricochet', color: weaponsData.ricochet.color, glowColor: weaponsData.ricochet.glowColor, unlockRuns: 8 },
    { id: 'chain_shock', name: 'Chain Shock', color: weaponsData.chain_shock.color, glowColor: weaponsData.chain_shock.glowColor, unlockRuns: 12 },
    { id: 'acid_scatter', name: 'Acid Scatter', color: weaponsData.acid_scatter.color, glowColor: weaponsData.acid_scatter.glowColor, unlockRuns: 15 },
    { id: 'drone_support', name: 'Drone Support', color: weaponsData.drone_support.color, glowColor: weaponsData.drone_support.glowColor, unlockRuns: 20 },
];
const ALL_PERKS = [
    { id: 'rapid_fire', name: 'RAPID FIRE', description: '+20% fire rate', color: '#ff6644' },
    { id: 'stomp_force', name: 'STOMP FORCE', description: '+1 stomp damage', color: '#ff44aa' },
    { id: 'swift_boots', name: 'SWIFT BOOTS', description: '+15% move speed', color: '#44ffcc' },
    { id: 'combo_sustain', name: 'COMBO SUSTAIN', description: '+30% combo decay', color: '#ffcc44' },
    { id: 'magnet_pull', name: 'MAGNET PULL', description: '+50% pickup range', color: '#aa88ff' },
];
/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */
function shuffleArray(arr) {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
}
function hexToRgb(hex) {
    const v = parseInt(hex.replace('#', ''), 16);
    return { r: (v >> 16) & 0xff, g: (v >> 8) & 0xff, b: v & 0xff };
}
/* ------------------------------------------------------------------ */
/*  LoadoutState                                                      */
/* ------------------------------------------------------------------ */
export class LoadoutState {
    constructor(game) {
        this.game = game;
        this.name = 'LOADOUT';
        /* selection state */
        this.selectedWeaponIndex = 0;
        this.selectedPerkIndex = -1; // -1 = none
        this.availablePerks = [];
        /* visual */
        this.pulsePhase = 0;
        this.scrollOffset = 0; // horizontal weapon scroll
        this.targetScrollOffset = 0;
        /* layout constants */
        this.CARD_W = 88;
        this.CARD_H = 100;
        this.CARD_GAP = 10;
        this.WEAPON_ROW_Y = 130;
        this.PERK_ROW_Y = 380;
        this.PERK_CARD_W = 100;
        this.PERK_CARD_H = 80;
        this.PERK_GAP = 10;
        this.START_BTN_Y = 560;
        /* input bookkeeping */
        this._cleanupTouch = null;
        this._cleanupKey = null;
    }
    /* ================================================================ */
    /*  Lifecycle                                                       */
    /* ================================================================ */
    onEnter(_prev) {
        this.pulsePhase = 0;
        /* Default to first unlocked weapon */
        this.selectedWeaponIndex = 0;
        this.selectedPerkIndex = -1;
        /* Pick 3 random perks */
        this.availablePerks = shuffleArray(ALL_PERKS).slice(0, 3);
        /* Reset scroll */
        this.scrollOffset = 0;
        this.targetScrollOffset = 0;
        this.ensureScrollVisible();
        /* --- Touch / mouse input ---------------------------------------- */
        const handleTouch = (e) => {
            e.preventDefault();
            this.game.audio.unlock();
            const touch = e instanceof TouchEvent
                ? e.touches[0] || e.changedTouches[0]
                : e;
            if (!touch)
                return;
            const rect = this.game.canvas.getBoundingClientRect();
            const scale = this.game.canvasScale;
            const x = (touch.clientX - rect.left) / scale;
            const y = (touch.clientY - rect.top) / scale;
            /* Weapon cards */
            if (y >= this.WEAPON_ROW_Y - 10 && y <= this.WEAPON_ROW_Y + this.CARD_H + 30) {
                this.handleWeaponTap(x);
                return;
            }
            /* Perk cards */
            if (y >= this.PERK_ROW_Y - 10 && y <= this.PERK_ROW_Y + this.PERK_CARD_H + 10) {
                this.handlePerkTap(x);
                return;
            }
            /* START RUN button */
            if (y >= this.START_BTN_Y - 22 && y <= this.START_BTN_Y + 22) {
                this.tryStart();
                return;
            }
        };
        /* --- Keyboard input --------------------------------------------- */
        const handleKey = (e) => {
            if (e.code === 'ArrowLeft') {
                this.moveWeaponSelection(-1);
            }
            else if (e.code === 'ArrowRight') {
                this.moveWeaponSelection(1);
            }
            else if (e.code === 'Digit1' || e.code === 'Numpad1') {
                this.selectPerk(0);
            }
            else if (e.code === 'Digit2' || e.code === 'Numpad2') {
                this.selectPerk(1);
            }
            else if (e.code === 'Digit3' || e.code === 'Numpad3') {
                this.selectPerk(2);
            }
            else if (e.code === 'Enter' || e.code === 'Space') {
                this.tryStart();
            }
            else if (e.code === 'Escape') {
                this.game.states.transition('MENU');
            }
        };
        this.game.canvas.addEventListener('touchstart', handleTouch, { passive: false });
        this.game.canvas.addEventListener('mousedown', handleTouch);
        window.addEventListener('keydown', handleKey);
        this._cleanupTouch = handleTouch;
        this._cleanupKey = handleKey;
    }
    onExit(_next) {
        if (this._cleanupTouch) {
            this.game.canvas.removeEventListener('touchstart', this._cleanupTouch);
            this.game.canvas.removeEventListener('mousedown', this._cleanupTouch);
        }
        if (this._cleanupKey) {
            window.removeEventListener('keydown', this._cleanupKey);
        }
    }
    /* ================================================================ */
    /*  Input helpers                                                   */
    /* ================================================================ */
    isWeaponUnlocked(idx) {
        const w = WEAPON_DEFS[idx];
        return w ? this.game.meta.totalRuns >= w.unlockRuns : false;
    }
    handleWeaponTap(tapX) {
        const totalW = WEAPON_DEFS.length * (this.CARD_W + this.CARD_GAP) - this.CARD_GAP;
        const startX = (CANVAS_W - totalW) / 2 + this.scrollOffset;
        for (let i = 0; i < WEAPON_DEFS.length; i++) {
            const cx = startX + i * (this.CARD_W + this.CARD_GAP);
            if (tapX >= cx && tapX <= cx + this.CARD_W) {
                if (this.isWeaponUnlocked(i)) {
                    this.selectedWeaponIndex = i;
                    this.game.audio.playMenuSelect();
                }
                return;
            }
        }
    }
    handlePerkTap(tapX) {
        const totalW = this.availablePerks.length * (this.PERK_CARD_W + this.PERK_GAP) - this.PERK_GAP;
        const startX = (CANVAS_W - totalW) / 2;
        for (let i = 0; i < this.availablePerks.length; i++) {
            const cx = startX + i * (this.PERK_CARD_W + this.PERK_GAP);
            if (tapX >= cx && tapX <= cx + this.PERK_CARD_W) {
                this.selectPerk(i);
                return;
            }
        }
    }
    selectPerk(idx) {
        if (idx >= 0 && idx < this.availablePerks.length) {
            // Toggle off if already selected
            this.selectedPerkIndex = this.selectedPerkIndex === idx ? -1 : idx;
            this.game.audio.playMenuSelect();
        }
    }
    moveWeaponSelection(dir) {
        let next = this.selectedWeaponIndex + dir;
        // Wrap
        if (next < 0)
            next = WEAPON_DEFS.length - 1;
        if (next >= WEAPON_DEFS.length)
            next = 0;
        // Skip locked weapons when navigating by keyboard
        const start = next;
        while (!this.isWeaponUnlocked(next)) {
            next += dir;
            if (next < 0)
                next = WEAPON_DEFS.length - 1;
            if (next >= WEAPON_DEFS.length)
                next = 0;
            if (next === start)
                break; // avoid infinite loop
        }
        if (this.isWeaponUnlocked(next)) {
            this.selectedWeaponIndex = next;
            this.game.audio.playMenuSelect();
            this.ensureScrollVisible();
        }
    }
    ensureScrollVisible() {
        const totalW = WEAPON_DEFS.length * (this.CARD_W + this.CARD_GAP) - this.CARD_GAP;
        const startX = (CANVAS_W - totalW) / 2;
        const cardLeft = startX + this.selectedWeaponIndex * (this.CARD_W + this.CARD_GAP);
        const cardRight = cardLeft + this.CARD_W;
        const margin = 20;
        if (cardLeft + this.targetScrollOffset < margin) {
            this.targetScrollOffset = margin - cardLeft;
        }
        else if (cardRight + this.targetScrollOffset > CANVAS_W - margin) {
            this.targetScrollOffset = (CANVAS_W - margin) - cardRight;
        }
    }
    tryStart() {
        if (!this.isWeaponUnlocked(this.selectedWeaponIndex))
            return;
        const weapon = WEAPON_DEFS[this.selectedWeaponIndex];
        const perk = this.selectedPerkIndex >= 0
            ? this.availablePerks[this.selectedPerkIndex] ?? null
            : null;
        // Store on Game so PlayingState can read them
        this.game.pendingLoadoutWeapon = weapon.id;
        this.game.pendingLoadoutPerk = perk ? perk.id : null;
        this.game.audio.playMenuSelect();
        this.game.states.transition('PLAYING');
    }
    /* ================================================================ */
    /*  Update                                                          */
    /* ================================================================ */
    fixedUpdate(dt) {
        this.pulsePhase += dt * 3;
        // Smooth scroll
        this.scrollOffset += (this.targetScrollOffset - this.scrollOffset) * Math.min(1, dt * 12);
    }
    /* ================================================================ */
    /*  Render                                                          */
    /* ================================================================ */
    render(_alpha) {
        const ctx = this.game.ctx;
        /* Background ---------------------------------------------------- */
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        // Animated scanlines
        ctx.strokeStyle = '#0e0e24';
        ctx.lineWidth = 1;
        for (let y = 0; y < CANVAS_H; y += 4) {
            const flicker = Math.sin(this.pulsePhase * 2 + y * 0.3) * 0.15;
            ctx.globalAlpha = 0.3 + flicker;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(CANVAS_W, y);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
        // Subtle vertical neon lines
        const lineAlpha = 0.04 + Math.sin(this.pulsePhase) * 0.02;
        ctx.strokeStyle = '#44ddff';
        ctx.globalAlpha = lineAlpha;
        ctx.lineWidth = 1;
        for (let x = 30; x < CANVAS_W; x += 60) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, CANVAS_H);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
        /* Title --------------------------------------------------------- */
        ctx.fillStyle = '#44ddff';
        ctx.font = 'bold 22px monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#44ddff';
        ctx.shadowBlur = 14;
        ctx.fillText('LOADOUT', CANVAS_W / 2, 40);
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#556677';
        ctx.font = '10px monospace';
        ctx.fillText('CHOOSE YOUR GEAR', CANVAS_W / 2, 58);
        /* Section: Weapons ---------------------------------------------- */
        ctx.fillStyle = '#667788';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('WEAPON', CANVAS_W / 2, this.WEAPON_ROW_Y - 18);
        this.renderWeaponCards(ctx);
        /* Horizontal scroll hint arrows --------------------------------- */
        const totalW = WEAPON_DEFS.length * (this.CARD_W + this.CARD_GAP) - this.CARD_GAP;
        if (totalW > CANVAS_W - 40) {
            const arrowAlpha = 0.3 + Math.sin(this.pulsePhase * 4) * 0.15;
            ctx.globalAlpha = arrowAlpha;
            ctx.fillStyle = '#44ddff';
            ctx.font = 'bold 18px monospace';
            ctx.textAlign = 'left';
            ctx.fillText('<', 4, this.WEAPON_ROW_Y + this.CARD_H / 2 + 6);
            ctx.textAlign = 'right';
            ctx.fillText('>', CANVAS_W - 4, this.WEAPON_ROW_Y + this.CARD_H / 2 + 6);
            ctx.globalAlpha = 1;
        }
        /* Selected weapon name below cards ------------------------------ */
        const selW = WEAPON_DEFS[this.selectedWeaponIndex];
        if (selW && this.isWeaponUnlocked(this.selectedWeaponIndex)) {
            ctx.fillStyle = selW.color;
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'center';
            ctx.shadowColor = selW.glowColor;
            ctx.shadowBlur = 8;
            ctx.fillText(selW.name.toUpperCase(), CANVAS_W / 2, this.WEAPON_ROW_Y + this.CARD_H + 28);
            ctx.shadowBlur = 0;
        }
        /* Divider ------------------------------------------------------- */
        const divY = this.PERK_ROW_Y - 45;
        ctx.strokeStyle = '#1a1a33';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(30, divY);
        ctx.lineTo(CANVAS_W - 30, divY);
        ctx.stroke();
        /* Section: Perks ------------------------------------------------ */
        ctx.fillStyle = '#667788';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('STARTING PERK (OPTIONAL)', CANVAS_W / 2, this.PERK_ROW_Y - 18);
        this.renderPerkCards(ctx);
        /* Number key hints ---------------------------------------------- */
        ctx.fillStyle = '#334455';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('PRESS 1 / 2 / 3 TO SELECT', CANVAS_W / 2, this.PERK_ROW_Y + this.PERK_CARD_H + 18);
        /* START RUN button ---------------------------------------------- */
        this.renderStartButton(ctx);
        /* Back hint ----------------------------------------------------- */
        ctx.fillStyle = '#334455';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('ESC TO GO BACK', CANVAS_W / 2, CANVAS_H - 14);
    }
    /* ================================================================ */
    /*  Weapon card rendering                                           */
    /* ================================================================ */
    renderWeaponCards(ctx) {
        const totalW = WEAPON_DEFS.length * (this.CARD_W + this.CARD_GAP) - this.CARD_GAP;
        const startX = (CANVAS_W - totalW) / 2 + this.scrollOffset;
        for (let i = 0; i < WEAPON_DEFS.length; i++) {
            const w = WEAPON_DEFS[i];
            const cx = startX + i * (this.CARD_W + this.CARD_GAP);
            const cy = this.WEAPON_ROW_Y;
            const unlocked = this.isWeaponUnlocked(i);
            const selected = i === this.selectedWeaponIndex && unlocked;
            // Card background
            if (selected) {
                const rgb = hexToRgb(w.color);
                const pulse = 0.12 + Math.sin(this.pulsePhase * 2.5) * 0.06;
                ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${pulse})`;
            }
            else {
                ctx.fillStyle = unlocked ? '#0f0f22' : '#08081a';
            }
            ctx.fillRect(cx, cy, this.CARD_W, this.CARD_H);
            // Card border
            if (selected) {
                ctx.strokeStyle = w.color;
                ctx.lineWidth = 2;
                ctx.shadowColor = w.glowColor;
                ctx.shadowBlur = 12;
                ctx.strokeRect(cx, cy, this.CARD_W, this.CARD_H);
                ctx.shadowBlur = 0;
            }
            else {
                ctx.strokeStyle = unlocked ? '#222244' : '#151530';
                ctx.lineWidth = 1;
                ctx.strokeRect(cx, cy, this.CARD_W, this.CARD_H);
            }
            if (unlocked) {
                // Weapon icon — stylised abstract shape
                this.renderWeaponIcon(ctx, w, cx + this.CARD_W / 2, cy + 36, selected);
                // Weapon name
                ctx.fillStyle = selected ? w.color : '#667788';
                ctx.font = selected ? 'bold 9px monospace' : '9px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(w.name.toUpperCase(), cx + this.CARD_W / 2, cy + this.CARD_H - 10);
            }
            else {
                // Locked: question marks
                ctx.fillStyle = '#222233';
                ctx.font = 'bold 22px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('???', cx + this.CARD_W / 2, cy + 44);
                // Unlock requirement
                ctx.fillStyle = '#333344';
                ctx.font = '8px monospace';
                ctx.fillText(`${w.unlockRuns} RUNS`, cx + this.CARD_W / 2, cy + this.CARD_H - 16);
                // Lock icon (small padlock)
                ctx.fillStyle = '#222233';
                ctx.fillRect(cx + this.CARD_W / 2 - 5, cy + this.CARD_H - 12, 10, 8);
                ctx.strokeStyle = '#222233';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(cx + this.CARD_W / 2, cy + this.CARD_H - 14, 5, Math.PI, 0);
                ctx.stroke();
            }
        }
    }
    renderWeaponIcon(ctx, w, cx, cy, selected) {
        const col = selected ? w.color : '#445566';
        const glow = selected ? w.glowColor : '';
        if (selected && glow) {
            ctx.shadowColor = glow;
            ctx.shadowBlur = 8;
        }
        ctx.strokeStyle = col;
        ctx.fillStyle = col;
        ctx.lineWidth = 2;
        switch (w.id) {
            case 'balanced_auto':
                // Simple horizontal line with dot = rifle barrel
                ctx.beginPath();
                ctx.moveTo(cx - 16, cy);
                ctx.lineTo(cx + 16, cy);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(cx + 18, cy, 3, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'shotgun_burst':
                // Spread lines fanning out
                for (let a = -2; a <= 2; a++) {
                    const angle = (a * 12) * Math.PI / 180;
                    ctx.beginPath();
                    ctx.moveTo(cx - 12, cy);
                    ctx.lineTo(cx + 12 + Math.cos(angle) * 8, cy + Math.sin(angle) * 8);
                    ctx.stroke();
                }
                break;
            case 'beam_cutter':
                // Long thin beam line with glow effect
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(cx - 20, cy);
                ctx.lineTo(cx + 20, cy);
                ctx.stroke();
                ctx.lineWidth = 1;
                ctx.globalAlpha = 0.4;
                ctx.beginPath();
                ctx.moveTo(cx - 20, cy - 3);
                ctx.lineTo(cx + 20, cy - 3);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(cx - 20, cy + 3);
                ctx.lineTo(cx + 20, cy + 3);
                ctx.stroke();
                ctx.globalAlpha = 1;
                break;
            case 'ricochet':
                // Zig-zag bouncing path
                ctx.beginPath();
                ctx.moveTo(cx - 16, cy - 8);
                ctx.lineTo(cx - 4, cy + 6);
                ctx.lineTo(cx + 8, cy - 6);
                ctx.lineTo(cx + 18, cy + 8);
                ctx.stroke();
                break;
            case 'chain_shock':
                // Lightning bolt
                ctx.beginPath();
                ctx.moveTo(cx - 6, cy - 12);
                ctx.lineTo(cx - 2, cy - 2);
                ctx.lineTo(cx + 4, cy - 2);
                ctx.lineTo(cx, cy + 12);
                ctx.stroke();
                ctx.lineWidth = 1;
                ctx.globalAlpha = 0.4;
                ctx.beginPath();
                ctx.moveTo(cx + 6, cy - 6);
                ctx.lineTo(cx + 14, cy + 2);
                ctx.stroke();
                ctx.globalAlpha = 1;
                break;
            case 'acid_scatter':
                // Scattered droplets
                for (const [dx, dy] of [[-8, -6], [6, -4], [-4, 6], [10, 4], [0, -2]]) {
                    ctx.beginPath();
                    ctx.arc(cx + dx, cy + dy, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
            case 'drone_support':
                // Two small diamond shapes (drones)
                for (const dx of [-10, 10]) {
                    ctx.beginPath();
                    ctx.moveTo(cx + dx, cy - 6);
                    ctx.lineTo(cx + dx + 6, cy);
                    ctx.lineTo(cx + dx, cy + 6);
                    ctx.lineTo(cx + dx - 6, cy);
                    ctx.closePath();
                    ctx.stroke();
                }
                break;
            default:
                ctx.beginPath();
                ctx.arc(cx, cy, 8, 0, Math.PI * 2);
                ctx.stroke();
        }
        ctx.shadowBlur = 0;
    }
    /* ================================================================ */
    /*  Perk card rendering                                             */
    /* ================================================================ */
    renderPerkCards(ctx) {
        const count = this.availablePerks.length;
        const totalW = count * (this.PERK_CARD_W + this.PERK_GAP) - this.PERK_GAP;
        const startX = (CANVAS_W - totalW) / 2;
        for (let i = 0; i < count; i++) {
            const perk = this.availablePerks[i];
            const cx = startX + i * (this.PERK_CARD_W + this.PERK_GAP);
            const cy = this.PERK_ROW_Y;
            const selected = i === this.selectedPerkIndex;
            // Card bg
            if (selected) {
                const rgb = hexToRgb(perk.color);
                const pulse = 0.1 + Math.sin(this.pulsePhase * 2.5) * 0.05;
                ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${pulse})`;
            }
            else {
                ctx.fillStyle = '#0f0f22';
            }
            ctx.fillRect(cx, cy, this.PERK_CARD_W, this.PERK_CARD_H);
            // Border
            if (selected) {
                ctx.strokeStyle = perk.color;
                ctx.lineWidth = 2;
                ctx.shadowColor = perk.color;
                ctx.shadowBlur = 10;
                ctx.strokeRect(cx, cy, this.PERK_CARD_W, this.PERK_CARD_H);
                ctx.shadowBlur = 0;
            }
            else {
                ctx.strokeStyle = '#222244';
                ctx.lineWidth = 1;
                ctx.strokeRect(cx, cy, this.PERK_CARD_W, this.PERK_CARD_H);
            }
            // Number key indicator
            ctx.fillStyle = selected ? perk.color : '#334455';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`[${i + 1}]`, cx + this.PERK_CARD_W / 2, cy + 16);
            // Perk name
            ctx.fillStyle = selected ? perk.color : '#778899';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(perk.name, cx + this.PERK_CARD_W / 2, cy + 36);
            // Description
            ctx.fillStyle = selected ? '#ccccdd' : '#556677';
            ctx.font = '9px monospace';
            ctx.fillText(perk.description, cx + this.PERK_CARD_W / 2, cy + 54);
            // Selection checkmark
            if (selected) {
                ctx.fillStyle = perk.color;
                ctx.font = 'bold 14px monospace';
                ctx.shadowColor = perk.color;
                ctx.shadowBlur = 6;
                ctx.fillText('\u2713', cx + this.PERK_CARD_W / 2, cy + this.PERK_CARD_H - 6);
                ctx.shadowBlur = 0;
            }
        }
    }
    /* ================================================================ */
    /*  Start button                                                    */
    /* ================================================================ */
    renderStartButton(ctx) {
        const canStart = this.isWeaponUnlocked(this.selectedWeaponIndex);
        const btnW = 200;
        const btnH = 40;
        const bx = (CANVAS_W - btnW) / 2;
        const by = this.START_BTN_Y - btnH / 2;
        if (canStart) {
            const pulse = 0.7 + Math.sin(this.pulsePhase * 2.5) * 0.3;
            // Button bg
            ctx.fillStyle = '#0c1a2a';
            ctx.fillRect(bx, by, btnW, btnH);
            // Glowing border
            ctx.strokeStyle = '#44ddff';
            ctx.lineWidth = 2;
            ctx.shadowColor = '#44ddff';
            ctx.shadowBlur = 12 * pulse;
            ctx.strokeRect(bx, by, btnW, btnH);
            ctx.shadowBlur = 0;
            // Corner accents
            const accLen = 8;
            ctx.strokeStyle = '#44ddff';
            ctx.lineWidth = 2;
            // Top-left
            ctx.beginPath();
            ctx.moveTo(bx, by + accLen);
            ctx.lineTo(bx, by);
            ctx.lineTo(bx + accLen, by);
            ctx.stroke();
            // Top-right
            ctx.beginPath();
            ctx.moveTo(bx + btnW - accLen, by);
            ctx.lineTo(bx + btnW, by);
            ctx.lineTo(bx + btnW, by + accLen);
            ctx.stroke();
            // Bottom-left
            ctx.beginPath();
            ctx.moveTo(bx, by + btnH - accLen);
            ctx.lineTo(bx, by + btnH);
            ctx.lineTo(bx + accLen, by + btnH);
            ctx.stroke();
            // Bottom-right
            ctx.beginPath();
            ctx.moveTo(bx + btnW - accLen, by + btnH);
            ctx.lineTo(bx + btnW, by + btnH);
            ctx.lineTo(bx + btnW, by + btnH - accLen);
            ctx.stroke();
            // Text
            ctx.globalAlpha = pulse;
            ctx.fillStyle = '#44ddff';
            ctx.font = 'bold 16px monospace';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#44ddff';
            ctx.shadowBlur = 10;
            ctx.fillText('START RUN', CANVAS_W / 2, this.START_BTN_Y + 5);
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
            // Subtitle showing selected loadout
            const wName = WEAPON_DEFS[this.selectedWeaponIndex]?.name ?? '';
            const pName = this.selectedPerkIndex >= 0
                ? this.availablePerks[this.selectedPerkIndex]?.name ?? ''
                : 'NO PERK';
            ctx.fillStyle = '#445566';
            ctx.font = '8px monospace';
            ctx.fillText(`${wName.toUpperCase()} + ${pName}`, CANVAS_W / 2, this.START_BTN_Y + 26);
        }
        else {
            // Disabled
            ctx.fillStyle = '#0a0a18';
            ctx.fillRect(bx, by, btnW, btnH);
            ctx.strokeStyle = '#1a1a33';
            ctx.lineWidth = 1;
            ctx.strokeRect(bx, by, btnW, btnH);
            ctx.fillStyle = '#333344';
            ctx.font = 'bold 16px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('START RUN', CANVAS_W / 2, this.START_BTN_Y + 5);
        }
    }
}
