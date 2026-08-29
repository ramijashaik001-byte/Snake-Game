/**
 * SNAKE 3D: Hyperdimensional - Core Engine & Procedural Audio System
 * Handles game configurations, storage systems, and Web Audio API synthesis.
 */

// SafeStorage - Bypasses browser strict localStorage sandboxing on file:// protocol
let isLocalStorageAvailable = false;
try {
    const testKey = '__test_local_storage__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    isLocalStorageAvailable = true;
} catch (e) {
    console.warn("localStorage is blocked or unavailable in this environment (likely file:// sandbox). Defaulting to in-memory store.");
}

const SafeStorage = {
    memoryStore: {},
    getItem(key) {
        if (isLocalStorageAvailable) {
            try {
                return localStorage.getItem(key);
            } catch (e) {}
        }
        return this.memoryStore[key] !== undefined ? this.memoryStore[key] : null;
    },
    setItem(key, value) {
        if (isLocalStorageAvailable) {
            try {
                localStorage.setItem(key, value);
                return;
            } catch (e) {}
        }
        this.memoryStore[key] = String(value);
    },
    removeItem(key) {
        if (isLocalStorageAvailable) {
            try {
                localStorage.removeItem(key);
                return;
            } catch (e) {}
        }
        delete this.memoryStore[key];
    }
};

// Global Game Configuration
const Config = {
    // Game settings defaults
    settings: {
        graphics: 'medium',        // low, medium, high
        cameraMode: 'third-person', // third-person, first-person, classic, free-look
        playspaceMode: '2.5d',     // 2.5d, 3d-layered, 3d-free
        sfxVolume: 0.8,
        musicVolume: 0.5,
        gridHelper: true,
        shadows: true
    },

    // Cosmetic Items (Head Skins)
    skinsHead: [
        { id: 'head-neon', name: 'Cyber Neon', type: 'head', color: 0x00f0ff, icon: 'fa-circle', cost: 0, purchased: true },
        { id: 'head-plasma', name: 'Plasma Ruby', type: 'head', color: 0xff0055, icon: 'fa-fire', cost: 50, purchased: false },
        { id: 'head-matrix', name: 'Digital Rain', type: 'head', color: 0x39ff14, icon: 'fa-terminal', cost: 120, purchased: false },
        { id: 'head-gold', name: 'Imperial Aurum', type: 'head', color: 0xffaa00, icon: 'fa-crown', cost: 300, purchased: false },
        { id: 'head-quantum', name: 'Quantum Void', type: 'head', color: 0x9d00ff, icon: 'fa-atom', cost: 500, purchased: false }
    ],

    // Cosmetic Items (Body/Trail Trails)
    skinsBody: [
        { id: 'body-solid', name: 'Standard Beam', type: 'body', style: 'solid', cost: 0, purchased: true },
        { id: 'body-wire', name: 'Wireframe Grid', type: 'body', style: 'wireframe', cost: 80, purchased: false },
        { id: 'body-rainbow', name: 'Spectrum Pulse', type: 'body', style: 'rainbow', cost: 200, purchased: false },
        { id: 'body-spark', name: 'Plasma Spark', type: 'body', style: 'sparkle', cost: 400, purchased: false }
    ],

    // Cosmetic Items (Food Skins)
    skinsFood: [
        { id: 'food-sphere', name: 'Energy Node', type: 'food', shape: 'sphere', cost: 0, purchased: true },
        { id: 'food-cube', name: 'Data Cube', type: 'food', shape: 'cube', cost: 60, purchased: false },
        { id: 'food-torus', name: 'Singularity Ring', type: 'food', shape: 'torus', cost: 150, purchased: false },
        { id: 'food-star', name: 'Chrono Prism', type: 'food', shape: 'prism', cost: 250, purchased: false }
    ],

    // Achievements list
    achievements: [
        { id: 'first_bite', title: 'First Ingestion', desc: 'Ingest 1 anomaly node.', reward: 10, unlocked: false },
        { id: 'score_1k', title: 'Data Collector', desc: 'Reach 1,000 points in a single run.', reward: 20, unlocked: false },
        { id: 'score_5k', title: 'Grid Optimizer', desc: 'Reach 5,000 points in a single run.', reward: 50, unlocked: false },
        { id: 'score_10k', title: 'Hyperdimensional Master', desc: 'Reach 10,000 points in a single run.', reward: 150, unlocked: false },
        { id: 'len_20', title: 'Macro Construct', desc: 'Grow your snake tail to 20 units long.', reward: 30, unlocked: false },
        { id: 'sector_clear', title: 'Vector Explored', desc: 'Complete Sector 1 successfully.', reward: 40, unlocked: false },
        { id: 'all_sectors', title: 'Grand Navigator', desc: 'Complete all game sectors.', reward: 200, unlocked: false },
        { id: 'shield_save', title: 'Fail-Safe Triggered', desc: 'Absorb a lethal obstacle crash with a Shield.', reward: 25, unlocked: false },
        { id: 'buy_skin', title: 'Cosmetic Upgrade', desc: 'Purchase your first skin from the armory.', reward: 15, unlocked: false }
    ],

    // LocalStorage keys
    keys: {
        settings: 's3d_settings',
        credits: 's3d_credits',
        highscores: 's3d_highscores',
        skins: 's3d_unlocked_skins',
        achievements: 's3d_achievements',
        levelsUnlocked: 's3d_levels_unlocked',
        equipped: 's3d_equipped'
    }
};

