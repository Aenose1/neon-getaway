// ui.js - Menus, 3D rotating garage turntable, HUD, map selector, and modals
import { storage } from './storage.js';
import { CAR_MODELS } from './car.js';
import { MAP_CONFIGS } from './map.js';
import { audio } from './audio.js';

export class UIManager {
    constructor(game) {
        this.game = game;
        this.turntableAngle = 0;
        this.currentGarageCarIndex = 0;
        this.carKeys = ['compact', 'street', 'muscle', 'super'];

        this.initDOMElements();
        this.bindEvents();
        this.updateSoundIcon();
    }

    initDOMElements() {
        // Screens
        this.mainMenu = document.getElementById('main-menu');
        this.mapSelectScreen = document.getElementById('map-select-screen');
        this.garageScreen = document.getElementById('garage-screen');
        this.gameplayHud = document.getElementById('gameplay-hud');
        this.pauseModal = document.getElementById('pause-modal');
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.storyModal = document.getElementById('story-modal');

        // Garage Elements
        this.garageCanvas = document.getElementById('garage-turntable-canvas');
        if (this.garageCanvas) {
            this.garageCtx = this.garageCanvas.getContext('2d');
        }
        this.carNameEl = document.getElementById('garage-car-name');
        this.carTypeEl = document.getElementById('garage-car-type');
        this.carDescEl = document.getElementById('garage-car-desc');
        this.carPriceEl = document.getElementById('garage-car-price');
        this.statSpeedEl = document.getElementById('stat-speed');
        this.statAccelEl = document.getElementById('stat-accel');
        this.statHandlingEl = document.getElementById('stat-handling');
        this.statArmorEl = document.getElementById('stat-armor');
        this.garageActionBtn = document.getElementById('garage-action-btn');
        this.garageCashEl = document.getElementById('garage-cash-display');

        // HUD Elements
        this.hudCashEl = document.getElementById('hud-cash');
        this.hudScoreEl = document.getElementById('hud-score');
        this.hudComboEl = document.getElementById('hud-combo');
        this.hudComboTextEl = document.getElementById('hud-combo-text');
        this.hudHeatStarsEl = document.getElementById('hud-heat-stars');
        this.hudHealthFillEl = document.getElementById('hud-health-fill');
        this.hudSpeedEl = document.getElementById('hud-speed');

        // Ability buttons in HUD
        this.btnTank = document.getElementById('btn-ability-tank');
        this.btnOil = document.getElementById('btn-ability-oil');
        this.btnEmp = document.getElementById('btn-ability-emp');

        // Global Cash displays
        this.menuCashEl = document.getElementById('menu-cash-display');
        this.menuHighScoreEl = document.getElementById('menu-highscore-display');
    }

