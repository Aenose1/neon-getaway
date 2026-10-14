// abilities.js - Three special abilities: Tank (Titan Mode), Oil Slick, Electric Shock (EMP)
import { audio } from './audio.js';

export class AbilityManager {
    constructor() {
        this.abilities = {
            tank: {
                id: 'tank',
                name: 'Titan Tank',
                key: '1',
                altKey: 'Q',
                cooldown: 30,
                timer: 0,
                duration: 10,
                active: false,
                icon: '🛡️'
            },
            oil: {
                id: 'oil',
                name: 'Oil Slick',
                key: '2',
                altKey: 'E',
                cooldown: 18,
                timer: 0,
                icon: '🛢️'
            },
            emp: {
                id: 'emp',
                name: 'EMP Shock',
                key: '3',
                altKey: 'R',
                cooldown: 22,
                timer: 0,
                radius: 280,
                icon: '⚡'
            }
        };

        this.oilPuddles = []; // Array of active oil slicks on the ground
    }

    reset() {
        this.abilities.tank.timer = 0;
        this.abilities.tank.active = false;
        this.abilities.oil.timer = 0;
        this.abilities.emp.timer = 0;
        this.oilPuddles = [];
    }

    triggerAbility(id, player, policeManager, particleManager) {
        if (!player || player.isWrecked) return false;

        const ability = this.abilities[id];
        if (!ability || ability.timer > 0) return false;

        if (id === 'tank') {
            ability.active = true;
            ability.timer = ability.cooldown;
            player.activateTank(ability.duration);
            if (particleManager) {
                particleManager.addFloatingText('TITAN TANK ACTIVATED!', player.x, player.y, '#2ecc71', 20, true);
            }
            return true;
        } else if (id === 'oil') {
            ability.timer = ability.cooldown;
            this.deployOilSlick(player, particleManager);
            return true;
        } else if (id === 'emp') {
            ability.timer = ability.cooldown;
            this.triggerEmp(player, policeManager, particleManager);
            return true;
        }

        return false;
    }

    deployOilSlick(player, particleManager) {
        // Deploy directly behind player vehicle
        const cos = Math.cos(player.angle);
        const sin = Math.sin(player.angle);
        const deployDist = -player.length * 0.7;

        const px = player.x + cos * deployDist;
        const py = player.y + sin * deployDist;

        this.oilPuddles.push({
            x: px,
            y: py,
            radius: 36,
            life: 14.0, // 14 seconds lifetime
            maxLife: 14.0
        });

        audio.playOilDrop();
        if (particleManager) {
            particleManager.addFloatingText('OIL SLICK DEPLOYED!', px, py, '#f39c12', 18);
        }
    }

    triggerEmp(player, policeManager, particleManager) {
        audio.playEmpZap();
        const radius = this.abilities.emp.radius;

        if (particleManager) {
            particleManager.spawnEmpWave(player.x, player.y, radius);
            particleManager.addFloatingText('EMP PULSE FIRED!', player.x, player.y, '#00e5ff', 22, true);
        }

        // Stun nearby police vehicles
        if (policeManager && policeManager.policeCars) {
            let hitCount = 0;
            for (let i = 0; i < policeManager.policeCars.length; i++) {
                const cop = policeManager.policeCars[i];
                const dist = Math.hypot(cop.x - player.x, cop.y - player.y);
                if (dist <= radius) {
                    cop.applyStun(4.0);
                    hitCount++;
                }
            }
            if (hitCount > 0 && particleManager) {
                particleManager.addFloatingText(`${hitCount} COPS STUNNED!`, player.x, player.y - 30, '#67e8f9', 18);
            }
        }
    }

    update(player, policeManager, particleManager, dt) {
        // Update cooldowns
        for (const key in this.abilities) {
            const ab = this.abilities[key];
            if (ab.timer > 0) {
                ab.timer = Math.max(0, ab.timer - dt);
            }
        }

        // Sync tank active state
        if (this.abilities.tank.active && (!player || !player.isTank)) {
            this.abilities.tank.active = false;
        }

        // Update active oil puddles
        for (let i = this.oilPuddles.length - 1; i >= 0; i--) {
            const puddle = this.oilPuddles[i];
            puddle.life -= dt;
            if (puddle.life <= 0) {
                this.oilPuddles.splice(i, 1);
                continue;
            }

            // Check collision with pursuing police vehicles
            if (policeManager && policeManager.policeCars) {
                for (let j = 0; j < policeManager.policeCars.length; j++) {
                    const cop = policeManager.policeCars[j];
                    if (cop.isSpinning || cop.isWrecked) continue;

                    const dist = Math.hypot(cop.x - puddle.x, cop.y - puddle.y);
                    if (dist < puddle.radius + cop.radius * 0.7) {
                        cop.applySpinout(2.5);
                        cop.takeDamage(35);
                        if (particleManager) {
                            particleManager.addFloatingText('COP SPUN OUT!', cop.x, cop.y, '#f39c12', 18);
                        }
                    }
                }
            }
        }
    }

    draw(ctx, camera) {
        if (this.oilPuddles.length === 0) return;

        ctx.save();
        for (let i = 0; i < this.oilPuddles.length; i++) {
            const puddle = this.oilPuddles[i];
            if (!camera.isVisible(puddle.x, puddle.y, puddle.radius + 10)) continue;

            const alpha = Math.min(1.0, (puddle.life / puddle.maxLife) * 1.5);
            ctx.save();
            ctx.globalAlpha = alpha;

            // Dark viscous oil puddle
            ctx.fillStyle = '#0f1416';
            ctx.beginPath();
            ctx.ellipse(puddle.x, puddle.y, puddle.radius, puddle.radius * 0.65, 0.2, 0, Math.PI * 2);
            ctx.fill();

            // Rainbow specular sheen ring
            const sheenGrad = ctx.createLinearGradient(
                puddle.x - puddle.radius, puddle.y - puddle.radius * 0.5,
                puddle.x + puddle.radius, puddle.y + puddle.radius * 0.5
            );
            sheenGrad.addColorStop(0, 'rgba(0, 255, 200, 0.35)');
            sheenGrad.addColorStop(0.5, 'rgba(255, 0, 180, 0.35)');
            sheenGrad.addColorStop(1, 'rgba(255, 220, 0, 0.35)');

            ctx.strokeStyle = sheenGrad;
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.restore();
        }
        ctx.restore();
    }
}