/**
 * StorageManager - Handles local storage persistence
 */
const StorageManager = {
    safeParseJSON(key, defaultValue) {
        const val = SafeStorage.getItem(key);
        if (!val) return defaultValue;
        try {
            return JSON.parse(val);
        } catch (e) {
            console.warn(`Local storage key "${key}" contains corrupt data: "${val}". Resetting to default.`, e);
            SafeStorage.setItem(key, JSON.stringify(defaultValue));
            return defaultValue;
        }
    },

    init() {
        if (!SafeStorage.getItem(Config.keys.credits)) {
            SafeStorage.setItem(Config.keys.credits, '0');
        }
        if (!SafeStorage.getItem(Config.keys.highscores)) {
            SafeStorage.setItem(Config.keys.highscores, JSON.stringify([]));
        }
        if (!SafeStorage.getItem(Config.keys.levelsUnlocked)) {
            SafeStorage.setItem(Config.keys.levelsUnlocked, JSON.stringify([1])); // Sector 1 open
        }
        if (!SafeStorage.getItem(Config.keys.skins)) {
            SafeStorage.setItem(Config.keys.skins, JSON.stringify(['head-neon', 'body-solid', 'food-sphere']));
        }
        if (!SafeStorage.getItem(Config.keys.equipped)) {
            SafeStorage.setItem(Config.keys.equipped, JSON.stringify({
                head: 'head-neon',
                body: 'body-solid',
                food: 'food-sphere'
            }));
        }
        if (!SafeStorage.getItem(Config.keys.achievements)) {
            SafeStorage.setItem(Config.keys.achievements, JSON.stringify([]));
        }
        
        // Load Settings
        Config.settings = { ...Config.settings, ...this.safeParseJSON(Config.keys.settings, Config.settings) };

        // Apply skin purchase status from Storage
        const unlockedSkins = this.getUnlockedSkins();
        Config.skinsHead.forEach(s => s.purchased = unlockedSkins.includes(s.id));
        Config.skinsBody.forEach(s => s.purchased = unlockedSkins.includes(s.id));
        Config.skinsFood.forEach(s => s.purchased = unlockedSkins.includes(s.id));

        // Apply Achievements
        const unlockedAchievements = this.getUnlockedAchievements();
        Config.achievements.forEach(a => a.unlocked = unlockedAchievements.includes(a.id));
    },

    saveSettings() {
        SafeStorage.setItem(Config.keys.settings, JSON.stringify(Config.settings));
    },

    getCredits() {
        return parseInt(SafeStorage.getItem(Config.keys.credits) || '0', 10);
    },

    addCredits(amount) {
        const current = this.getCredits();
        const updated = current + amount;
        SafeStorage.setItem(Config.keys.credits, updated.toString());
        return updated;
    },

    deductCredits(amount) {
        const current = this.getCredits();
        if (current >= amount) {
            const updated = current - amount;
            SafeStorage.setItem(Config.keys.credits, updated.toString());
            return true;
        }
        return false;
    },

    getUnlockedSkins() {
        return this.safeParseJSON(Config.keys.skins, ['head-neon', 'body-solid', 'food-sphere']);
    },

    unlockSkin(skinId) {
        const skins = this.getUnlockedSkins();
        if (!skins.includes(skinId)) {
            skins.push(skinId);
            SafeStorage.setItem(Config.keys.skins, JSON.stringify(skins));
            
            // Trigger achievement check
            this.unlockAchievement('buy_skin');
        }
    },

    getEquipped() {
        return this.safeParseJSON(Config.keys.equipped, {
            head: 'head-neon',
            body: 'body-solid',
            food: 'food-sphere'
        });
    },

    setEquipped(category, skinId) {
        const equipped = this.getEquipped();
        equipped[category] = skinId;
        SafeStorage.setItem(Config.keys.equipped, JSON.stringify(equipped));
    },

    getUnlockedLevels() {
        return this.safeParseJSON(Config.keys.levelsUnlocked, [1]);
    },

    unlockLevel(levelNum) {
        const levels = this.getUnlockedLevels();
        if (!levels.includes(levelNum)) {
            levels.push(levelNum);
            SafeStorage.setItem(Config.keys.levelsUnlocked, JSON.stringify(levels));
        }
    },

    getUnlockedAchievements() {
        return this.safeParseJSON(Config.keys.achievements, []);
    },

    unlockAchievement(achId) {
        const achievements = this.getUnlockedAchievements();
        if (!achievements.includes(achId)) {
            achievements.push(achId);
            SafeStorage.setItem(Config.keys.achievements, JSON.stringify(achievements));
            
            // Mark in Config
            const achObj = Config.achievements.find(a => a.id === achId);
            if (achObj) {
                achObj.unlocked = true;
                // Add credits reward
                this.addCredits(achObj.reward);
                // Trigger notification in UI
                if (window.UIManager) {
                    window.UIManager.showPopupNotification(`Achievement Unlocked: ${achObj.title}! Received +${achObj.reward} Credits.`);
                    window.UIManager.updateShopCredits();
                    window.UIManager.renderAchievements();
                }
                AudioManager.playAchievementSound();
            }
        }
    },

    getHighScores() {
        return this.safeParseJSON(Config.keys.highscores, []);
    },

    saveHighScore(pilot, level, score) {
        const scores = this.getHighScores();
        scores.push({
            pilot: pilot || 'PILOT_01',
            level: level || 'Sector 1',
            score: score,
            date: new Date().toLocaleDateString()
        });
        // Sort descending
        scores.sort((a, b) => b.score - a.score);
        // Keep top 10
        const topScores = scores.slice(0, 10);
        SafeStorage.setItem(Config.keys.highscores, JSON.stringify(topScores));
    },

    clearHighScores() {
        SafeStorage.setItem(Config.keys.highscores, JSON.stringify([]));
    }
};