    bindEvents() {
        // Main Menu Buttons
        document.getElementById('btn-play')?.addEventListener('click', () => {
            audio.ensureContext();
            this.showMapSelect();
        });

        document.getElementById('btn-garage')?.addEventListener('click', () => {
            audio.ensureContext();
            this.showGarage();
        });

        document.getElementById('btn-story')?.addEventListener('click', () => {
            this.storyModal.classList.remove('hidden');
        });

        document.getElementById('btn-close-story')?.addEventListener('click', () => {
            this.storyModal.classList.add('hidden');
        });

        document.getElementById('btn-sound-toggle')?.addEventListener('click', () => {
            audio.ensureContext();
            audio.toggleSound();
            this.updateSoundIcon();
        });

        // Garage Navigation
        document.getElementById('btn-prev-car')?.addEventListener('click', () => {
            this.currentGarageCarIndex = (this.currentGarageCarIndex - 1 + this.carKeys.length) % this.carKeys.length;
            this.updateGarageView();
        });

        document.getElementById('btn-next-car')?.addEventListener('click', () => {
            this.currentGarageCarIndex = (this.currentGarageCarIndex + 1) % this.carKeys.length;
            this.updateGarageView();
        });

        document.getElementById('btn-garage-back')?.addEventListener('click', () => {
            this.showMainMenu();
        });

        this.garageActionBtn?.addEventListener('click', () => {
            this.handleGarageAction();
        });

        // Map Selection Cards
        const mapCards = document.querySelectorAll('.map-card');
        mapCards.forEach((card) => {
            card.addEventListener('click', (e) => {
                const mapIdx = parseInt(card.dataset.mapIndex, 10);
                this.selectMapAndStart(mapIdx);
            });
        });

        document.getElementById('btn-map-back')?.addEventListener('click', () => {
            this.showMainMenu();
        });

        // Pause Modal
        document.getElementById('btn-pause-hud')?.addEventListener('click', () => {
            this.game.togglePause();
        });

        document.getElementById('btn-resume')?.addEventListener('click', () => {
            this.game.togglePause();
        });

        document.getElementById('btn-restart-pause')?.addEventListener('click', () => {
            this.pauseModal.classList.add('hidden');
            this.game.startRun();
        });

        document.getElementById('btn-menu-pause')?.addEventListener('click', () => {
            this.pauseModal.classList.add('hidden');
            this.game.endRunToMenu();
        });

        // Game Over Buttons
        document.getElementById('btn-gameover-restart')?.addEventListener('click', () => {
            this.gameOverScreen.classList.add('hidden');
            this.game.startRun();
        });

        document.getElementById('btn-gameover-garage')?.addEventListener('click', () => {
            this.gameOverScreen.classList.add('hidden');
            this.showGarage();
        });

        document.getElementById('btn-gameover-menu')?.addEventListener('click', () => {
            this.gameOverScreen.classList.add('hidden');
            this.showMainMenu();
        });

        // HUD Ability Touch/Click triggers
        this.btnTank?.addEventListener('click', () => {
            this.game.triggerAbility('tank');
        });
        this.btnOil?.addEventListener('click', () => {
            this.game.triggerAbility('oil');
        });
        this.btnEmp?.addEventListener('click', () => {
            this.game.triggerAbility('emp');
        });
    }

    updateSoundIcon() {
        const isEnabled = audio.enabled;
        const iconEls = document.querySelectorAll('.sound-state-icon');
        iconEls.forEach(el => {
            el.textContent = isEnabled ? '🔊' : '🔇';
        });
    }

    showMainMenu() {
        this.hideAllScreens();
        this.mainMenu.classList.remove('hidden');
        if (this.menuCashEl) this.menuCashEl.textContent = `$${storage.getCash().toLocaleString()}`;
        if (this.menuHighScoreEl) this.menuHighScoreEl.textContent = storage.getHighScore().toLocaleString();
        this.game.state = 'MENU';
    }

    showMapSelect() {
        this.hideAllScreens();
        this.mapSelectScreen.classList.remove('hidden');

        // Highlight currently selected map
        const currentMap = storage.getSelectedMap();
        document.querySelectorAll('.map-card').forEach(card => {
            const idx = parseInt(card.dataset.mapIndex, 10);
            if (idx === currentMap) card.classList.add('selected');
            else card.classList.remove('selected');
        });

        this.game.state = 'MAP_SELECT';
    }

    selectMapAndStart(mapIndex) {
        storage.setSelectedMap(mapIndex);
        this.hideAllScreens();
        this.gameplayHud.classList.remove('hidden');
        this.game.startRun(mapIndex);
    }

    showGarage() {
        this.hideAllScreens();
        this.garageScreen.classList.remove('hidden');

        // Set to currently selected car
        const selectedId = storage.getSelectedCar();
        const foundIdx = this.carKeys.indexOf(selectedId);
        this.currentGarageCarIndex = foundIdx >= 0 ? foundIdx : 0;

        this.updateGarageView();
        this.game.state = 'GARAGE';
    }

