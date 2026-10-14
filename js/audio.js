// audio.js - Web Audio API procedural sound synthesizer for Smash Outlaws
import { storage } from './storage.js';

class AudioManager {
    constructor() {
        this.ctx = null;
        this.enabled = storage.isSoundEnabled();
        this.masterGain = null;
        
        // Engine sound nodes
        this.engineOsc1 = null;
        this.engineOsc2 = null;
        this.engineFilter = null;
        this.engineGain = null;
        this.engineRunning = false;

        // Siren sound nodes
        this.sirenOsc = null;
        this.sirenLfo = null;
        this.sirenGain = null;
        this.sirenActive = false;
    }

    init() {
        if (this.ctx) return;
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.enabled ? 0.35 : 0;
        this.masterGain.connect(this.ctx.destination);
    }

    ensureContext() {
        if (!this.ctx) this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleSound() {
        this.enabled = !this.enabled;
        storage.setSoundEnabled(this.enabled);
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setValueAtTime(this.enabled ? 0.35 : 0, this.ctx.currentTime);
        }
        return this.enabled;
    }

    // Engine loop
    startEngine() {
        if (!this.ctx || !this.enabled || this.engineRunning) return;
        try {
            const now = this.ctx.currentTime;
            this.engineOsc1 = this.ctx.createOscillator();
            this.engineOsc2 = this.ctx.createOscillator();
            this.engineFilter = this.ctx.createBiquadFilter();
            this.engineGain = this.ctx.createGain();

            this.engineOsc1.type = 'sawtooth';
            this.engineOsc2.type = 'triangle';
            this.engineOsc1.frequency.setValueAtTime(55, now);
            this.engineOsc2.frequency.setValueAtTime(110, now);

            this.engineFilter.type = 'lowpass';
            this.engineFilter.frequency.setValueAtTime(450, now);

            this.engineGain.gain.setValueAtTime(0.08, now);

            this.engineOsc1.connect(this.engineFilter);
            this.engineOsc2.connect(this.engineFilter);
            this.engineFilter.connect(this.engineGain);
            this.engineGain.connect(this.masterGain);

            this.engineOsc1.start(now);
            this.engineOsc2.start(now);
            this.engineRunning = true;
        } catch (e) {
            console.warn('Engine sound start failed', e);
        }
    }

    updateEngine(speedRatio, isBoost = false) {
        if (!this.ctx || !this.engineRunning) return;
        try {
            const now = this.ctx.currentTime;
            const ratio = Math.max(0, Math.min(1.5, speedRatio));
            const baseFreq = 50 + ratio * 160 + (isBoost ? 60 : 0);
            this.engineOsc1.frequency.setTargetAtTime(baseFreq, now, 0.05);
            this.engineOsc2.frequency.setTargetAtTime(baseFreq * 1.5, now, 0.05);

            const filterFreq = 350 + ratio * 1200 + (isBoost ? 600 : 0);
            this.engineFilter.frequency.setTargetAtTime(filterFreq, now, 0.05);

            const gainVal = 0.06 + ratio * 0.08 + (isBoost ? 0.04 : 0);
            this.engineGain.gain.setTargetAtTime(gainVal, now, 0.05);
        } catch (e) {}
    }

    stopEngine() {
        if (!this.engineRunning) return;
        try {
            if (this.engineOsc1) this.engineOsc1.stop();
            if (this.engineOsc2) this.engineOsc2.stop();
        } catch (e) {}
        this.engineRunning = false;
    }

    // Drift / Tire screech
    playDrift(volume = 0.15) {
        if (!this.ctx || !this.enabled) return;
        try {
            const now = this.ctx.currentTime;
            const bufferSize = this.ctx.sampleRate * 0.12;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(1400, now);
            filter.Q.setValueAtTime(4, now);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(volume * 0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);

            noise.start(now);
        } catch (e) {}
    }

    // Object smash sound
    playSmash(type = 'fence') {
        if (!this.ctx || !this.enabled) return;
        try {
            const now = this.ctx.currentTime;
            
            // Noise punch
            const bufferSize = Math.floor(this.ctx.sampleRate * 0.18);
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
            }
            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = type === 'rock' ? 'lowpass' : 'bandpass';
            filter.frequency.setValueAtTime(type === 'rock' ? 400 : 900, now);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);
            noise.start(now);

