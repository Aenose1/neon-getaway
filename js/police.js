// police.js - Escalating police pursuit system, AI interception, sirens, and wreckage handling
import { audio } from './audio.js';

export class PoliceCar {
    constructor(type = 'cruiser', x = 0, y = 0, angle = 0) {
        this.type = type; // 'cruiser' or 'enforcer'
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = 100;
        this.vx = 0;
        this.vy = 0;

        if (this.type === 'enforcer') {
            this.maxSpeed = 390;
            this.accel = 380;
            this.turnRate = 2.8;
            this.health = 140;
            this.maxHealth = 140;
            this.width = 36;
            this.length = 62;
            this.armor = 1.6;
        } else {
            // Standard patrol cruiser
            this.maxSpeed = 430;
            this.accel = 460;
            this.turnRate = 3.6;
            this.health = 80;
            this.maxHealth = 80;
            this.width = 32;
            this.length = 56;
            this.armor = 1.0;
        }

        this.radius = Math.hypot(this.width, this.length) / 2.3;
        this.isWrecked = false;
        this.isStunned = false;
        this.stunTimer = 0;
        this.isSpinning = false;
        this.spinTimer = 0;

        // Visual siren timer
        this.sirenTimer = Math.random() * Math.PI;
    }

    applyStun(duration = 4.0) {
        this.isStunned = true;
        this.stunTimer = duration;
        this.speed *= 0.2;
    }

    applySpinout(duration = 2.5) {
        this.isSpinning = true;
        this.spinTimer = duration;
        this.speed *= 0.4;
    }

    takeDamage(amount) {
        const eff = amount / this.armor;
        this.health -= eff;
        if (this.health <= 0) {
            this.isWrecked = true;
        }
        return this.isWrecked;
    }

    update(player, map, particleManager, dt) {
        if (this.isWrecked) return;

        this.sirenTimer += dt * 10;

        // 1. EMP Stun effect
        if (this.isStunned) {
            this.stunTimer -= dt;
            this.speed *= Math.max(0, 1 - 3 * dt);
            this.x += Math.cos(this.angle) * this.speed * dt;
            this.y += Math.sin(this.angle) * this.speed * dt;

            // Electric sparks zapping on stunned car
            if (Math.random() < 0.4 && particleManager) {
                particleManager.particles.push({
                    x: this.x + (Math.random() - 0.5) * this.width,
                    y: this.y + (Math.random() - 0.5) * this.length,
                    vx: (Math.random() - 0.5) * 40,
                    vy: (Math.random() - 0.5) * 40,
                    size: 3,
                    growRate: -1,
                    life: 0.6,
                    decay: 2.5,
                    color: '#00e5ff',
                    type: 'spark'
                });
            }

            if (this.stunTimer <= 0) {
                this.isStunned = false;
            }
            return;
        }

        // 2. Oil Slick Spinout effect
        if (this.isSpinning) {
            this.spinTimer -= dt;
            this.angle += 14 * dt; // Rapid 360 spin
            this.speed *= Math.max(0, 1 - 1.5 * dt);
            this.x += Math.cos(this.angle) * this.speed * dt;
            this.y += Math.sin(this.angle) * this.speed * dt;

            // Skid smoke during spin
            if (particleManager && Math.random() < 0.4) {
                particleManager.spawnTirePuff(this.x, this.y, this.angle, 'smoke');
            }

            if (this.spinTimer <= 0) {
                this.isSpinning = false;
            }
            return;
        }

        // 3. AI Navigation & Interception
        if (!player) return;

        // Target position: player location + lead vector
        const leadDist = Math.min(180, player.speed * 0.4);
        const targetX = player.x + Math.cos(player.angle) * leadDist;
        const targetY = player.y + Math.sin(player.angle) * leadDist;

        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.hypot(dx, dy);

        let desiredAngle = Math.atan2(dy, dx);

        // Building obstacle avoidance
        if (map && map.buildings) {
            for (let i = 0; i < map.buildings.length; i++) {
                const b = map.buildings[i];
                const bdx = b.x - this.x;
                const bdy = b.y - this.y;
                const bdist = Math.hypot(bdx, bdy);
                if (bdist < 150) {
                    const awayAngle = Math.atan2(this.y - b.y, this.x - b.x);
                    desiredAngle = awayAngle;
                    break;
                }
            }
        }

        // Turn towards target angle smoothly
        let angleDiff = desiredAngle - this.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        const maxTurn = this.turnRate * dt;
        const turnStep = Math.max(-maxTurn, Math.min(maxTurn, angleDiff));
        this.angle += turnStep;

        // Acceleration
        if (this.speed < this.maxSpeed) {
            this.speed = Math.min(this.maxSpeed, this.speed + this.accel * dt);
        }

        // Movement
        this.vx = Math.cos(this.angle) * this.speed;
        this.vy = Math.sin(this.angle) * this.speed;

        this.x += this.vx * dt;
        this.y += this.vy * dt;
    }