    updateGarageView() {
        const carId = this.carKeys[this.currentGarageCarIndex];
        const car = CAR_MODELS[carId];
        const isOwned = storage.isCarOwned(carId);
        const isSelected = storage.getSelectedCar() === carId;
        const userCash = storage.getCash();

        if (this.carNameEl) this.carNameEl.textContent = car.name;
        if (this.carTypeEl) this.carTypeEl.textContent = car.type.toUpperCase();
        if (this.carDescEl) this.carDescEl.textContent = car.description;
        if (this.garageCashEl) this.garageCashEl.textContent = `$${userCash.toLocaleString()}`;

        if (this.statSpeedEl) this.statSpeedEl.style.width = `${car.stats.speed}%`;
        if (this.statAccelEl) this.statAccelEl.style.width = `${car.stats.accel}%`;
        if (this.statHandlingEl) this.statHandlingEl.style.width = `${car.stats.handling}%`;
        if (this.statArmorEl) this.statArmorEl.style.width = `${car.stats.armor}%`;

        if (this.carPriceEl) {
            this.carPriceEl.textContent = isOwned ? (isSelected ? 'EQUIPPED' : 'OWNED') : `$${car.price.toLocaleString()}`;
            this.carPriceEl.className = isSelected ? 'status-equipped' : (isOwned ? 'status-owned' : 'status-price');
        }

        // Action button states
        if (this.garageActionBtn) {
            if (isSelected) {
                this.garageActionBtn.textContent = 'SELECTED';
                this.garageActionBtn.className = 'btn-arcade btn-disabled';
                this.garageActionBtn.disabled = true;
            } else if (isOwned) {
                this.garageActionBtn.textContent = 'SELECT CAR';
                this.garageActionBtn.className = 'btn-arcade btn-primary';
                this.garageActionBtn.disabled = false;
            } else {
                if (userCash >= car.price) {
                    this.garageActionBtn.textContent = `BUY CAR ($${car.price.toLocaleString()})`;
                    this.garageActionBtn.className = 'btn-arcade btn-buy';
                    this.garageActionBtn.disabled = false;
                } else {
                    const missing = car.price - userCash;
                    this.garageActionBtn.textContent = `NEED $${missing.toLocaleString()} MORE`;
                    this.garageActionBtn.className = 'btn-arcade btn-disabled';
                    this.garageActionBtn.disabled = true;
                }
            }
        }
    }

    handleGarageAction() {
        const carId = this.carKeys[this.currentGarageCarIndex];
        const car = CAR_MODELS[carId];
        const isOwned = storage.isCarOwned(carId);

        if (isOwned) {
            storage.setSelectedCar(carId);
            this.game.player.setCarModel(carId);
            audio.playCashChime();
            this.updateGarageView();
        } else {
            if (storage.unlockCar(carId, car.price)) {
                this.game.player.setCarModel(carId);
                audio.playCashChime();
                this.updateGarageView();
            }
        }
    }

