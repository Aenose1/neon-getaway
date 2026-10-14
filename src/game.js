// src/game.js - Master game coordinator, state machine, and update/render loops
import { CONFIG } from './config.js';
import { storage } from './storage.js';
import { audio } from './audio.js';
import { Camera } from './camera.js';
import { PlayerCar } from './player.js';
import { GameMap } from './maps.js';
import { PoliceManager } from './police.js';
import { AbilityManager } from './abilities.js';
import { ParticleManager } from './particles.js';
import { RecoveryManager } from './recovery.js';
import { ScoringManager } from './scoring.js';
import { CollisionEngine } from './collisions.js';
import { ControlsManager } from './controls.js';
import { GarageManager } from './garage.js';

export class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        this.state = 'MENU';
        this.lastTime = performance.now();
        this.gameOverTimer = 0;

        // Subsystems
        this.map = new GameMap(storage.getSelectedMap());
        this.player = new PlayerCar(storage.getSelectedCar(), this.map.config.spawnX, this.map.config.spawnY);
        this.camera = new Camera(window.innerWidth, window.innerHeight, this.map.width, this.map.height);
        this.particles = new ParticleManager();
        this.police = new PoliceManager();
        this.abilities = new AbilityManager();
        this.recovery = new RecoveryManager();
        this.scoring = new ScoringManager();
        this.collisions = new CollisionEngine();
        this.controls = new ControlsManager(this.canvas);
        this.garage = new GarageManager(this);

        this.initWindow();
        this.initDOM();

        // Start animation loop
        requestAnimationFrame((t) => this.loop(t));
    }

    initWindow() {
        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            this.canvas.width = window.innerWidth * dpr;
            this.canvas.height = window.innerHeight * dpr;
            this.ctx.resetTransform();
            this.ctx.scale(dpr, dpr);
            this.camera.resize(window.innerWidth, window.innerHeight);
            this.controls.updateMobileLayout();
        };

        window.addEventListener('resize', resize);
        resize();
    }

    initDOM() {
        // UI Screens
        this.mainMenuEl = document.getElementById('main-menu');
        this.mapSelectEl = document.getElementById('map-select-screen');
        this.hudEl = document.getElementById('gameplay-hud');
        this.pauseModalEl = document.getElementById('pause-modal');
        this.gameOverEl = document.getElementById('game-over-screen');
        this.storyModalEl = document.getElementById('story-modal');

        // HUD Elements
        this.hudCashEl = document.getElementById('hud-cash');
        this.hudScoreEl = document.getElementById('hud-score');
        this.hudComboEl = document.getElementById('hud-combo');
        this.hudComboTextEl = document.getElementById('hud-combo-text');
        this.hudHeatStarsEl = document.getElementById('hud-heat-stars');
        this.hudHealthFillEl = document.getElementById('hud-health-fill');
        this.hudHealthPctEl = document.getElementById('hud-health-pct');
        this.hudSpeedEl = document.getElementById('hud-speed');
        this.hudNotificationEl = document.getElementById('hud-notification-banner');

        // Ability Buttons in HUD
        this.btnTank = document.getElementById('btn-ability-tank');
        this.btnOil = document.getElementById('btn-ability-oil');
        this.btnEmp = document.getElementById('btn-ability-emp');

        this.bindEvents();
        this.showMainMenu();
    }

    bindEvents() {
        // Main Menu
        document.getElementById('btn-play')?.addEventListener('click', () => {
            audio.ensureContext();
            this.showMapSelect();
        });

        document.getElementById('btn-garage')?.addEventListener('click', () => {
            audio.ensureContext();
            this.showGarage();
        });

        document.getElementById('btn-story')?.addEventListener('click', () => {
            this.storyModalEl.classList.remove('hidden');
        });

        document.getElementById('btn-close-story')?.addEventListener('click', () => {
            this.storyModalEl.classList.add('hidden');
        });

        document.getElementById('btn-sound-toggle')?.addEventListener('click', () => {
            audio.ensureContext();
            audio.toggleSound();
            this.updateSoundIcons();
        });

        // Map Selection
        document.querySelectorAll('.map-card').forEach((card) => {
            card.addEventListener('click', () => {
                const mapIdx = parseInt(card.dataset.mapIndex, 10);
                this.selectMapAndStart(mapIdx);
            });
        });

        document.getElementById('btn-map-back')?.addEventListener('click', () => {
            this.showMainMenu();
        });

        document.getElementById('btn-garage-back')?.addEventListener('click', () => {
            this.showMainMenu();
        });

        // Pause Modal
        document.getElementById('btn-pause-hud')?.addEventListener('click', () => {
            this.togglePause();
        });

        document.getElementById('btn-resume')?.addEventListener('click', () => {
            this.togglePause();
        });

        document.getElementById('btn-restart-pause')?.addEventListener('click', () => {
            this.pauseModalEl.classList.add('hidden');
            this.startRun();
        });

        document.getElementById('btn-menu-pause')?.addEventListener('click', () => {
            this.pauseModalEl.classList.add('hidden');
            this.endRunToMenu();
        });

        // Game Over
        document.getElementById('btn-gameover-restart')?.addEventListener('click', () => {
            this.gameOverEl.classList.add('hidden');
            this.startRun();
        });

        document.getElementById('btn-gameover-garage')?.addEventListener('click', () => {
            this.gameOverEl.classList.add('hidden');
            this.showGarage();
        });

        document.getElementById('btn-gameover-menu')?.addEventListener('click', () => {
            this.gameOverEl.classList.add('hidden');
            this.showMainMenu();
        });

        // Ability Click/Touch Triggers
        this.btnTank?.addEventListener('click', () => this.triggerAbility('tank'));
        this.btnOil?.addEventListener('click', () => this.triggerAbility('oil'));
        this.btnEmp?.addEventListener('click', () => this.triggerAbility('emp'));
    }

    updateSoundIcons() {
        const isEnabled = audio.enabled;
        document.querySelectorAll('.sound-state-icon').forEach((el) => {
            el.textContent = isEnabled ? '🔊' : '🔇';
        });
    }

    showMainMenu() {
        this.hideAllScreens();
        this.mainMenuEl.classList.remove('hidden');

        document.getElementById('menu-cash-display').textContent = `$${storage.getCash().toLocaleString()}`;
        document.getElementById('menu-highscore-display').textContent = storage.getHighScore().toLocaleString();

        this.player.setCarModel(storage.getSelectedCar());
        this.state = 'MENU';
    }

    showMapSelect() {
        this.hideAllScreens();
        this.mapSelectEl.classList.remove('hidden');

        const currentMap = storage.getSelectedMap();
        document.querySelectorAll('.map-card').forEach((card) => {
            const idx = parseInt(card.dataset.mapIndex, 10);
            if (idx === currentMap) card.classList.add('selected');
            else card.classList.remove('selected');
        });

        this.state = 'MAP_SELECT';
    }

    showGarage() {
        this.hideAllScreens();
        this.garage.screenEl.classList.remove('hidden');
        this.garage.show();
        this.state = 'GARAGE';
    }

    selectMapAndStart(mapIndex) {
        storage.setSelectedMap(mapIndex);
        this.hideAllScreens();
        this.hudEl.classList.remove('hidden');
        this.startRun(mapIndex);
    }

    startRun(mapIndex = null) {
        if (mapIndex !== null) {
            this.map.setMapIndex(mapIndex);
        } else {
            this.map.setMapIndex(storage.getSelectedMap());
        }

        const selectedCarId = storage.getSelectedCar();
        this.player.setCarModel(selectedCarId);
        this.player.reset(this.map.config.spawnX, this.map.config.spawnY, -Math.PI / 2);

        this.camera.x = this.player.x;
        this.camera.y = this.player.y;
        this.camera.targetX = this.player.x;
        this.camera.targetY = this.player.y;

        this.particles.reset();
        this.particles.initWeather(this.map.config.weather, 140, this.map.width, this.map.height);
        this.police.reset();
        this.abilities.reset();
        this.recovery.reset();
        this.scoring.reset();

        this.gameOverTimer = 0;

        audio.ensureContext();
        audio.startEngine();

        this.state = 'PLAYING';
    }

    togglePause() {
        if (this.state === 'PLAYING') {
            this.state = 'PAUSED';
            this.pauseModalEl.classList.remove('hidden');
            audio.stopEngine();
            audio.setSiren(false);
        } else if (this.state === 'PAUSED') {
            this.state = 'PLAYING';
            this.pauseModalEl.classList.add('hidden');
            audio.startEngine();
        }
    }

    endRunToMenu() {
        this.state = 'MENU';
        audio.stopEngine();
        audio.setSiren(false);
        this.showMainMenu();
    }

    triggerAbility(id) {
        if (this.state !== 'PLAYING') return;

        const result = this.abilities.triggerAbility(id, this.player, this.police, this.particles);
        if (!result.success && result.reason) {
            // Visual feedback if player tries to use cooling-down ability
            this.particles.addFloatingText(result.reason, this.player.x, this.player.y - 25, '#ff4757', 16);
        }
    }

    loop(currentTime) {
        const dt = Math.min((currentTime - this.lastTime) / 1000, 0.05);
        this.lastTime = currentTime;

        this.update(dt);
        this.render(dt);

        requestAnimationFrame((t) => this.loop(t));
    }

    update(dt) {
        if (this.state === 'GARAGE') {
            this.garage.renderTurntable(dt);
            return;
        }

        if (this.state !== 'PLAYING') return;

        // Check Pause Hotkey
        if (this.controls.pauseTriggered) {
            this.controls.pauseTriggered = false;
            this.togglePause();
            return;
        }

        // Check Ability Hotkeys
        if (this.controls.abilityTriggered) {
            this.triggerAbility(this.controls.abilityTriggered);
            this.controls.abilityTriggered = null;
        }

        const isPlaying = (this.state === 'PLAYING');

        // 1. Controls & Player Updates
        this.controls.update(this.player, this.camera);
        this.player.update(this.controls, this.map, this.particles, this.recovery, dt);
        this.camera.update(this.player, dt);

        // 2. Subsystems (Police active timer only increments during active gameplay)
        this.police.update(this.player, this.map, this.particles, isPlaying, dt);
        this.abilities.update(this.player, this.police, this.particles, isPlaying, dt);
        this.scoring.update(this.player.speed, dt);
        this.particles.update(dt);

        // 3. Collision Resolution
        this.collisions.handleAll(
            this.player,
            this.map,
            this.police,
            this.abilities,
            this.particles,
            this.recovery,
            this.scoring,
            this.camera
        );

        // 4. Automatic Reverse Recovery System
        const isAttemptingMove = !this.controls.isBraking && (this.controls.isBoosting || Math.abs(this.player.speed) > 0 || !this.controls.isTouchDevice);
        this.recovery.update(this.player, this.collisions.isCollidingWithSolid, isAttemptingMove, dt);

        // 5. Update HUD (Health bar, Abilities with 150s cooldowns, Cash, Combo, Notifications)
        this.updateHud();

        // 6. Check Vehicle Health Zero / Game Over
        if (this.player.isWrecked) {
            this.gameOverTimer += dt;
            if (this.gameOverTimer === dt) {
                this.particles.spawnExplosion(this.player.x, this.player.y);
                this.camera.shake(20);
                audio.playPoliceWreck();
                audio.stopEngine();
                audio.setSiren(false);
            }

            if (this.gameOverTimer >= 1.6) {
                storage.addCash(this.scoring.runCash);
                const isNewHigh = storage.updateHighScore(this.scoring.score);
                storage.recordRunEnd(this.scoring.smashedCount, this.police.totalWrecked);

                this.showGameOver({
                    score: this.scoring.score,
                    runCash: this.scoring.runCash,
                    smashedCount: this.scoring.smashedCount,
                    copsWrecked: this.police.totalWrecked,
                    highScore: storage.getHighScore(),
                    isNewHigh
                });
            }
        }
    }

    updateHud() {
        if (this.hudCashEl) this.hudCashEl.textContent = `$${this.scoring.runCash.toLocaleString()}`;
        if (this.hudScoreEl) this.hudScoreEl.textContent = Math.floor(this.scoring.score).toLocaleString();

        // Speedometer
        if (this.hudSpeedEl) {
            const mph = Math.floor(Math.abs(this.player.speed) * 0.28);
            this.hudSpeedEl.textContent = `${mph} MPH`;
        }

        // CAR DAMAGE / VEHICLE HEALTH BAR
        const healthPct = this.player.damage.getHealthPercentage();
        const healthStatus = this.player.damage.getHealthStatus();

        if (this.hudHealthFillEl) {
            this.hudHealthFillEl.style.width = `${healthPct}%`;
            this.hudHealthFillEl.style.backgroundColor = healthStatus.color;
        }
        if (this.hudHealthPctEl) {
            this.hudHealthPctEl.textContent = `${healthPct}%`;
            this.hudHealthPctEl.style.color = healthStatus.color;
        }

        // Destruction Combo
        if (this.hudComboEl && this.hudComboTextEl) {
            if (this.scoring.combo > 1) {
                this.hudComboEl.classList.remove('hidden');
                this.hudComboTextEl.textContent = `x${this.scoring.combo} COMBO!`;
            } else {
                this.hudComboEl.classList.add('hidden');
            }
        }

        // Heat Stars
        if (this.hudHeatStarsEl) {
            let stars = '';
            for (let i = 1; i <= 5; i++) {
                if (i <= this.police.heatLevel) stars += '<span class="star-active">★</span>';
                else stars += '<span class="star-inactive">☆</span>';
            }
            this.hudHeatStarsEl.innerHTML = stars;
        }

        // Ability buttons with independent 150s cooldown display
        this.updateAbilityButton(this.btnTank, this.abilities.abilities.tank);
        this.updateAbilityButton(this.btnOil, this.abilities.abilities.oil);
        this.updateAbilityButton(this.btnEmp, this.abilities.abilities.emp);

        // Recovery / Police Escalation banner notifications
        const recoveryMsg = this.recovery.getMessage();
        const policeMsg = this.police.getAnnouncement();

        if (this.hudNotificationEl) {
            const activeMsg = recoveryMsg || policeMsg;
            if (activeMsg) {
                this.hudNotificationEl.textContent = activeMsg;
                this.hudNotificationEl.classList.remove('hidden');
            } else {
                this.hudNotificationEl.classList.add('hidden');
            }
        }
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

            // Format as MM:SS or seconds
            const mins = Math.floor(ability.timer / 60);
            const secs = Math.ceil(ability.timer % 60);
            if (cdText) {
                cdText.textContent = mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
            }
        } else {
            btnEl.classList.remove('active');
            btnEl.classList.add('ready');
            if (cdOverlay) cdOverlay.style.height = '0%';
            if (cdText) cdText.textContent = 'READY';
        }
    }

    showGameOver(stats) {
        this.hudEl.classList.add('hidden');
        this.gameOverEl.classList.remove('hidden');

        document.getElementById('go-final-score').textContent = Math.floor(stats.score).toLocaleString();
        document.getElementById('go-run-cash').textContent = `+$${stats.runCash.toLocaleString()}`;
        document.getElementById('go-smashed-count').textContent = stats.smashedCount;
        document.getElementById('go-cops-wrecked').textContent = stats.copsWrecked;
        document.getElementById('go-best-score').textContent = stats.highScore.toLocaleString();

        const badge = document.getElementById('go-new-record-badge');
        if (badge) {
            if (stats.isNewHigh) badge.classList.remove('hidden');
            else badge.classList.add('hidden');
        }

        audio.playGameOver();
        this.state = 'GAMEOVER';
    }

    hideAllScreens() {
        this.mainMenuEl?.classList.add('hidden');
        this.mapSelectEl?.classList.add('hidden');
        this.garage.screenEl?.classList.add('hidden');
        this.hudEl?.classList.add('hidden');
        this.pauseModalEl?.classList.add('hidden');
        this.gameOverEl?.classList.add('hidden');
    }

    render(dt) {
        if (this.state !== 'PLAYING' && this.state !== 'PAUSED') {
            this.renderMenuBackground(dt);
            return;
        }

        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 1. Camera matrix transform
        this.camera.apply(ctx);

        // 2. Terrain & roads
        this.map.draw(ctx, this.camera);

        // 3. Skid marks
        this.particles.drawSkids(ctx, this.camera);

        // 4. Oil slicks
        this.abilities.draw(ctx, this.camera);

        // 5. Police pursuit cars
        this.police.draw(ctx, this.camera);

        // 6. Player car
        this.player.draw(ctx);

        // 7. Debris, smoke, sparks, weather
        this.particles.drawWorldParticles(ctx, this.camera);

        // 8. Floating text
        this.particles.drawFloatingTexts(ctx, this.camera);

        // 9. Restore matrix
        this.camera.restore(ctx);

        // 10. Ambient lighting
        ctx.save();
        ctx.fillStyle = this.map.config.ambientColor;
        ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

        // 11. Mobile touch steering control
        this.controls.drawMobileControls(ctx);

        ctx.restore();
    }

    renderMenuBackground(dt) {
        if (!this.ctx) return;
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.camera.x = 2100 + Math.sin(performance.now() * 0.0003) * 350;
        this.camera.y = 2100 + Math.cos(performance.now() * 0.0003) * 350;

        this.camera.apply(ctx);
        this.map.draw(ctx, this.camera);
        this.camera.restore(ctx);

        ctx.save();
        ctx.fillStyle = 'rgba(10, 16, 26, 0.72)';
        ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
        ctx.restore();
    }
}
