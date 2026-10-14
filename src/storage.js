// src/storage.js - LocalStorage persistence for player progress
const STORAGE_KEY = 'neon_getaway_save_v1';

const DEFAULT_SAVE = {
    cash: 500, // Starter cash bonus
    ownedCars: ['compact'],
    selectedCar: 'compact',
    highScore: 0,
    selectedMap: 0,
    soundEnabled: true,
    stats: {
        totalSmashed: 0,
        totalCopsWrecked: 0,
        totalRuns: 0,
        totalCashEarned: 500
    }
};

class StorageManager {
    constructor() {
        this.data = this.load();
    }

    load() {
        try {
            if (typeof localStorage === 'undefined') return { ...DEFAULT_SAVE };
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return { ...DEFAULT_SAVE };
            const parsed = JSON.parse(raw);
            return {
                ...DEFAULT_SAVE,
                ...parsed,
                stats: { ...DEFAULT_SAVE.stats, ...(parsed.stats || {}) },
                ownedCars: Array.isArray(parsed.ownedCars) && parsed.ownedCars.includes('compact') 
                    ? parsed.ownedCars 
                    : ['compact']
            };
        } catch (e) {
            console.warn('LocalStorage load failed, using defaults', e);
            return { ...DEFAULT_SAVE };
        }
    }

    save() {
        try {
            if (typeof localStorage === 'undefined') return;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
        } catch (e) {
            console.warn('LocalStorage save failed', e);
        }
    }

    getCash() {
        return this.data.cash;
    }

    addCash(amount) {
        if (amount > 0) {
            this.data.cash += Math.floor(amount);
            this.data.stats.totalCashEarned += Math.floor(amount);
            this.save();
        }
        return this.data.cash;
    }

    deductCash(amount) {
        if (amount <= this.data.cash) {
            this.data.cash -= Math.floor(amount);
            this.save();
            return true;
        }
        return false;
    }

    isCarOwned(carId) {
        return this.data.ownedCars.includes(carId);
    }

    unlockCar(carId, cost) {
        if (this.isCarOwned(carId)) return true;
        if (this.deductCash(cost)) {
            this.data.ownedCars.push(carId);
            this.data.selectedCar = carId;
            this.save();
            return true;
        }
        return false;
    }

    getSelectedCar() {
        return this.data.selectedCar || 'compact';
    }

    setSelectedCar(carId) {
        if (this.isCarOwned(carId)) {
            this.data.selectedCar = carId;
            this.save();
            return true;
        }
        return false;
    }

    getSelectedMap() {
        return typeof this.data.selectedMap === 'number' ? this.data.selectedMap : 0;
    }

    setSelectedMap(mapIndex) {
        this.data.selectedMap = mapIndex;
        this.save();
    }

    getHighScore() {
        return this.data.highScore || 0;
    }

    updateHighScore(score) {
        if (score > this.data.highScore) {
            this.data.highScore = Math.floor(score);
            this.save();
            return true;
        }
        return false;
    }

    isSoundEnabled() {
        return this.data.soundEnabled !== false;
    }

    setSoundEnabled(enabled) {
        this.data.soundEnabled = !!enabled;
        this.save();
    }

    recordRunEnd(smashed, copsWrecked) {
        this.data.stats.totalRuns++;
        this.data.stats.totalSmashed += (smashed || 0);
        this.data.stats.totalCopsWrecked += (copsWrecked || 0);
        this.save();
    }
}

export const storage = new StorageManager();