    renderGarageTurntable(dt) {
        if (!this.garageCtx || this.game.state !== 'GARAGE') return;

        const ctx = this.garageCtx;
        const w = this.garageCanvas.width;
        const h = this.garageCanvas.height;

        this.turntableAngle += dt * 1.2;

        ctx.clearRect(0, 0, w, h);

        // Turntable platform
        ctx.save();
        ctx.translate(w / 2, h / 2 + 30);

        // Circular pedestal shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(0, 10, 110, 50, 0, 0, Math.PI * 2);
        ctx.fill();

        // Neon rim pedestal
        const grad = ctx.createLinearGradient(-100, 0, 100, 0);
        grad.addColorStop(0, '#1a2332');
        grad.addColorStop(0.5, '#2c3e50');
        grad.addColorStop(1, '#1a2332');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(0, 0, 105, 45, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 15;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Render rotating car model
        const carId = this.carKeys[this.currentGarageCarIndex];
        const model = CAR_MODELS[carId];

        ctx.rotate(this.turntableAngle);

        // Shadow under car
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.roundRect(-model.length / 2 + 4, -model.width / 2 + 5, model.length, model.width, 6);
        ctx.fill();

        // Temporary draw car on turntable
        this.game.player.carId = model.id;
        this.game.player.model = model;
        this.game.player.width = model.width;
        this.game.player.length = model.length;
        this.game.player.drawCar(ctx);

        ctx.restore();
    }

    updateHud(player, policeManager, abilityManager, score, combo, runCash) {
        if (this.hudCashEl) this.hudCashEl.textContent = `$${runCash.toLocaleString()}`;
        if (this.hudScoreEl) this.hudScoreEl.textContent = Math.floor(score).toLocaleString();

        // Speedometer
        if (this.hudSpeedEl && player) {
            const mph = Math.floor(Math.abs(player.speed) * 0.28);
            this.hudSpeedEl.textContent = `${mph} MPH`;
        }

        // Health Bar
        if (this.hudHealthFillEl && player) {
            const pct = Math.max(0, Math.min(100, (player.health / player.maxHealth) * 100));
            this.hudHealthFillEl.style.width = `${pct}%`;
            if (pct < 28) this.hudHealthFillEl.style.backgroundColor = '#e74c3c';
            else if (pct < 60) this.hudHealthFillEl.style.backgroundColor = '#f39c12';
            else this.hudHealthFillEl.style.backgroundColor = '#2ecc71';
        }

        // Combo indicator
        if (this.hudComboEl && this.hudComboTextEl) {
            if (combo > 1) {
                this.hudComboEl.classList.remove('hidden');
                this.hudComboTextEl.textContent = `x${combo} COMBO!`;
            } else {
                this.hudComboEl.classList.add('hidden');
            }
        }

        // Heat Stars (1 to 5)
        if (this.hudHeatStarsEl && policeManager) {
            let starsHtml = '';
            for (let i = 1; i <= 5; i++) {
                if (i <= policeManager.heatLevel) {
                    starsHtml += '<span class="star-active">★</span>';
                } else {
                    starsHtml += '<span class="star-inactive">☆</span>';
                }
            }
            this.hudHeatStarsEl.innerHTML = starsHtml;
        }

        // Ability cooldown buttons
        this.updateAbilityButton(this.btnTank, abilityManager.abilities.tank);
        this.updateAbilityButton(this.btnOil, abilityManager.abilities.oil);
        this.updateAbilityButton(this.btnEmp, abilityManager.abilities.emp);
    }

    updateAbilityButton(btnEl, ability) {
        if (!btnEl || !ability) return;
        const cdOverlay = btnEl.querySelector('.cd-overlay');
        const cdText = btnEl.querySelector('.cd-text');

        if (ability.active) {
            btnEl.classList.add('active');
            btnEl.classList.remove('ready');
            if (cdOverlay) cdOverlay.style.height = '0%';
            if (cdText) cdText.textContent = 'ACTIVE';
        } else if (ability.timer > 0) {
            btnEl.classList.remove('active');
            btnEl.classList.remove('ready');
            const pct = (ability.timer / ability.cooldown) * 100;
            if (cdOverlay) cdOverlay.style.height = `${pct}%`;
            if (cdText) cdText.textContent = `${Math.ceil(ability.timer)}s`;
        } else {
            btnEl.classList.remove('active');
            btnEl.classList.add('ready');
            if (cdOverlay) cdOverlay.style.height = '0%';
            if (cdText) cdText.textContent = 'READY';
        }
    }

    showGameOver(stats) {
        this.gameplayHud.classList.add('hidden');
        this.gameOverScreen.classList.remove('hidden');

        document.getElementById('go-final-score').textContent = Math.floor(stats.score).toLocaleString();
        document.getElementById('go-run-cash').textContent = `+$${stats.runCash.toLocaleString()}`;
        document.getElementById('go-smashed-count').textContent = stats.smashedCount;
        document.getElementById('go-cops-wrecked').textContent = stats.copsWrecked;
        document.getElementById('go-best-score').textContent = stats.highScore.toLocaleString();

        const badge = document.getElementById('go-new-record-badge');
        if (badge) {
            if (stats.isNewHighScore) badge.classList.remove('hidden');
            else badge.classList.add('hidden');
        }

        audio.playGameOver();
        this.game.state = 'GAMEOVER';
    }

    hideAllScreens() {
        this.mainMenu?.classList.add('hidden');
        this.mapSelectScreen?.classList.add('hidden');
        this.garageScreen?.classList.add('hidden');
        this.gameplayHud?.classList.add('hidden');
        this.pauseModal?.classList.add('hidden');
        this.gameOverScreen?.classList.add('hidden');
    }
}
