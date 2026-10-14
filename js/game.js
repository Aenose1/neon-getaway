// game.js - Master game loop, state management, collision coordinator, and entry point
import { storage } from './storage.js';
import { audio } from './audio.js';
import { Camera } from './camera.js';
import { PlayerCar, CAR_MODELS } from './car.js';
import { GameMap, MAP_CONFIGS } from './map.js';
import { PoliceManager } from './police.js';
import { AbilityManager } from './abilities.js';
import { ParticleManager } from './particles.js';
import { InputManager } from './input.js';
import { UIManager } from './ui.js';

export class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        this.state = 'MENU'; // 'MENU' | 'MAP_SELECT' | 'GARAGE' | 'PLAYING' | 'PAUSED' | 'GAMEOVER'
        this.lastTime = performance.now();

        // Run metrics
        this.score = 0;
        this.runCash = 0;
        this.smashedCount = 0;
        this.combo = 1;
        this.comboTimer = 0;
        this.gameOverTimer = 0;

        // Subsystems
        this.map = new GameMap(storage.getSelectedMap());
        this.player = new PlayerCar(storage.getSelectedCar(), this.map.config.spawnX, this.map.config.spawnY);
        this.camera = new Camera(window.innerWidth, window.innerHeight, this.map.width, this.map.height);
        this.particles = new ParticleManager();
        this.police = new PoliceManager();
        this.abilities = new AbilityManager();
        this.input = new InputManager(this.canvas);
        this.ui = new UIManager(this);

        this.initWindow();
        this.ui.showMainMenu();

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
            this.input.updateMobileLayout();
        };

        window.addEventListener('resize', resize);
        resize();
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

        this.score = 0;
        this.runCash = 0;
        this.smashedCount = 0;
        this.combo = 1;
        this.comboTimer = 0;
        this.gameOverTimer = 0;

        audio.ensureContext();
        audio.startEngine();

        this.state = 'PLAYING';
    }

    togglePause() {
        if (this.state === 'PLAYING') {
            this.state = 'PAUSED';
            this.ui.pauseModal.classList.remove('hidden');
            audio.stopEngine();
            audio.setSiren(false);
        } else if (this.state === 'PAUSED') {
            this.state = 'PLAYING';
            this.ui.pauseModal.classList.add('hidden');
            audio.startEngine();
        }
    }

    endRunToMenu() {
        this.state = 'MENU';
        audio.stopEngine();
        audio.setSiren(false);
        this.ui.showMainMenu();
    }

    triggerAbility(id) {
        if (this.state !== 'PLAYING') return;
        this.abilities.triggerAbility(id, this.player, this.police, this.particles);
    }

    loop(currentTime) {
        const dt = Math.min((currentTime - this.lastTime) / 1000, 0.05); // Clamp dt to prevent spiral
        this.lastTime = currentTime;

        this.update(dt);
        this.render(dt);

        requestAnimationFrame((t) => this.loop(t));
    }

    update(dt) {
        // Garage rotating model update
        if (this.state === 'GARAGE') {
            this.ui.renderGarageTurntable(dt);
            return;
        }

        if (this.state !== 'PLAYING') return;

        // Check pause hotkey
        if (this.input.pauseTriggered) {
            this.input.pauseTriggered = false;
            this.togglePause();
            return;
        }

        // Check ability hotkeys
        if (this.input.abilityTriggered) {
            this.triggerAbility(this.input.abilityTriggered);
            this.input.abilityTriggered = null;
        }

        // Update Combo timer
        if (this.combo > 1) {
            this.comboTimer -= dt;
            if (this.comboTimer <= 0) {
                this.combo = 1;
            }
        }

        // Natural score progression for getaway survival
        this.score += Math.abs(this.player.speed) * 0.15 * dt * this.combo;

        // Subsystem updates
        this.input.update(this.player, this.camera);
        this.player.update(this.input, this.map, this.particles, dt);
        this.camera.update(this.player, dt);
        this.police.update(this.player, this.map, this.particles, dt);
        this.abilities.update(this.player, this.police, this.particles, dt);
        this.particles.update(dt);

        // Check Collisions
        this.handleCollisions();

        // Update HUD
        this.ui.updateHud(
            this.player,
            this.police,
            this.abilities,
            this.score,
            this.combo,
            this.runCash
        );

        // Player Wrecked / Game Over handling
        if (this.player.isWrecked) {
            this.gameOverTimer += dt;
            if (this.gameOverTimer === dt) {
                // Initial wreck explosion
                this.particles.spawnExplosion(this.player.x, this.player.y);
                this.camera.shake(20);
                audio.playPoliceWreck();
                audio.stopEngine();
                audio.setSiren(false);
            }

            if (this.gameOverTimer >= 1.6) {
                // Finalize run
                storage.addCash(this.runCash);
                const isNewHighScore = storage.updateHighScore(this.score);
                storage.recordRunEnd(this.smashedCount, this.police.totalWrecked);

                this.ui.showGameOver({
                    score: this.score,
                    runCash: this.runCash,
                    smashedCount: this.smashedCount,
                    copsWrecked: this.police.totalWrecked,
                    highScore: storage.getHighScore(),
                    isNewHighScore
                });
            }
        }
    }

    handleCollisions() {
        if (this.player.isWrecked) return;

        // 1. Player vs Destructibles (Using spatial grid for O(1) performance)
        const nearby = this.map.getNearbyDestructibles(this.player.x, this.player.y, 120);
        for (let i = 0; i < nearby.length; i++) {
            const d = nearby[i];
            if (d.destroyed) continue;

            const dist = Math.hypot(this.player.x - d.x, this.player.y - d.y);
            if (dist < this.player.radius + d.radius) {
                // Smash!
                d.destroyed = true;
                this.smashedCount++;

                // Increase Combo
                this.combo = Math.min(10, this.combo + 1);
                this.comboTimer = 2.4; // 2.4 second window to keep combo alive

                // Calculate cash & score rewards with combo bonus
                const cashGain = Math.floor(d.cashReward * (1 + (this.combo - 1) * 0.4));
                const scoreGain = Math.floor(d.scoreReward * this.combo);

                this.runCash += cashGain;
                this.score += scoreGain;

                // Visual & Audio feedback
                audio.playSmash(d.type);
                audio.playCashChime();
                this.camera.shake(this.player.isTank ? 9 : 5);
                this.particles.spawnDebris(d.x, d.y, d.type, this.player.isTank ? 18 : 12);
                this.particles.addFloatingText(`+$${cashGain}`, d.x, d.y, '#f1c40f', 18 + Math.min(10, this.combo * 2));

                if (this.combo >= 3) {
                    this.particles.addFloatingText(`x${this.combo} SMASH!`, this.player.x, this.player.y - 25, '#ff4757', 20, true);
                }

                // Increase chase heat
                this.police.addHeat(2.5);

                // Tank ploughs through without any slowdown; regular cars take minor speed tap
                if (!this.player.isTank && this.player.carId !== 'muscle') {
                    this.player.speed *= 0.94;
                }
            }
        }

        // 2. Player vs Static Unbreakable Buildings
        for (let i = 0; i < this.map.buildings.length; i++) {
            const b = this.map.buildings[i];
            const halfW = b.halfW + this.player.radius;
            const halfH = b.halfH + this.player.radius;

            const dx = this.player.x - b.x;
            const dy = this.player.y - b.y;

            if (Math.abs(dx) < halfW && Math.abs(dy) < halfH) {
                // Collision with building! Resolve bounce
                const overlapX = halfW - Math.abs(dx);
                const overlapY = halfH - Math.abs(dy);

                if (overlapX < overlapY) {
                    this.player.x += Math.sign(dx) * overlapX;
                } else {
                    this.player.y += Math.sign(dy) * overlapY;
                }

                // Bounce response
                this.player.speed *= -0.4;
                audio.playHit();
                this.camera.shake(12);
                this.particles.spawnSparks(this.player.x, this.player.y, 14);
                this.player.takeDamage(12);
            }
        }

        // 3. Player vs Police Cars
        for (let i = 0; i < this.police.policeCars.length; i++) {
            const cop = this.police.policeCars[i];
            if (cop.isWrecked) continue;

            const dx = cop.x - this.player.x;
            const dy = cop.y - this.player.y;
            const dist = Math.hypot(dx, dy);
            const minDist = this.player.radius + cop.radius;

            if (dist < minDist && dist > 0) {
                const normX = dx / dist;
                const normY = dy / dist;

                if (this.player.isTank) {
                    // TITAN TANK DESTROYS COP INSTANTLY!
                    cop.takeDamage(999);
                    this.runCash += 500;
                    this.score += 2500;
                    this.camera.shake(18);
                    this.particles.spawnExplosion(cop.x, cop.y);
                    this.particles.addFloatingText('COP TANK-CRUSHED! +$500', cop.x, cop.y, '#2ecc71', 22, true);
                    audio.playPoliceWreck();
                } else {
                    // Mutual vehicle bump physics
                    const relSpeed = Math.abs(this.player.speed - cop.speed);
                    const pushDist = (minDist - dist) / 2;

                    this.player.x -= normX * pushDist;
                    this.player.y -= normY * pushDist;
                    cop.x += normX * pushDist;
                    cop.y += normY * pushDist;

                    // Ramming damage
                    const ramMultiplier = this.player.carId === 'muscle' ? 2.2 : 1.0;
                    const damageToCop = Math.max(15, (relSpeed * 0.12) * ramMultiplier);
                    const damageToPlayer = Math.max(6, relSpeed * 0.06);

                    cop.takeDamage(damageToCop);
                    this.player.takeDamage(damageToPlayer);

                    if (cop.isWrecked) {
                        this.runCash += 500;
                        this.score += 2000;
                    }

                    audio.playHit();
                    this.camera.shake(8);
                    this.particles.spawnSparks((this.player.x + cop.x) / 2, (this.player.y + cop.y) / 2, 10);
                }
            }
        }

        // 4. Police vs Buildings
        for (let i = 0; i < this.police.policeCars.length; i++) {
            const cop = this.police.policeCars[i];
            if (cop.isWrecked) continue;

            for (let j = 0; j < this.map.buildings.length; j++) {
                const b = this.map.buildings[j];
                const halfW = b.halfW + cop.radius;
                const halfH = b.halfH + cop.radius;
                const dx = cop.x - b.x;
                const dy = cop.y - b.y;

                if (Math.abs(dx) < halfW && Math.abs(dy) < halfH) {
                    const overlapX = halfW - Math.abs(dx);
                    const overlapY = halfH - Math.abs(dy);
                    if (overlapX < overlapY) {
                        cop.x += Math.sign(dx) * overlapX;
                    } else {
                        cop.y += Math.sign(dy) * overlapY;
                    }
                    cop.speed *= -0.3;
                    cop.takeDamage(20);
                }
            }
        }
    }

    render(dt) {
        if (this.state !== 'PLAYING' && this.state !== 'PAUSED') {
            // Render background atmospheric movement for main menu
            this.renderMenuBackground(dt);
            return;
        }

        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 1. Apply 2.5D Camera Transformation
        this.camera.apply(ctx);

        // 2. Render Ground & Terrain
        this.map.draw(ctx, this.camera);

        // 3. Render Skid Marks Buffer
        this.particles.drawSkids(ctx, this.camera);

        // 4. Render Oil Slicks
        this.abilities.draw(ctx, this.camera);

        // 5. Render Police Pursuit Vehicles
        this.police.draw(ctx, this.camera);

        // 6. Render Player Vehicle (with 2.5D shadow, turning wheels, headlights)
        this.player.draw(ctx);

        // 7. Render Particle Effects (flying debris, smoke, sparks, weather flakes)
        this.particles.drawWorldParticles(ctx, this.camera);

        // 8. Render Floating Cash & Combo arcade popups
        this.particles.drawFloatingTexts(ctx, this.camera);

        // 9. Restore Camera Matrix
        this.camera.restore(ctx);

        // 10. Ambient environmental seasonal lighting overlay
        ctx.save();
        ctx.fillStyle = this.map.config.ambientColor;
        ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

        // 11. Render Mobile Touch Steering Control (ONLY on mobile touch devices)
        this.input.drawMobileControls(ctx);

        ctx.restore();
    }

    renderMenuBackground(dt) {
        if (!this.ctx) return;
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Gentle camera drift across map for title background
        this.camera.x = 2100 + Math.sin(performance.now() * 0.0003) * 350;
        this.camera.y = 2100 + Math.cos(performance.now() * 0.0003) * 350;

        this.camera.apply(ctx);
        this.map.draw(ctx, this.camera);
        this.camera.restore(ctx);

        // Dark vignette over title screen
        ctx.save();
        ctx.fillStyle = 'rgba(10, 16, 26, 0.72)';
        ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
        ctx.restore();
    }
}

// Instantiate game on load
window.addEventListener('DOMContentLoaded', () => {
    window.gameInstance = new Game();
});
