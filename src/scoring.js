// src/scoring.js - Score, cash, combo tracking, and lifetime run statistics
export class ScoringManager {
    constructor() {
        this.score = 0;
        this.runCash = 0;
        this.smashedCount = 0;
        this.combo = 1;
        this.comboTimer = 0;
        this.maxComboWindow = 2.4; // 2.4 seconds to keep combo chain active
    }

    reset() {
        this.score = 0;
        this.runCash = 0;
        this.smashedCount = 0;
        this.combo = 1;
        this.comboTimer = 0;
    }

    update(playerSpeed, dt) {
        // Natural score progression for speed and getaway survival
        this.score += Math.abs(playerSpeed) * 0.15 * dt * this.combo;

        if (this.combo > 1) {
            this.comboTimer -= dt;
            if (this.comboTimer <= 0) {
                this.combo = 1;
            }
        }
    }

    recordDestruction(baseCash, baseScore) {
        this.smashedCount++;
        this.combo = Math.min(10, this.combo + 1);
        this.comboTimer = this.maxComboWindow;

        const cashGain = Math.floor(baseCash * (1 + (this.combo - 1) * 0.4));
        const scoreGain = Math.floor(baseScore * this.combo);

        this.runCash += cashGain;
        this.score += scoreGain;

        return { cashGain, scoreGain, combo: this.combo };
    }

    addDirectCash(amount) {
        this.runCash += amount;
    }

    addDirectScore(amount) {
        this.score += amount;
    }
}
