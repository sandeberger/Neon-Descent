/**
 * MusicManager — 4-layer adaptive procedural music engine.
 *
 * Layer 0: Ambient       — always active, detuned drones + chord progression
 * Layer 1: Percussion    — combo tier >= 1, noise kicks + filtered hats
 * Layer 2: Melody        — combo tier >= 2, arpeggiated pentatonic sequence
 * Layer 3: Intensity     — combo tier >= 3 OR near-death, pulsing sub + distorted lead
 */
const BIOME_MUSIC = {
    surface_fracture: { rootNote: 55, scale: [0, 3, 5, 7, 10], bpm: 110, timbre: 'sawtooth' },
    neon_gut: { rootNote: 49, scale: [0, 2, 5, 7, 10], bpm: 120, timbre: 'square' },
    data_crypt: { rootNote: 44, scale: [0, 3, 5, 7, 10], bpm: 125, timbre: 'triangle' },
    hollow_market: { rootNote: 52, scale: [0, 2, 4, 7, 9], bpm: 95, timbre: 'sine' },
    molten_grid: { rootNote: 41, scale: [0, 2, 3, 7, 10], bpm: 130, timbre: 'sawtooth' },
    void_core: { rootNote: 37, scale: [0, 3, 5, 6, 10], bpm: 140, timbre: 'square' },
};
const CROSSFADE_DURATION = 2; // seconds
export class MusicManager {
    constructor() {
        this.ctx = null;
        this.running = false;
        // Layer gain nodes
        this.layerGains = [];
        this.layerTargets = [1, 0, 0, 0]; // current target volumes
        // Scheduling
        this.schedulerTimer = null;
        this.nextBeatTime = 0;
        this.beatIndex = 0;
        // State
        this.currentBiome = 'surface_fracture';
        this.biomeParams = BIOME_MUSIC['surface_fracture'];
        // Drone tracking for crossfade
        this.droneNodes = [];
        this.droneGains = [];
        // Noise buffer (shared)
        this.noiseBuffer = null;
    }
    start(ctx, outputNode) {
        this.ctx = ctx;
        this.running = true;
        // Create noise buffer
        const sampleRate = ctx.sampleRate;
        const length = Math.ceil(sampleRate * 2);
        this.noiseBuffer = ctx.createBuffer(1, length, sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < length; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        // Create layer gain nodes
        this.layerGains = [];
        for (let i = 0; i < 4; i++) {
            const gain = ctx.createGain();
            gain.gain.value = i === 0 ? 1 : 0;
            gain.connect(outputNode);
            this.layerGains.push(gain);
        }
        this.nextBeatTime = ctx.currentTime + 0.1;
        this.beatIndex = 0;
        // Start ambient drone (layer 0)
        this.startAmbientDrone();
        // Start scheduler
        this.schedulerTimer = window.setInterval(() => this.schedule(), 50);
    }
    stop() {
        this.running = false;
        if (this.schedulerTimer !== null) {
            clearInterval(this.schedulerTimer);
            this.schedulerTimer = null;
        }
        this.stopDrones(0);
        for (const gain of this.layerGains) {
            gain.disconnect();
        }
        this.layerGains = [];
    }
    updateLayers(comboTier, nearDeath) {
        const targets = [
            1, // Layer 0: always
            comboTier >= 1 ? 0.7 : 0, // Layer 1: percussion
            comboTier >= 2 ? 0.5 : 0, // Layer 2: melody
            (comboTier >= 3 || nearDeath) ? 0.6 : 0, // Layer 3: intensity
        ];
        if (!this.ctx)
            return;
        const now = this.ctx.currentTime;
        for (let i = 0; i < 4; i++) {
            if (this.layerTargets[i] !== targets[i]) {
                this.layerTargets[i] = targets[i];
                this.layerGains[i]?.gain.linearRampToValueAtTime(targets[i], now + 0.5);
            }
        }
    }
    transitionBiome(biomeId) {
        if (biomeId === this.currentBiome)
            return;
        if (!this.ctx)
            return;
        this.currentBiome = biomeId;
        this.biomeParams = BIOME_MUSIC[biomeId] ?? BIOME_MUSIC['surface_fracture'];
        // Crossfade: fade out old drones, start new ones
        this.stopDrones(CROSSFADE_DURATION);
        this.startAmbientDrone();
    }
    // ── Layer 0: Ambient Drone ──
    stopDrones(fadeTime) {
        if (!this.ctx)
            return;
        const now = this.ctx.currentTime;
        for (const g of this.droneGains) {
            g.gain.linearRampToValueAtTime(0, now + fadeTime);
        }
        // Schedule disconnect after fade
        const oldNodes = [...this.droneNodes];
        const oldGains = [...this.droneGains];
        if (fadeTime > 0) {
            setTimeout(() => {
                for (const n of oldNodes) {
                    try {
                        if ('stop' in n)
                            n.stop();
                    }
                    catch { }
                    try {
                        n.disconnect();
                    }
                    catch { }
                }
                for (const g of oldGains) {
                    try {
                        g.disconnect();
                    }
                    catch { }
                }
            }, fadeTime * 1000 + 100);
        }
        else {
            for (const n of oldNodes) {
                try {
                    if ('stop' in n)
                        n.stop();
                }
                catch { }
                try {
                    n.disconnect();
                }
                catch { }
            }
            for (const g of oldGains) {
                try {
                    g.disconnect();
                }
                catch { }
            }
        }
        this.droneNodes = [];
        this.droneGains = [];
    }
    startAmbientDrone() {
        const ctx = this.ctx;
        const gain = this.layerGains[0];
        const root = this.biomeParams.rootNote;
        const now = ctx.currentTime;
        // Root drone
        const osc1 = ctx.createOscillator();
        osc1.type = 'sawtooth';
        osc1.frequency.value = root;
        const osc1Gain = ctx.createGain();
        osc1Gain.gain.setValueAtTime(0, now);
        osc1Gain.gain.linearRampToValueAtTime(0.12, now + CROSSFADE_DURATION);
        const filter1 = ctx.createBiquadFilter();
        filter1.type = 'lowpass';
        filter1.frequency.value = 200;
        // LFO on filter
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.type = 'sine';
        lfo.frequency.value = 0.1;
        lfoGain.gain.value = 80;
        lfo.connect(lfoGain).connect(filter1.frequency);
        lfo.start();
        osc1.connect(filter1).connect(osc1Gain).connect(gain);
        osc1.start();
        // 5th drone
        const osc2 = ctx.createOscillator();
        osc2.type = 'sawtooth';
        osc2.frequency.value = root * 1.5;
        const osc2Gain = ctx.createGain();
        osc2Gain.gain.setValueAtTime(0, now);
        osc2Gain.gain.linearRampToValueAtTime(0.06, now + CROSSFADE_DURATION);
        const filter2 = ctx.createBiquadFilter();
        filter2.type = 'lowpass';
        filter2.frequency.value = 150;
        osc2.connect(filter2).connect(osc2Gain).connect(gain);
        osc2.start();
        // Sub sine
        const sub = ctx.createOscillator();
        sub.type = 'sine';
        sub.frequency.value = root / 2;
        const subGain = ctx.createGain();
        subGain.gain.setValueAtTime(0, now);
        subGain.gain.linearRampToValueAtTime(0.15, now + CROSSFADE_DURATION);
        sub.connect(subGain).connect(gain);
        sub.start();
        // Track for crossfade cleanup
        this.droneNodes = [osc1, osc2, sub, lfo];
        this.droneGains = [osc1Gain, osc2Gain, subGain];
    }
    // ── Scheduling ──
    schedule() {
        if (!this.ctx || !this.running)
            return;
        const ctx = this.ctx;
        const secondsPerBeat = 60 / this.biomeParams.bpm;
        const lookAhead = 0.15;
        while (this.nextBeatTime < ctx.currentTime + lookAhead) {
            this.scheduleBeat(this.nextBeatTime, this.beatIndex);
            this.nextBeatTime += secondsPerBeat / 2; // schedule at 8th-note resolution
            this.beatIndex++;
        }
    }
    scheduleBeat(time, beat) {
        // Layer 1: Percussion (8th notes)
        this.schedulePercussion(time, beat);
        // Layer 2: Melody (16th notes — every beat)
        this.scheduleMelody(time, beat);
        // Layer 3: Intensity (every beat)
        this.scheduleIntensity(time, beat);
    }
    // ── Layer 1: Percussion ──
    schedulePercussion(time, beat) {
        const ctx = this.ctx;
        const gain = this.layerGains[1];
        // Kick on downbeats (every 4 8th-notes = every 2 beats)
        if (beat % 4 === 0) {
            const kick = ctx.createOscillator();
            const kickGain = ctx.createGain();
            kick.type = 'sine';
            kick.frequency.setValueAtTime(150, time);
            kick.frequency.exponentialRampToValueAtTime(40, time + 0.15);
            kickGain.gain.setValueAtTime(0.3, time);
            kickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
            kick.connect(kickGain).connect(gain);
            kick.start(time);
            kick.stop(time + 0.2);
        }
        // Hi-hat on all 8th notes
        if (this.noiseBuffer) {
            const hat = ctx.createBufferSource();
            hat.buffer = this.noiseBuffer;
            const hatGain = ctx.createGain();
            const hatFilter = ctx.createBiquadFilter();
            hatFilter.type = 'highpass';
            hatFilter.frequency.value = 6000;
            hatGain.gain.setValueAtTime(beat % 2 === 0 ? 0.08 : 0.04, time);
            hatGain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
            hat.connect(hatFilter).connect(hatGain).connect(gain);
            hat.start(time);
            hat.stop(time + 0.05);
        }
        // Snare on beats 2 and 6 (in 8-beat pattern)
        if (beat % 8 === 4) {
            if (this.noiseBuffer) {
                const snare = ctx.createBufferSource();
                snare.buffer = this.noiseBuffer;
                const snareGain = ctx.createGain();
                const snareFilter = ctx.createBiquadFilter();
                snareFilter.type = 'bandpass';
                snareFilter.frequency.value = 3000;
                snareFilter.Q.value = 1;
                snareGain.gain.setValueAtTime(0.15, time);
                snareGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
                snare.connect(snareFilter).connect(snareGain).connect(gain);
                snare.start(time);
                snare.stop(time + 0.1);
            }
        }
    }
    // ── Layer 2: Melody (Pentatonic Arpeggio) ──
    scheduleMelody(time, beat) {
        const ctx = this.ctx;
        const gain = this.layerGains[2];
        const { rootNote, scale, timbre } = this.biomeParams;
        // Arpeggiate through scale — one note per 8th note
        const noteIndex = beat % scale.length;
        const octave = Math.floor((beat % (scale.length * 2)) / scale.length);
        const semitone = scale[noteIndex];
        const freq = rootNote * 4 * Math.pow(2, (semitone + octave * 12) / 12);
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = timbre;
        osc.frequency.value = freq;
        oscGain.gain.setValueAtTime(0.08, time);
        oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
        osc.connect(oscGain).connect(gain);
        osc.start(time);
        osc.stop(time + 0.16);
    }
    // ── Layer 3: Intensity ──
    scheduleIntensity(time, beat) {
        const ctx = this.ctx;
        const gain = this.layerGains[3];
        const { rootNote } = this.biomeParams;
        // Pulsing sub-bass on every 8th note
        if (beat % 2 === 0) {
            const sub = ctx.createOscillator();
            const subGain = ctx.createGain();
            sub.type = 'sine';
            sub.frequency.value = rootNote;
            subGain.gain.setValueAtTime(0.2, time);
            subGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
            sub.connect(subGain).connect(gain);
            sub.start(time);
            sub.stop(time + 0.13);
        }
        // Distorted sawtooth lead on every 4th beat
        if (beat % 4 === 0) {
            const lead = ctx.createOscillator();
            const leadGain = ctx.createGain();
            const dist = ctx.createWaveShaper();
            dist.curve = this.makeDistortionCurve(150);
            lead.type = 'sawtooth';
            lead.frequency.setValueAtTime(rootNote * 8, time);
            lead.frequency.exponentialRampToValueAtTime(rootNote * 4, time + 0.2);
            leadGain.gain.setValueAtTime(0.06, time);
            leadGain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
            lead.connect(dist).connect(leadGain).connect(gain);
            lead.start(time);
            lead.stop(time + 0.25);
        }
        // Double-time kick for intensity
        if (beat % 2 === 0) {
            const kick = ctx.createOscillator();
            const kickGain = ctx.createGain();
            kick.type = 'sine';
            kick.frequency.setValueAtTime(100, time);
            kick.frequency.exponentialRampToValueAtTime(30, time + 0.1);
            kickGain.gain.setValueAtTime(0.12, time);
            kickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
            kick.connect(kickGain).connect(gain);
            kick.start(time);
            kick.stop(time + 0.13);
        }
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
}