    draw(ctx) {
        if (this.isWrecked) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        const w = this.width;
        const l = this.length;
        const halfW = w / 2;
        const halfL = l / 2;

        // 1. Drop Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
        ctx.beginPath();
        ctx.roundRect(-halfL + 5, -halfW + 6, l, w, 6);
        ctx.fill();

        // 2. Black rubber tires
        ctx.fillStyle = '#1e272e';
        ctx.fillRect(-halfL * 0.65 - 6, -halfW - 1, 12, 6);
        ctx.fillRect(-halfL * 0.65 - 6, halfW - 5, 12, 6);
        ctx.fillRect(halfL * 0.65 - 6, -halfW - 1, 12, 6);
        ctx.fillRect(halfL * 0.65 - 6, halfW - 5, 12, 6);

        // 3. Body Chassis
        if (this.type === 'enforcer') {
            // Heavy Black Tactical SUV
            ctx.fillStyle = '#1c2024';
            ctx.beginPath();
            ctx.roundRect(-halfL, -halfW, l, w, 4);
            ctx.fill();

            // Front Reinforced Ramming Bull-Bar
            ctx.fillStyle = '#4a5568';
            ctx.fillRect(halfL - 2, -halfW + 3, 5, w - 6);

            // Roof
            ctx.fillStyle = '#111417';
            ctx.fillRect(-halfL * 0.3, -halfW * 0.7, l * 0.55, w * 0.7);
        } else {
            // Classic Black & White Highway Cruiser
            ctx.fillStyle = '#111417';
            ctx.beginPath();
            ctx.roundRect(-halfL, -halfW, l, w, 6);
            ctx.fill();

            // White Roof & Doors
            ctx.fillStyle = '#ecf0f1';
            ctx.fillRect(-halfL * 0.4, -halfW + 2, l * 0.55, w - 4);
        }

        // 4. Tinted Cabin Windows
        ctx.fillStyle = '#1a252f';
        ctx.beginPath();
        ctx.roundRect(-halfL * 0.25, -halfW * 0.65, l * 0.45, w * 0.65, 3);
        ctx.fill();

        // 5. Flashing Police Siren Bar
        const sirenState = Math.sin(this.sirenTimer) > 0;
        const leftColor = sirenState ? '#e74c3c' : '#2980b9';
        const rightColor = sirenState ? '#2980b9' : '#e74c3c';

        // Siren Light bar casing
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(-4, -halfW * 0.5, 8, w * 0.5);

        // Red & Blue flashing lights with soft glow
        ctx.fillStyle = leftColor;
        ctx.shadowColor = leftColor;
        ctx.shadowBlur = 12;
        ctx.fillRect(-3, -halfW * 0.5, 6, w * 0.22);

        ctx.fillStyle = rightColor;
        ctx.shadowColor = rightColor;
        ctx.fillRect(-3, -halfW * 0.2, 6, w * 0.22);
        ctx.shadowBlur = 0;

        // Headlights & Tail lights
        ctx.fillStyle = '#f5cd79';
        ctx.fillRect(halfL - 1, -halfW + 2, 2, 4);
        ctx.fillRect(halfL - 1, halfW - 6, 2, 4);

        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(-halfL - 1, -halfW + 2, 2, 4);
        ctx.fillRect(-halfL - 1, halfW - 6, 2, 4);

        ctx.restore();
    }
}