            // Sub-thump body
            const osc = this.ctx.createOscillator();
            const oscGain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(160, now);
            osc.frequency.exponentialRampToValueAtTime(35, now + 0.16);

            oscGain.gain.setValueAtTime(0.4, now);
            oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);

            osc.connect(oscGain);
            oscGain.connect(this.masterGain);
            osc.start(now);
            osc.stop(now + 0.17);
        } catch (e) {}
    }

    // Cash chime
    playCashChime() {
        if (!this.ctx || !this.enabled) return;
        try {
            const now = this.ctx.currentTime;
            const playBell = (freq, delay) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + delay);

                gain.gain.setValueAtTime(0, now + delay);
                gain.gain.linearRampToValueAtTime(0.2, now + delay + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.35);

                osc.connect(gain);
                gain.connect(this.masterGain);
                osc.start(now + delay);
                osc.stop(now + delay + 0.36);
            };

            playBell(1318.5, 0);      // E6
            playBell(1975.5, 0.08);   // B6
        } catch (e) {}
    }

    // Police Siren
    setSiren(active) {
        if (!this.ctx || !this.enabled) {
            if (this.sirenActive) this.stopSiren();
            return;
        }
        if (active && !this.sirenActive) {
            try {
                const now = this.ctx.currentTime;
                this.sirenOsc = this.ctx.createOscillator();
                this.sirenLfo = this.ctx.createOscillator();
                const lfoGain = this.ctx.createGain();
                this.sirenGain = this.ctx.createGain();

                this.sirenOsc.type = 'sawtooth';
                this.sirenOsc.frequency.setValueAtTime(700, now);

                this.sirenLfo.type = 'sine';
                this.sirenLfo.frequency.setValueAtTime(1.6, now); // 1.6 Hz siren oscillation
                lfoGain.gain.setValueAtTime(260, now);

                this.sirenLfo.connect(lfoGain);
                lfoGain.connect(this.sirenOsc.frequency);

                this.sirenGain.gain.setValueAtTime(0.04, now);

                this.sirenOsc.connect(this.sirenGain);
                this.sirenGain.connect(this.masterGain);

                this.sirenOsc.start(now);
                this.sirenLfo.start(now);
                this.sirenActive = true;
            } catch (e) {}
        } else if (!active && this.sirenActive) {
            this.stopSiren();
        }
    }

    stopSiren() {
        if (!this.sirenActive) return;
        try {
            if (this.sirenOsc) this.sirenOsc.stop();
            if (this.sirenLfo) this.sirenLfo.stop();
        } catch (e) {}
        this.sirenActive = false;
    }

    // Ability: EMP Shockwave Zap
    playEmpZap() {
        if (!this.ctx || !this.enabled) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const filter = this.ctx.createBiquadFilter();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(950, now);
            osc.frequency.exponentialRampToValueAtTime(70, now + 0.45);

            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(1800, now);
            filter.frequency.exponentialRampToValueAtTime(150, now + 0.45);
            filter.Q.setValueAtTime(5, now);

            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);

            osc.start(now);
            osc.stop(now + 0.46);
        } catch (e) {}
    }

    // Ability: Oil Slick deploy
    playOilDrop() {
        if (!this.ctx || !this.enabled) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(380, now);
            osc.frequency.exponentialRampToValueAtTime(80, now + 0.22);

            gain.gain.setValueAtTime(0.28, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(now);
            osc.stop(now + 0.23);
        } catch (e) {}
    }

    // Ability: Tank Transformation
    playTankTransform() {
        if (!this.ctx || !this.enabled) return;
        try {
            const now = this.ctx.currentTime;
            // Metal clank
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.exponentialRampToValueAtTime(55, now + 0.4);

            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now);
            osc.stop(now + 0.42);
        } catch (e) {}
    }

    // Police Takedown Explosion
    playPoliceWreck() {
        if (!this.ctx || !this.enabled) return;
        try {
            const now = this.ctx.currentTime;
            const bufferSize = Math.floor(this.ctx.sampleRate * 0.45);
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
            }
            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(650, now);
            filter.frequency.exponentialRampToValueAtTime(80, now + 0.45);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.55, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);
            noise.start(now);
        } catch (e) {}
    }

    // Collision bounce (hitting hard building/cliff)
    playHit() {
        if (!this.ctx || !this.enabled) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(140, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);

            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now);
            osc.stop(now + 0.13);
        } catch (e) {}
    }
}

export const audio = new AudioManager();
