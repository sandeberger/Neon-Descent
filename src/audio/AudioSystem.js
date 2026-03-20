import { MusicManager } from './MusicManager';
/**
 * Procedural audio system using Web Audio API.
 * All sounds are synthesized — no audio files needed.
 */
export class AudioSystem {
    constructor() {
        this.ctx = null;
        this.unlocked = false;
        // Adaptive music
        this.musicManager = new MusicManager();
        this.musicPlaying = false;
    }
    init(events) {
        // Wire game events to sounds
        events.on('weapon:fire', () => this.playShoot());
        events.on('player:stomp', () => this.playStomp());
        events.on('player:dash', () => this.playDash());
        events.on('stomp:hit', () => this.playStompHit());
        events.on('enemy:killed', () => this.playEnemyDeath());
        events.on('enemy:damaged', () => this.playEnemyHit());
        events.on('player:damage', () => this.playPlayerDamage());
        events.on('player:dead', () => this.playPlayerDeath());
        events.on('player:heal', () => this.playHeal());
        events.on('pickup:collected', (d) => this.playPickup(d.type));
        events.on('combo:increment', (d) => this.playComboTick(d.tier));
        events.on('combo:break', () => this.playComboBreak());
        events.on('player:wallslide', () => this.playWallSlide());
    }
    /** Must be called from a user gesture to unlock AudioContext on mobile */
    unlock() {
        if (this.unlocked)
            return;
        this.ctx = new AudioContext();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.6;
        this.masterGain.connect(this.ctx.destination);
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = 0.8;
        this.sfxGain.connect(this.masterGain);
        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 0.15;
        this.musicGain.connect(this.masterGain);
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        this.unlocked = true;
    }
    ensureCtx() {
        if (!this.ctx || !this.unlocked)
            return null;
        if (this.ctx.state === 'suspended')
            this.ctx.resume();
        return this.ctx;
    }
    // ─── SFX ─────────────────────────────────────────────
    playShoot() {
        const ctx = this.ensureCtx();
        if (!ctx)
            return;
        const now = ctx.currentTime;
        // High-pitched noise burst + sine click
        const noise = this.createNoise(ctx, 0.06);
        const noiseGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 3000;
        filter.Q.value = 2;
        noiseGain.gain.setValueAtTime(0.15, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        noise.connect(filter).connect(noiseGain).connect(this.sfxGain);
        noise.start(now);
        noise.stop(now + 0.06);
        // Sine click
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.04);
        oscGain.gain.setValueAtTime(0.08, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.connect(oscGain).connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.05);
    }
    playStomp() {
        const ctx = this.ensureCtx();
        if (!ctx)
            return;
        const now = ctx.currentTime;
        // Falling whoosh
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain).connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.15);
    }
    playStompHit() {
        const ctx = this.ensureCtx();
        if (!ctx)
            return;
        const now = ctx.currentTime;
        // Heavy thud
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.2);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain).connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.25);
        // Impact noise
        const noise = this.createNoise(ctx, 0.1);
        const nGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        nGain.gain.setValueAtTime(0.25, now);
        nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        noise.connect(filter).connect(nGain).connect(this.sfxGain);
        noise.start(now);
        noise.stop(now + 0.1);
    }
    playDash() {
        const ctx = this.ensureCtx();
        if (!ctx)
            return;
        const now = ctx.currentTime;
        // Upward whoosh
        const noise = this.createNoise(ctx, 0.15);
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.exponentialRampToValueAtTime(4000, now + 0.1);
        filter.Q.value = 1;
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        noise.connect(filter).connect(gain).connect(this.sfxGain);
        noise.start(now);
        noise.stop(now + 0.15);
        // Pitch rise
        const osc = ctx.createOscillator();
        const oGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.1);
        oGain.gain.setValueAtTime(0.06, now);
        oGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(oGain).connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.12);
    }
    playEnemyHit() {
        const ctx = this.ensureCtx();
        if (!ctx)
            return;
        const now = ctx.currentTime;
        // Short metallic ping
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(600 + Math.random() * 200, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.08);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain).connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.09);
    }
    playEnemyDeath() {
        const ctx = this.ensureCtx();
        if (!ctx)
            return;
        const now = ctx.currentTime;
        // Crunchy pop: noise burst + descending tone
        const noise = this.createNoise(ctx, 0.12);
        const nGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1500;
        filter.Q.value = 3;
        nGain.gain.setValueAtTime(0.2, now);
        nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        noise.connect(filter).connect(nGain).connect(this.sfxGain);
        noise.start(now);
        noise.stop(now + 0.12);
        // Descending tone
        const osc = ctx.createOscillator();
        const oGain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);
        oGain.gain.setValueAtTime(0.12, now);
        oGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(oGain).connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.16);
    }
    playPlayerDamage() {
        const ctx = this.ensureCtx();
        if (!ctx)
            return;
        const now = ctx.currentTime;
        // Distorted crunch
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const dist = ctx.createWaveShaper();
        dist.curve = this.makeDistortionCurve(200);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.2);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(dist).connect(gain).connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.25);
        // Noise hit
        const noise = this.createNoise(ctx, 0.08);
        const nGain = ctx.createGain();
        nGain.gain.setValueAtTime(0.3, now);
        nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        noise.connect(nGain).connect(this.sfxGain);
        noise.start(now);
        noise.stop(now + 0.08);
    }
    playPlayerDeath() {
        const ctx = this.ensureCtx();
        if (!ctx)
            return;
        const now = ctx.currentTime;
        // Dramatic descending stinger
        for (let i = 0; i < 4; i++) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const t = now + i * 0.08;
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(400 - i * 80, t);
            osc.frequency.exponentialRampToValueAtTime(30, t + 0.3);
            gain.gain.setValueAtTime(0.12 - i * 0.02, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
            osc.connect(gain).connect(this.sfxGain);
            osc.start(t);
            osc.stop(t + 0.4);
        }
        // Long noise rumble
        const noise = this.createNoise(ctx, 0.6);
        const nGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;
        nGain.gain.setValueAtTime(0.2, now);
        nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        noise.connect(filter).connect(nGain).connect(this.sfxGain);
        noise.start(now);
        noise.stop(now + 0.6);
    }
    playHeal() {
        const ctx = this.ensureCtx();
        if (!ctx)
            return;
        const now = ctx.currentTime;
        // Ascending sparkle
        for (let i = 0; i < 3; i++) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const t = now + i * 0.06;
            osc.type = 'sine';
            osc.frequency.value = 600 + i * 200;
            gain.gain.setValueAtTime(0.08, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
            osc.connect(gain).connect(this.sfxGain);
            osc.start(t);
            osc.stop(t + 0.15);
        }
    }
    playPickup(type) {
        const ctx = this.ensureCtx();
        if (!ctx)
            return;
        const now = ctx.currentTime;
        // Chirpy sparkle
        const baseFreq = type === 'heal' ? 800 : type === 'energy' ? 600 : 1000;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.setValueAtTime(baseFreq * 1.5, now + 0.04);
        osc.frequency.setValueAtTime(baseFreq * 2, now + 0.08);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain).connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.12);
    }
    playComboTick(tier) {
        const ctx = this.ensureCtx();
        if (!ctx)
            return;
        const now = ctx.currentTime;
        // Rising pitch per tier
        const freq = 400 + tier * 150;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.setValueAtTime(freq * 1.2, now + 0.03);
        gain.gain.setValueAtTime(0.06 + tier * 0.02, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain).connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.08);
    }
    playComboBreak() {
        const ctx = this.ensureCtx();
        if (!ctx)
            return;
        const now = ctx.currentTime;
        // Sad descending tone
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.3);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain).connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.3);
    }
    playWallSlide() {
        const ctx = this.ensureCtx();
        if (!ctx)
            return;
        const now = ctx.currentTime;
        // Short friction noise
        const noise = this.createNoise(ctx, 0.1);
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 2000;
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        noise.connect(filter).connect(gain).connect(this.sfxGain);
        noise.start(now);
        noise.stop(now + 0.1);
    }
    // ─── ADAPTIVE MUSIC ─────────────────────────────────
    startMusic() {
        const ctx = this.ensureCtx();
        if (!ctx || this.musicPlaying)
            return;
        this.musicPlaying = true;
        this.musicManager.start(ctx, this.musicGain);
    }
    stopMusic() {
        this.musicManager.stop();
        this.musicPlaying = false;
    }
    updateAdaptiveMusic(comboTier, nearDeath, biomeId) {
        this.musicManager.updateLayers(comboTier, nearDeath);
        this.musicManager.transitionBiome(biomeId);
    }
    // ─── UI SOUNDS ───────────────────────────────────────
    playMenuSelect() {
        const ctx = this.ensureCtx();
        if (!ctx)
            return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(660, now);
        osc.frequency.setValueAtTime(880, now + 0.05);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(gain).connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.1);
    }
    // ─── HELPERS ─────────────────────────────────────────
    createNoise(ctx, duration) {
        const sampleRate = ctx.sampleRate;
        const length = Math.ceil(sampleRate * duration);
        const buffer = ctx.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < length; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        return source;
    }
    makeDistortionCurve(amount) {
        const samples = 256;
        const curve = new Float32Array(samples);
        for (let i = 0; i < samples; i++) {
            const x = (i * 2) / samples - 1;
            curve[i] = ((Math.PI + amount) * x) / (Math.PI + amount * Math.abs(x));
        }
        return curve;
    }
    suspend() {
        this.ctx?.suspend();
    }
    resume() {
        this.ctx?.resume();
    }
}