export class PoliceManager {
    constructor() {
        this.policeCars = [];
        this.heatLevel = 1; // 1 to 5 stars
        this.heatProgress = 0; // 0 to 100%
        this.spawnTimer = 0;
        this.totalWrecked = 0;
    }

    reset() {
        this.policeCars = [];
        this.heatLevel = 1;
        this.heatProgress = 0;
        this.spawnTimer = 0;
        this.totalWrecked = 0;
        audio.setSiren(false);
    }

    addHeat(amount) {
        this.heatProgress += amount;
        if (this.heatProgress >= 100) {
            if (this.heatLevel < 5) {
                this.heatLevel++;
                this.heatProgress = 0;
            } else {
                this.heatProgress = 100;
            }
        }
    }

    update(player, map, particleManager, dt) {
        // Natural heat buildup over time survived
        this.addHeat(0.8 * dt);

        // Desired active police count based on heat level
        // Heat 1: 1-2, Heat 2: 2-3, Heat 3: 3-4, Heat 4: 4-5, Heat 5: 5-6
        const maxPolice = Math.min(6, this.heatLevel + 1);

        // Spawn timer
        this.spawnTimer += dt;
        const spawnInterval = Math.max(3.0, 7.5 - this.heatLevel);

        if (this.policeCars.length < maxPolice && this.spawnTimer > spawnInterval) {
            this.spawnTimer = 0;
            this.spawnPoliceCar(player, map);
        }

        // Update active police cars
        let nearbyCount = 0;
        for (let i = this.policeCars.length - 1; i >= 0; i--) {
            const cop = this.policeCars[i];

            cop.update(player, map, particleManager, dt);

            // Distance to player
            const dist = Math.hypot(cop.x - player.x, cop.y - player.y);
            if (dist < 800) nearbyCount++;

            // Despawn if fallen too far behind (>1600px)
            if (dist > 1800) {
                this.policeCars.splice(i, 1);
                continue;
            }

            // Remove wrecked
            if (cop.isWrecked) {
                this.totalWrecked++;
                if (particleManager) {
                    particleManager.spawnExplosion(cop.x, cop.y);
                    particleManager.addFloatingText('+$500 COP WRECKED!', cop.x, cop.y, '#e74c3c', 22, true);
                }
                audio.playPoliceWreck();
                this.policeCars.splice(i, 1);
            }
        }

        // Dynamic Siren audio based on pursuit proximity
        audio.setSiren(nearbyCount > 0);
    }

    spawnPoliceCar(player, map) {
        if (!player) return;

        // Spawn off-screen ahead or behind along player's travel vector
        const spawnDistance = 850;
        const angleSpread = (Math.random() - 0.5) * 1.2;
        const spawnAngle = player.angle + (Math.random() > 0.4 ? 0 : Math.PI) + angleSpread;

        let spawnX = player.x + Math.cos(spawnAngle) * spawnDistance;
        let spawnY = player.y + Math.sin(spawnAngle) * spawnDistance;

        // Keep inside world bounds
        const worldW = map ? map.width : 4000;
        const worldH = map ? map.height : 4000;
        spawnX = Math.max(200, Math.min(worldW - 200, spawnX));
        spawnY = Math.max(200, Math.min(worldH - 200, spawnY));

        // Enforcer SUV spawns at Heat 3+
        const isEnforcer = this.heatLevel >= 3 && Math.random() < 0.45;
        const copType = isEnforcer ? 'enforcer' : 'cruiser';

        const cop = new PoliceCar(copType, spawnX, spawnY, spawnAngle + Math.PI);
        this.policeCars.push(cop);
    }

    draw(ctx, camera) {
        for (let i = 0; i < this.policeCars.length; i++) {
            const cop = this.policeCars[i];
            if (camera.isVisible(cop.x, cop.y, 80)) {
                cop.draw(ctx);
            }
        }
    }
}