/**
 * AudioManager - Handles Web Audio API sounds and music synthesis
 */
const AudioManager = {
    ctx: null,
    musicVolumeNode: null,
    sfxVolumeNode: null,
    musicEnabled: false,
    sfxEnabled: true,
    
    // Music Sequencer state
    sequencerTimer: null,
    tempo: 120, // BPM
    currentBeat: 0,
    synthBassNode: null,
    synthLeadNode: null,
    
    // Synth notes frequencies
    bassNotes: [55.00, 55.00, 65.41, 65.41, 73.42, 73.42, 82.41, 82.41], // A1, C2, D2, E2
    leadNotes: [220.00, 261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33], // A3 Pentatonic scale
    
    // Procedural Music Sequence (simple grid)
    // 0 = none, 1 = play kick, 2 = play snare, 3 = play hihat
    drumPattern: [1, 3, 2, 3, 1, 3, 2, 3, 1, 3, 2, 3, 1, 3, 2, 1],
    bassPattern: [0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3], // indexes to bassNotes
    leadPattern: [-1, -1, 0, 2, -1, 4, 3, -1, -1, 5, 4, -1, 7, 6, 5, -1], // indexes to leadNotes (-1 is rest)

    init() {
        // Safe check for settings
        this.sfxEnabled = Config.settings.sfxVolume > 0;
        this.musicEnabled = false; // Off by default until screen interaction or button clicked
    },

    setupAudioContext() {
        if (this.ctx) return;
        
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();
            
            // SFX Volume Control
            this.sfxVolumeNode = this.ctx.createGain();
            this.sfxVolumeNode.gain.setValueAtTime(Config.settings.sfxVolume, this.ctx.currentTime);
            this.sfxVolumeNode.connect(this.ctx.destination);
            
            // Music Volume Control
            this.musicVolumeNode = this.ctx.createGain();
            this.musicVolumeNode.gain.setValueAtTime(Config.settings.musicVolume, this.ctx.currentTime);
            this.musicVolumeNode.connect(this.ctx.destination);
            
            this.updateVolumeSettings();
        } catch (e) {
            console.error('Web Audio API not supported in this browser.', e);
        }
    },

    resumeContext() {
        this.setupAudioContext();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },

    updateVolumeSettings() {
        if (!this.ctx) return;
        
        this.sfxVolumeNode.gain.setValueAtTime(this.sfxEnabled ? Config.settings.sfxVolume : 0, this.ctx.currentTime);
        this.musicVolumeNode.gain.setValueAtTime(this.musicEnabled ? Config.settings.musicVolume : 0, this.ctx.currentTime);
    },

    toggleSFX() {
        this.sfxEnabled = !this.sfxEnabled;
        this.updateVolumeSettings();
        this.playClick();
        return this.sfxEnabled;
    },

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        this.resumeContext();
        this.updateVolumeSettings();
        
        if (this.musicEnabled) {
            this.startMusic();
        } else {
            this.stopMusic();
        }
        
        this.playClick();
        return this.musicEnabled;
    },

    /* --- PROCEDURAL SOUND GENERATION --- */

    // Button Click
    playClick() {
        this.resumeContext();
        if (!this.sfxEnabled || !this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.08);

        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

        osc.connect(gain);
        gain.connect(this.sfxVolumeNode);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.08);
    },

    // Ingest Food
    playEatSound() {
        this.resumeContext();
        if (!this.sfxEnabled || !this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, this.ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, this.ctx.currentTime + 0.05); // E5
        osc.frequency.setValueAtTime(783.99, this.ctx.currentTime + 0.1); // G5
        osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.18);

        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

        osc.connect(gain);
        gain.connect(this.sfxVolumeNode);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
    },

    // Power Up Triggered
    playPowerupSound(type) {
        this.resumeContext();
        if (!this.sfxEnabled || !this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sawtooth';
        
        let startFreq = 300;
        let endFreq = 900;
        if (type === 'slow') {
            startFreq = 800;
            endFreq = 200;
            osc.type = 'triangle';
        } else if (type === 'shield') {
            startFreq = 400;
            endFreq = 600;
            osc.type = 'sine';
        }

        osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(endFreq, this.ctx.currentTime + 0.4);

        // Add some frequency LFO vibrato
        const vibrato = this.ctx.createOscillator();
        const vibratoGain = this.ctx.createGain();
        vibrato.frequency.value = 15; // Speed of vibrato
        vibratoGain.gain.value = 25;  // Depth of vibrato
        vibrato.connect(vibratoGain);
        vibratoGain.connect(osc.frequency);
        
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);

        osc.connect(gain);
        gain.connect(this.sfxVolumeNode);

        vibrato.start();
        osc.start();
        vibrato.stop(this.ctx.currentTime + 0.4);
        osc.stop(this.ctx.currentTime + 0.4);
    },

    // Hit Wall/Obstacle/Tail (Crash Death)
    playCrashSound() {
        this.resumeContext();
        if (!this.sfxEnabled || !this.ctx) return;

        const now = this.ctx.currentTime;
        
        // Low dropping tone
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.8);
        oscGain.gain.setValueAtTime(0.4, now);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
        osc.connect(oscGain);
        oscGain.connect(this.sfxVolumeNode);
        osc.start();
        osc.stop(now + 0.8);

        // Noise buffer generator for the crash sound
        const bufferSize = this.ctx.sampleRate * 0.6; // 0.6 seconds
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;

        // Bandpass filter to make it sound mechanical/crunchy
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, now);
        filter.frequency.exponentialRampToValueAtTime(100, now + 0.6);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.3, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

        whiteNoise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.sfxVolumeNode);

        whiteNoise.start();
        whiteNoise.stop(now + 0.6);
    },

    // Level Completed
    playLevelUpSound() {
        this.resumeContext();
        if (!this.sfxEnabled || !this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C Major scale arpeggio
        
        notes.forEach((freq, index) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + index * 0.08);
            
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.15, now + index * 0.08 + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.005, now + index * 0.08 + 0.25);
            
            osc.connect(gain);
            gain.connect(this.sfxVolumeNode);
            
            osc.start(now + index * 0.08);
            osc.stop(now + index * 0.08 + 0.3);
        });
    },

    // Unlock Achievement sound
    playAchievementSound() {
        this.resumeContext();
        if (!this.sfxEnabled || !this.ctx) return;

        const now = this.ctx.currentTime;
        const melody = [587.33, 659.25, 783.99, 880.00, 1046.50]; // D5, E5, G5, A5, C6
        
        melody.forEach((freq, index) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + index * 0.06);
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.18, now + index * 0.06 + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.01, now + index * 0.06 + 0.2);
            osc.connect(gain);
            gain.connect(this.sfxVolumeNode);
            
            osc.start(now + index * 0.06);
            osc.stop(now + index * 0.06 + 0.2);
        });
    },

    /* --- PROCEDURAL MUSIC SYNTHWAVE SEQUENCER --- */
    startMusic() {
        this.resumeContext();
        if (!this.musicEnabled || !this.ctx) return;
        if (this.sequencerTimer) return;

        this.currentBeat = 0;
        const intervalMs = (60 / this.tempo / 4) * 1000; // Quarter beat (sixteenth notes)
        
        this.sequencerTimer = setInterval(() => {
            this.playSequencerStep();
        }, intervalMs);
    },

    stopMusic() {
        if (this.sequencerTimer) {
            clearInterval(this.sequencerTimer);
            this.sequencerTimer = null;
        }
    },

    playSequencerStep() {
        if (!this.musicEnabled || !this.ctx || this.ctx.state === 'suspended') return;

        const now = this.ctx.currentTime;
        const beatIndex = this.currentBeat % 16;
        
        // 1. Synthesize Bass (80s Cyber Bassline)
        const bassVal = this.bassPattern[beatIndex];
        const bassFreq = this.bassNotes[bassVal];
        
        // Alternate high/low octave on 16th steps
        const octavedFreq = beatIndex % 2 === 0 ? bassFreq : bassFreq * 2;
        
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(octavedFreq, now);
        
        // Lowpass filter for warm analog bass
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(250, now);
        
        bassGain.gain.setValueAtTime(0.14, now);
        bassGain.gain.exponentialRampToValueAtTime(0.005, now + 0.12);
        
        bassOsc.connect(filter);
        filter.connect(bassGain);
        bassGain.connect(this.musicVolumeNode);
        
        bassOsc.start(now);
        bassOsc.stop(now + 0.15);

        // 2. Synthesize Drums (Kick & Snare & HiHat)
        const drumVal = this.drumPattern[beatIndex];
        if (drumVal === 1) { // Kick Drum
            const kickOsc = this.ctx.createOscillator();
            const kickGain = this.ctx.createGain();
            kickOsc.frequency.setValueAtTime(120, now);
            kickOsc.frequency.exponentialRampToValueAtTime(45, now + 0.1);
            kickGain.gain.setValueAtTime(0.4, now);
            kickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
            kickOsc.connect(kickGain);
            kickGain.connect(this.musicVolumeNode);
            kickOsc.start(now);
            kickOsc.stop(now + 0.15);
        } else if (drumVal === 2) { // Snare Drum (Bandpassed noise)
            const snOsc = this.ctx.createOscillator();
            const snGain = this.ctx.createGain();
            snOsc.type = 'triangle';
            snOsc.frequency.setValueAtTime(180, now);
            snGain.gain.setValueAtTime(0.12, now);
            snGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
            snOsc.connect(snGain);
            snGain.connect(this.musicVolumeNode);
            snOsc.start(now);
            snOsc.stop(now + 0.1);

            // Snare snap noise
            const noise = this.ctx.createOscillator(); // simpler noise approximation
            const nGain = this.ctx.createGain();
            noise.type = 'sawtooth';
            noise.frequency.value = 10000;
            nGain.gain.setValueAtTime(0.04, now);
            nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            noise.connect(nGain);
            nGain.connect(this.musicVolumeNode);
            noise.start(now);
            noise.stop(now + 0.1);
        } else if (drumVal === 3) { // Hi-Hat (Short noise click)
            const hhOsc = this.ctx.createOscillator();
            const hhGain = this.ctx.createGain();
            hhOsc.type = 'sawtooth';
            hhOsc.frequency.setValueAtTime(8000, now);
            hhGain.gain.setValueAtTime(0.015, now);
            hhGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
            hhOsc.connect(hhGain);
            hhGain.connect(this.musicVolumeNode);
            hhOsc.start(now);
            hhOsc.stop(now + 0.05);
        }

        // 3. Synthesize Melody Lead (retro synth plucks)
        const leadIdx = this.leadPattern[beatIndex];
        if (leadIdx !== -1) {
            const leadFreq = this.leadNotes[leadIdx];
            
            const leadOsc = this.ctx.createOscillator();
            const leadGain = this.ctx.createGain();
            
            // Cyber pulse wave
            leadOsc.type = 'sine';
            leadOsc.frequency.setValueAtTime(leadFreq, now);
            
            // Add slight echo using another oscillator at lower volume delayed
            const echoOsc = this.ctx.createOscillator();
            const echoGain = this.ctx.createGain();
            echoOsc.type = 'sine';
            echoOsc.frequency.setValueAtTime(leadFreq, now + 0.15);
            echoGain.gain.setValueAtTime(0, now);
            echoGain.gain.setValueAtTime(0.03, now + 0.15);
            echoGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
            echoOsc.connect(echoGain);
            echoGain.connect(this.musicVolumeNode);
            echoOsc.start(now + 0.15);
            echoOsc.stop(now + 0.4);

            leadGain.gain.setValueAtTime(0.08, now);
            leadGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
            
            leadOsc.connect(leadGain);
            leadGain.connect(this.musicVolumeNode);
            
            leadOsc.start(now);
            leadOsc.stop(now + 0.3);
        }

        this.currentBeat++;
        
        // Slightly change lead melodies randomly every 32 steps to avoid boredom
        if (this.currentBeat % 32 === 0) {
            this.scrambleMelody();
        }
    },

    scrambleMelody() {
        for (let i = 0; i < this.leadPattern.length; i++) {
            if (Math.random() > 0.4) {
                // Random pentatonic index or rest
                this.leadPattern[i] = Math.random() > 0.35 ? Math.floor(Math.random() * this.leadNotes.length) : -1;
            }
        }
    }
};

// Expose Config and Managers globally
window.Config = Config;
window.StorageManager = StorageManager;
window.AudioManager = AudioManager;

// Initialize Storage Manager immediately with local try-catch to bypass cross-origin masking
try {
    StorageManager.init();
    AudioManager.init();
} catch (e) {
    console.error("Storage/Audio engine initialization failed:", e);
}
