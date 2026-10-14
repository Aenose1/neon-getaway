// src/garage.js - Garage showroom, 3D rotating turntable, car selection, and purchasing
import { CAR_MODELS } from './config.js';
import { storage } from './storage.js';
import { audio } from './audio.js';

export class GarageManager {
    constructor(game) {
        this.game = game;
        this.carKeys = ['compact', 'street', 'muscle', 'super'];
        this.currentIndex = 0;
        this.turntableAngle = 0;

        this.initDOM();
    }

    initDOM() {
        this.screenEl = document.getElementById('garage-screen');
        this.canvasEl = document.getElementById('garage-turntable-canvas');
        if (this.canvasEl) {
            this.ctx = this.canvasEl.getContext('2d');
        }

        this.carNameEl = document.getElementById('garage-car-name');
        this.carTypeEl = document.getElementById('garage-car-type');
        this.carDescEl = document.getElementById('garage-car-desc');
        this.carPriceEl = document.getElementById('garage-car-price');
        this.statSpeedEl = document.getElementById('stat-speed');
        this.statAccelEl = document.getElementById('stat-accel');
        this.statHandlingEl = document.getElementById('stat-handling');
        this.statArmorEl = document.getElementById('stat-armor');
        this.actionBtn = document.getElementById('garage-action-btn');
        this.cashDisplayEl = document.getElementById('garage-cash-display');

        // Navigation buttons
        document.getElementById('btn-prev-car')?.addEventListener('click', () => this.prevCar());
        document.getElementById('btn-next-car')?.addEventListener('click', () => this.nextCar());
        this.actionBtn?.addEventListener('click', () => this.handleAction());
    }

    show() {
        const selectedId = storage.getSelectedCar();
        const found = this.carKeys.indexOf(selectedId);
        this.currentIndex = found >= 0 ? found : 0;
        this.updateView();
    }

    prevCar() {
        this.currentIndex = (this.currentIndex - 1 + this.carKeys.length) % this.carKeys.length;
        this.updateView();
    }

    nextCar() {
        this.currentIndex = (this.currentIndex + 1) % this.carKeys.length;
        this.updateView();
    }

    updateView() {
        const carId = this.carKeys[this.currentIndex];
        const car = CAR_MODELS[carId];
        const isOwned = storage.isCarOwned(carId);
        const isSelected = storage.getSelectedCar() === carId;
        const userCash = storage.getCash();

        if (this.carNameEl) this.carNameEl.textContent = car.name;
        if (this.carTypeEl) this.carTypeEl.textContent = car.type.toUpperCase();
        if (this.carDescEl) this.carDescEl.textContent = car.description;
        if (this.cashDisplayEl) this.cashDisplayEl.textContent = `$${userCash.toLocaleString()}`;

        if (this.statSpeedEl) this.statSpeedEl.style.width = `${car.stats.speed}%`;
        if (this.statAccelEl) this.statAccelEl.style.width = `${car.stats.accel}%`;
        if (this.statHandlingEl) this.statHandlingEl.style.width = `${car.stats.handling}%`;
        if (this.statArmorEl) this.statArmorEl.style.width = `${car.stats.armor}%`;

        if (this.carPriceEl) {
            this.carPriceEl.textContent = isOwned ? (isSelected ? 'EQUIPPED' : 'OWNED') : `$${car.price.toLocaleString()}`;
            this.carPriceEl.className = isSelected ? 'status-equipped' : (isOwned ? 'status-owned' : 'status-price');
        }

        if (this.actionBtn) {
            if (isSelected) {
                this.actionBtn.textContent = 'SELECTED';
                this.actionBtn.className = 'btn-arcade btn-disabled';
                this.actionBtn.disabled = true;
            } else if (isOwned) {
                this.actionBtn.textContent = 'SELECT CAR';
                this.actionBtn.className = 'btn-arcade btn-primary';
                this.actionBtn.disabled = false;
            } else {
                if (userCash >= car.price) {
                    this.actionBtn.textContent = `BUY CAR ($${car.price.toLocaleString()})`;
                    this.actionBtn.className = 'btn-arcade btn-buy';
                    this.actionBtn.disabled = false;
                } else {
                    const missing = car.price - userCash;
                    this.actionBtn.textContent = `NEED $${missing.toLocaleString()} MORE`;
                    this.actionBtn.className = 'btn-arcade btn-disabled';
                    this.actionBtn.disabled = true;
                }
            }
        }
    }

    handleAction() {
        const carId = this.carKeys[this.currentIndex];
        const car = CAR_MODELS[carId];
        const isOwned = storage.isCarOwned(carId);

        if (isOwned) {
            storage.setSelectedCar(carId);
            this.game.player.setCarModel(carId);
            audio.playCashChime();
            this.updateView();
        } else {
            if (storage.unlockCar(carId, car.price)) {
                this.game.player.setCarModel(carId);
                audio.playCashChime();
                this.updateView();
            }
        }
    }

    renderTurntable(dt) {
        if (!this.ctx || this.game.state !== 'GARAGE') return;

        const ctx = this.ctx;
        const w = this.canvasEl.width;
        const h = this.canvasEl.height;

        this.turntableAngle += dt * 1.2;

        ctx.clearRect(0, 0, w, h);

        ctx.save();
        ctx.translate(w / 2, h / 2 + 30);

        // Circular pedestal shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(0, 10, 110, 50, 0, 0, Math.PI * 2);
        ctx.fill();

        // Neon glowing rim pedestal
        const grad = ctx.createLinearGradient(-100, 0, 100, 0);
        grad.addColorStop(0, '#1a2332');
        grad.addColorStop(0.5, '#2c3e50');
        grad.addColorStop(1, '#1a2332');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(0, 0, 105, 45, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#00d2ff';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#00d2ff';
        ctx.shadowBlur = 15;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Draw preview model on turntable
        const carId = this.carKeys[this.currentIndex];
        const model = CAR_MODELS[carId];

        ctx.rotate(this.turntableAngle);

        this.game.player.carId = model.id;
        this.game.player.model = model;
        this.game.player.width = model.width;
        this.game.player.length = model.length;
        this.game.player.drawCar(ctx);

        ctx.restore();
    }
}
