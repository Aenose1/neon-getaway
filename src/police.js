// src/police.js - Blue standard & Black advanced pursuit vehicles with 10-minute time-based escalation
import { CONFIG } from './config.js';
import { audio } from './audio.js';

export class PoliceCar {
    constructor(type = 'blue', x = 0, y = 0, angle = 0) {
        this.type = type; // 'blue' (standard) or 'black' (advanced)
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = 120;
        this.vx = 0;
        this.vy = 0;

        if (this.type === 'black') {
            // Advanced Black Police Interceptor
            this.maxSpeed = 460;
            this.accel = 520;
            this.turnRate = 3.8;
            this.health = 160;
            this.maxHealth = 160;
            this.width = 36;
            this.length = 62;
            this.armor = 1.7;
        } else {
            // Standard Blue Police Patrol Cruiser
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

        // 1. EMP Stun
        if (this.isStunned) {
            this.stunTimer -= dt;
            this.speed *= Math.max(0, 1 - 3 * dt);
            this.x += Math.cos(this.angle) * this.speed * dt;
            this.y += Math.sin(this.angle) * this.speed * dt;

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

        // 2. Oil Slick Spinout
        if (this.isSpinning) {
            this.spinTimer -= dt;
            this.angle += 14 * dt;
            this.speed *= Math.max(0, 1 - 1.5 * dt);
            this.x += Math.cos(this.angle) * this.speed * dt;
            this.y += Math.sin(this.angle) * this.speed * dt;

            if (particleManager && Math.random() < 0.4) {
                particleManager.spawnTirePuff(this.x, this.y, this.angle, 'smoke');
            }

            if (this.spinTimer <= 0) {
                this.isSpinning = false;
            }
            return;
        }

        // 3. AI Interception
        if (!player) return;

        const leadDist = Math.min(200, player.speed * (this.type === 'black' ? 0.45 : 0.35));
        const targetX = player.x + Math.cos(player.angle) * leadDist;
        const targetY = player.y + Math.sin(player.angle) * leadDist;

        const dx = targetX - this.x;
        const dy = targetY - this.y;

        let desiredAngle = Math.atan2(dy, dx);

        // Building obstacle avoidance
        if (map && map.buildings) {
            for (let i = 0; i < map.buildings.length; i++) {
                const b = map.buildings[i];
                const bdx = b.x - this.x;
                const bdy = b.y - this.y;
                const bdist = Math.hypot(bdx, bdy);
                if (bdist < 150) {
                    desiredAngle = Math.atan2(this.y - b.y, this.x - b.x);
                    break;
                }
            }
        }

        let angleDiff = desiredAngle - this.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        const maxTurn = this.turnRate * dt;
        const turnStep = Math.max(-maxTurn, Math.min(maxTurn, angleDiff));
        this.angle += turnStep;

        if (this.speed < this.maxSpeed) {
            this.speed = Math.min(this.maxSpeed, this.speed + this.accel * dt);
        }

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

        // 2. Rubber Tires
        ctx.fillStyle = '#1e272e';
        ctx.fillRect(-halfL * 0.65 - 6, -halfW - 1, 12, 6);
        ctx.fillRect(-halfL * 0.65 - 6, halfW - 5, 12, 6);
        ctx.fillRect(halfL * 0.65 - 6, -halfW - 1, 12, 6);
        ctx.fillRect(halfL * 0.65 - 6, halfW - 5, 12, 6);

        // 3. Body Chassis
        if (this.type === 'black') {
            // Advanced Black Police Interceptor
            ctx.fillStyle = '#111417';
            ctx.beginPath();
            ctx.roundRect(-halfL, -halfW, l, w, 5);
            ctx.fill();

            // Tactical Matte Grey Stripes
            ctx.fillStyle = '#2f3542';
            ctx.fillRect(-halfL * 0.3, -halfW + 4, l * 0.6, w - 8);

            // Front Heavy Ramming Bull-Bar
            ctx.fillStyle = '#747d8c';
            ctx.fillRect(halfL - 2, -halfW + 3, 5, w - 6);
            ctx.fillStyle = '#a4b0be';
            ctx.fillRect(halfL, -halfW + 6, 2, w - 12);

            // Roof
            ctx.fillStyle = '#0a0d0f';
            ctx.fillRect(-halfL * 0.25, -halfW * 0.65, l * 0.45, w * 0.65);
        } else {
            // Standard Blue Police Patrol Cruiser (Blue & White)
            ctx.fillStyle = '#0652DD'; // Vivid police blue
            ctx.beginPath();
            ctx.roundRect(-halfL, -halfW, l, w, 6);
            ctx.fill();

            // White Doors & Center Roof
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-halfL * 0.35, -halfW + 2, l * 0.55, w - 4);

            // "POLICE" side decal markings
            ctx.fillStyle = '#0652DD';
            ctx.font = 'bold 7px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('POLICE', -2, -halfW + 6);
            ctx.fillText('POLICE', -2, halfW - 2);
        }

        // 4. Tinted Windows
        ctx.fillStyle = '#1e272e';
        ctx.beginPath();
        ctx.roundRect(-halfL * 0.25, -halfW * 0.6, l * 0.45, w * 0.6, 3);
        ctx.fill();

        // 5. Flashing Emergency Roof Lightbar
        const sirenState = Math.sin(this.sirenTimer) > 0;
        let leftColor, rightColor;

        if (this.type === 'black') {
            // Advanced unit: High-intensity Red & Amber
            leftColor = sirenState ? '#ff3838' : '#ff9f1a';
            rightColor = sirenState ? '#ff9f1a' : '#ff3838';
        } else {
            // Standard unit: Blue & White emergency flashers
            leftColor = sirenState ? '#17c0eb' : '#ffffff';
            rightColor = sirenState ? '#ffffff' : '#17c0eb';
        }

        ctx.fillStyle = '#2f3542';
        ctx.fillRect(-4, -halfW * 0.48, 8, w * 0.48);

        ctx.fillStyle = leftColor;
        ctx.shadowColor = leftColor;
        ctx.shadowBlur = 12;
        ctx.fillRect(-3, -halfW * 0.48, 6, w * 0.21);

        ctx.fillStyle = rightColor;
        ctx.shadowColor = rightColor;
        ctx.fillRect(-3, -halfW * 0.21, 6, w * 0.21);
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
        this.activeGameplayTimer = 0; // In seconds, pauses when game pauses
        this.heatLevel = 1; // 1 to 5 stars
        this.heatProgress = 0;
        this.spawnTimer = 0;
        this.totalWrecked = 0;

        this.blackPoliceUnlocked = false;
        this.lastEscalationTier = 0;
        this.announcement = null;
        this.announcementTimer = 0;
    }

    reset() {
        this.policeCars = [];
        this.activeGameplayTimer = 0;
        this.heatLevel = 1;
        this.heatProgress = 0;
        this.spawnTimer = 0;
        this.totalWrecked = 0;
        this.blackPoliceUnlocked = false;
        this.lastEscalationTier = 0;
        this.announcement = null;
        this.announcementTimer = 0;
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

    update(player, map, particleManager, isPlaying, dt) {
        // Active gameplay timer only increments during active gameplay
        if (!isPlaying) return;

        this.activeGameplayTimer += dt;

        // Announcement timer decay
        if (this.announcementTimer > 0) {
            this.announcementTimer -= dt;
            if (this.announcementTimer <= 0) {
                this.announcement = null;
            }
        }

        // 10-minute time-based escalation
        const currentTier = Math.floor(this.activeGameplayTimer / CONFIG.ESCALATION_INTERVAL);
        if (currentTier > this.lastEscalationTier) {
            this.lastEscalationTier = currentTier;
            if (!this.blackPoliceUnlocked) {
                this.blackPoliceUnlocked = true;
                this.announcement = '⚠️ WARNING: ADVANCED BLACK PURSUIT UNITS DEPLOYED!';
                this.announcementTimer = 5.0;
            } else {
                this.announcement = `⚠️ ESCALATION: PURSUIT INTENSITY LEVEL ${currentTier + 1}!`;
                this.announcementTimer = 4.0;
            }
            this.addHeat(35);
        }

        // Background heat build-up
        this.addHeat(0.8 * dt);

        // Desired police units count
        const maxUnits = Math.min(CONFIG.MAX_ACTIVE_POLICE, 2 + this.heatLevel);

        this.spawnTimer += dt;
        const spawnInterval = Math.max(2.8, 6.5 - this.heatLevel * 0.7);

        if (this.policeCars.length < maxUnits && this.spawnTimer > spawnInterval) {
            this.spawnTimer = 0;
            this.spawnPoliceCar(player, map);
        }

        // Update active police cars
        let nearbyCount = 0;
        for (let i = this.policeCars.length - 1; i >= 0; i--) {
            const cop = this.policeCars[i];
            cop.update(player, map, particleManager, dt);

            const dist = Math.hypot(cop.x - player.x, cop.y - player.y);
            if (dist < 850) nearbyCount++;

            // Despawn if fallen too far behind (>1700px)
            if (dist > 1800) {
                this.policeCars.splice(i, 1);
                continue;
            }

            // Remove wrecked
            if (cop.isWrecked) {
                this.totalWrecked++;
                const isBlack = cop.type === 'black';
                const reward = isBlack ? 1000 : 500;
                const label = isBlack ? '+$1,000 BLACK COP WRECKED!' : '+$500 COP WRECKED!';

                if (particleManager) {
                    particleManager.spawnExplosion(cop.x, cop.y);
                    particleManager.addFloatingText(label, cop.x, cop.y, isBlack ? '#ff9f1a' : '#e74c3c', 22, true);
                }
                audio.playPoliceWreck();
                this.policeCars.splice(i, 1);
            }
        }

        audio.setSiren(nearbyCount > 0);
    }

    spawnPoliceCar(player, map) {
        if (!player) return;

        const spawnDistance = 880;
        const angleSpread = (Math.random() - 0.5) * 1.2;
        const spawnAngle = player.angle + (Math.random() > 0.4 ? 0 : Math.PI) + angleSpread;

        let spawnX = player.x + Math.cos(spawnAngle) * spawnDistance;
        let spawnY = player.y + Math.sin(spawnAngle) * spawnDistance;

        const worldW = map ? map.width : 4200;
        const worldH = map ? map.height : 4200;
        spawnX = Math.max(200, Math.min(worldW - 200, spawnX));
        spawnY = Math.max(200, Math.min(worldH - 200, spawnY));

        // Determine if Blue standard or Black advanced
        let copType = 'blue';
        if (this.blackPoliceUnlocked) {
            // After 10 minutes, black units spawn alongside blue units (approx 50% ratio)
            copType = Math.random() < 0.55 ? 'black' : 'blue';
        }

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

    getAnnouncement() {
        return this.announcement;
    }
}
