// car.js - Player vehicles, physics, 2.5D rendering, drift mechanics, and Tank mode
import { audio } from './audio.js';

export const CAR_MODELS = {
    compact: {
        id: 'compact',
        name: 'Rogue Bandit',
        type: 'Starter Compact',
        price: 0,
        unlocked: true,
        description: 'Nimble hot hatch with agile steering and balanced performance. Perfect getaway starter.',
        topSpeed: 380,
        boostSpeed: 480,
        accel: 420,
        turnRate: 3.8,
        durability: 100,
        armor: 1.0,
        color: '#ff6600',
        stripeColor: '#ffffff',
        width: 32,
        length: 56,
        stats: { speed: 65, accel: 68, handling: 78, armor: 55 }
    },
    street: {
        id: 'street',
        name: 'Drift Phantom',
        type: 'Street Racer',
        price: 2500,
        unlocked: false,
        description: 'Modified Japanese tuner car with high-revving turbo and razor-sharp drift angles.',
        topSpeed: 440,
        boostSpeed: 550,
        accel: 540,
        turnRate: 4.4,
        durability: 110,
        armor: 1.1,
        color: '#00d2ff',
        stripeColor: '#003366',
        width: 33,
        length: 58,
        stats: { speed: 82, accel: 85, handling: 92, armor: 60 }
    },
    muscle: {
        id: 'muscle',
        name: 'V8 Crusher',
        type: 'Muscle Car',
        price: 6000,
        unlocked: false,
        description: 'Heavy supercharged American muscle. Reinforced chassis crushes fences and police with brute force.',
        topSpeed: 410,
        boostSpeed: 510,
        accel: 490,
        turnRate: 3.2,
        durability: 190,
        armor: 1.8,
        color: '#d63031',
        stripeColor: '#2d3436',
        width: 36,
        length: 62,
        stats: { speed: 75, accel: 76, handling: 64, armor: 95 }
    },
    super: {
        id: 'super',
        name: 'Apex Hyperion',
        type: 'Supercar',
        price: 12000,
        unlocked: false,
        description: 'Exotic aerodynamic hypercar. Blistering top speed and ultra-responsive precision handling.',
        topSpeed: 500,
        boostSpeed: 620,
        accel: 660,
        turnRate: 4.6,
        durability: 135,
        armor: 1.3,
        color: '#f9ca24',
        stripeColor: '#130f40',
        width: 35,
        length: 64,
        stats: { speed: 96, accel: 94, handling: 90, armor: 70 }
    }
};

export class PlayerCar {
    constructor(carId = 'compact', startX = 2000, startY = 2000) {
        this.setCarModel(carId);

        this.x = startX;
        this.y = startY;
        this.angle = -Math.PI / 2; // Facing north initially
        this.steerAngle = 0; // Front wheel visual angle

        // Physics
        this.speed = 0;
        this.vx = 0;
        this.vy = 0;
        this.lateralSlip = 0;
        this.isDrifting = false;

        // Health & Damage
        this.health = this.maxHealth;
        this.isWrecked = false;

        // Abilities
        this.isTank = false;
        this.tankTimer = 0;
        this.tankTurretAngle = 0;

        // Visual animation timers
        this.smokeTimer = 0;
        this.driftScoreTimer = 0;
    }

    setCarModel(carId) {
        const model = CAR_MODELS[carId] || CAR_MODELS.compact;
        this.carId = model.id;
        this.model = model;
        this.maxSpeed = model.topSpeed;
        this.boostSpeed = model.boostSpeed;
        this.accel = model.accel;
        this.turnRate = model.turnRate;
        this.maxHealth = model.durability;
        this.armor = model.armor;
        this.width = model.width;
        this.length = model.length;
        this.radius = Math.hypot(this.width, this.length) / 2.3;
    }

    reset(x = 2000, y = 2000, angle = -Math.PI / 2) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.steerAngle = 0;
        this.speed = 100; // Start with forward rolling momentum
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        this.health = this.maxHealth;
        this.isWrecked = false;
        this.isTank = false;
        this.tankTimer = 0;
        this.lateralSlip = 0;
        this.isDrifting = false;
    }

    activateTank(duration = 10) {
        this.isTank = true;
        this.tankTimer = duration;
        audio.playTankTransform();
    }

    takeDamage(amount) {
        if (this.isTank) return 0; // Tank is invulnerable to regular damage
        const effectiveDamage = Math.max(3, amount / this.armor);
        this.health = Math.max(0, this.health - effectiveDamage);
        if (this.health <= 0) {
            this.isWrecked = true;
        }
        return effectiveDamage;
    }

    repair(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    update(input, map, particleManager, dt) {
        if (this.isWrecked) {
            this.speed *= Math.max(0, 1 - 2 * dt);
            this.x += Math.cos(this.angle) * this.speed * dt;
            this.y += Math.sin(this.angle) * this.speed * dt;
            return;
        }

        // Tank timer countdown
        if (this.isTank) {
            this.tankTimer -= dt;
            if (this.tankTimer <= 0) {
                this.isTank = false;
            }
        }

        // Off-road terrain check
        const isOffroad = map ? !map.isOnRoad(this.x, this.y) : false;
        const terrainFriction = isOffroad ? 0.72 : (map ? map.surfaceTraction : 1.0);

        // Target speeds
        let targetSpeed = (this.isTank ? 340 : this.maxSpeed) * terrainFriction;
        if (input.isBoosting) {
            targetSpeed = (this.isTank ? 440 : this.boostSpeed) * terrainFriction;
        }

        // Automatic forward cruising drive
        const targetAccel = this.isTank ? 380 : this.accel;
        if (this.speed < targetSpeed) {
            this.speed = Math.min(targetSpeed, this.speed + targetAccel * dt);
        } else if (this.speed > targetSpeed) {
            this.speed = Math.max(targetSpeed, this.speed - targetAccel * 1.5 * dt);
        }

        // Reverse or braking if user holds brake input (S / Down)
        if (input.isBraking) {
            this.speed = Math.max(-120, this.speed - targetAccel * 2.5 * dt);
        }

        // Steering: smooth angle delta
        let steerInput = 0;
        if (input.hasSteerVector) {
            // Steering calculated from mouse position or mobile touch control
            steerInput = input.steerAmount; // -1 to 1
        } else if (input.keySteer !== 0) {
            steerInput = input.keySteer;
        }

        // Smooth visual front wheel turn angle (-0.45 to +0.45 rad)
        const targetWheelAngle = steerInput * 0.45;
        this.steerAngle += (targetWheelAngle - this.steerAngle) * Math.min(1, 14 * dt);

        // Turn rate adjusted by speed and vehicle stats
        const currentTurnRate = (this.isTank ? 2.4 : this.turnRate) * (map ? map.surfaceTraction : 1.0);
        const speedTurnScale = Math.min(1.0, Math.abs(this.speed) / 120);
        const turnDelta = steerInput * currentTurnRate * speedTurnScale * dt;
        this.angle += turnDelta;

        // Drift calculation
        const turnIntensity = Math.abs(steerInput);
        const isHighSpeed = Math.abs(this.speed) > 220;
        this.isDrifting = (turnIntensity > 0.45 && isHighSpeed) || input.isHandbrake;

        if (this.isDrifting && !this.isTank) {
            this.lateralSlip = Math.min(1.0, this.lateralSlip + 3.0 * dt);
            audio.playDrift(0.12 * this.lateralSlip);
        } else {
            this.lateralSlip = Math.max(0, this.lateralSlip - 4.0 * dt);
        }

        // Velocity vector with slight drift slip
        const forwardX = Math.cos(this.angle);
        const forwardY = Math.sin(this.angle);
        const normalX = -Math.sin(this.angle);
        const normalY = Math.cos(this.angle);

        const slipAmount = this.lateralSlip * 0.35 * -Math.sign(steerInput || 1);
        this.vx = (forwardX * this.speed) + (normalX * this.speed * slipAmount);
        this.vy = (forwardY * this.speed) + (normalY * this.speed * slipAmount);

        // Move vehicle
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Keep inside world bounds
        const worldW = map ? map.width : 4000;
        const worldH = map ? map.height : 4000;
        this.x = Math.max(50, Math.min(worldW - 50, this.x));
        this.y = Math.max(50, Math.min(worldH - 50, this.y));

        // Spawn tire skid marks and particles
        this.updateTireEffects(particleManager, map, isOffroad, dt);

        // Engine sound audio update
        const speedRatio = Math.abs(this.speed) / this.maxSpeed;
        audio.updateEngine(speedRatio, input.isBoosting);

        // Low health black engine smoke
        if (this.health < this.maxHealth * 0.35 && !this.isTank) {
            this.smokeTimer += dt;
            if (this.smokeTimer > 0.08) {
                this.smokeTimer = 0;
                particleManager.particles.push({
                    x: this.x + Math.cos(this.angle) * 16,
                    y: this.y + Math.sin(this.angle) * 16,
                    vx: -Math.cos(this.angle) * 30 + (Math.random() - 0.5) * 20,
                    vy: -Math.sin(this.angle) * 30 + (Math.random() - 0.5) * 20,
                    size: 8,
                    growRate: 14,
                    life: 0.8,
                    decay: 1.4,
                    color: 'rgba(35, 35, 35, ',
                    type: 'smoke'
                });
            }
        }
    }

    updateTireEffects(particleManager, map, isOffroad, dt) {
        if (!particleManager) return;

        // Calculate 4 tire positions in world space
        const cos = Math.cos(this.angle);
        const sin = Math.sin(this.angle);
        const halfL = this.length / 2;
        const halfW = this.width / 2;

        // Rear left & rear right tires
        const rlX = this.x - cos * (halfL * 0.65) - sin * (halfW * 0.8);
        const rlY = this.y - sin * (halfL * 0.65) + cos * (halfW * 0.8);

        const rrX = this.x - cos * (halfL * 0.65) + sin * (halfW * 0.8);
        const rrY = this.y - sin * (halfL * 0.65) - cos * (halfW * 0.8);

        // Skid marks when drifting or braking hard
        if (this.isDrifting || this.lateralSlip > 0.3) {
            if (this.prevRlX !== undefined) {
                const skidColor = map && map.theme === 'winter' ? 'rgba(180, 200, 220, 0.45)' : 'rgba(20, 20, 20, 0.4)';
                particleManager.addSkidSegment(this.prevRlX, this.prevRlY, rlX, rlY, 0.4, skidColor, 4);
                particleManager.addSkidSegment(this.prevRrX, this.prevRrY, rrX, rrY, 0.4, skidColor, 4);
            }
            // Drift tire smoke
            if (Math.random() < 0.4) {
                particleManager.spawnTirePuff(rlX, rlY, this.angle, 'smoke');
                particleManager.spawnTirePuff(rrX, rrY, this.angle, 'smoke');
            }
        }

        // Offroad dust / snow particles
        if (isOffroad && Math.abs(this.speed) > 100) {
            if (Math.random() < 0.5) {
                const puffType = map && map.theme === 'winter' ? 'snow' : (map && map.theme === 'spring' ? 'grass' : 'dust');
                particleManager.spawnTirePuff(rlX, rlY, this.angle, puffType);
                particleManager.spawnTirePuff(rrX, rrY, this.angle, puffType);
            }
        }

        this.prevRlX = rlX;
        this.prevRlY = rlY;
        this.prevRrX = rrX;
        this.prevRrY = rrY;
    }

    // 2.5D Rendering on Canvas
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        if (this.isTank) {
            this.drawTank(ctx);
        } else {
            this.drawCar(ctx);
        }

        ctx.restore();
    }

    drawCar(ctx) {
        const w = this.width;
        const l = this.length;
        const halfW = w / 2;
        const halfL = l / 2;

        // 1. Drop shadow with 2.5D slight offset
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
        ctx.beginPath();
        ctx.roundRect(-halfL + 5, -halfW + 6, l, w, 8);
        ctx.fill();
        ctx.restore();

        // 2. Tires (Black rubber with silver rim center)
        const tireW = 12;
        const tireH = 6;
        const frontTireOffset = halfL * 0.65;
        const rearTireOffset = -halfL * 0.65;

        // Front tires rotate with steerAngle
        const drawFrontTire = (yOffset) => {
            ctx.save();
            ctx.translate(frontTireOffset, yOffset);
            ctx.rotate(this.steerAngle);
            ctx.fillStyle = '#1e272e';
            ctx.fillRect(-tireW / 2, -tireH / 2, tireW, tireH);
            ctx.fillStyle = '#bdc3c7';
            ctx.fillRect(-tireW / 4, -tireH / 4, tireW / 2, tireH / 2);
            ctx.restore();
        };

        const drawRearTire = (yOffset) => {
            ctx.save();
            ctx.translate(rearTireOffset, yOffset);
            ctx.fillStyle = '#1e272e';
            ctx.fillRect(-tireW / 2, -tireH / 2, tireW, tireH);
            ctx.fillStyle = '#bdc3c7';
            ctx.fillRect(-tireW / 4, -tireH / 4, tireW / 2, tireH / 2);
            ctx.restore();
        };

        drawFrontTire(-halfW - 1);
        drawFrontTire(halfW + 1);
        drawRearTire(-halfW - 1);
        drawRearTire(halfW + 1);

        // 3. Main Car Body Chassis
        ctx.save();
        // Body base gradient
        const bodyGrad = ctx.createLinearGradient(0, -halfW, 0, halfW);
        bodyGrad.addColorStop(0, this.model.color);
        bodyGrad.addColorStop(0.5, this.lightenColor(this.model.color, 25));
        bodyGrad.addColorStop(1, this.darkenColor(this.model.color, 35));

        ctx.fillStyle = bodyGrad;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.lineWidth = 1.5;

        // Car body contours
        ctx.beginPath();
        if (this.carId === 'compact') {
            // Hatchback shape
            ctx.roundRect(-halfL, -halfW, l, w, 6);
        } else if (this.carId === 'street') {
            // Sharp tuner shape with front splitter
            ctx.moveTo(halfL + 4, 0);
            ctx.lineTo(halfL, -halfW);
            ctx.lineTo(-halfL + 2, -halfW);
            ctx.lineTo(-halfL - 2, 0);
            ctx.lineTo(-halfL + 2, halfW);
            ctx.lineTo(halfL, halfW);
            ctx.closePath();
        } else if (this.carId === 'muscle') {
            // Wide heavy muscle body
            ctx.roundRect(-halfL, -halfW, l, w, 4);
        } else {
            // Supercar aerodynamic wedge
            ctx.moveTo(halfL + 6, 0);
            ctx.lineTo(halfL - 2, -halfW);
            ctx.lineTo(-halfL + 6, -halfW);
            ctx.lineTo(-halfL - 2, -halfW + 6);
            ctx.lineTo(-halfL - 2, halfW - 6);
            ctx.lineTo(-halfL + 6, halfW);
            ctx.lineTo(halfL - 2, halfW);
            ctx.closePath();
        }
        ctx.fill();
        ctx.stroke();

        // 4. Racing stripes or livery
        ctx.fillStyle = this.model.stripeColor;
        ctx.fillRect(-halfL + 4, -3, l - 8, 6);

        // 5. Cabin & Windshield (Tinted glass with glossy highlight)
        const cabinX = -halfL * 0.25;
        const cabinW = l * 0.48;
        const cabinH = w * 0.68;

        ctx.fillStyle = '#111d28';
        ctx.beginPath();
        ctx.roundRect(cabinX, -cabinH / 2, cabinW, cabinH, 4);
        ctx.fill();

        // Windshield glass gradient
        const glassGrad = ctx.createLinearGradient(cabinX + cabinW, -cabinH / 2, cabinX, cabinH / 2);
        glassGrad.addColorStop(0, 'rgba(120, 220, 255, 0.7)');
        glassGrad.addColorStop(0.6, 'rgba(40, 100, 150, 0.6)');
        glassGrad.addColorStop(1, 'rgba(10, 30, 50, 0.8)');

        ctx.fillStyle = glassGrad;
        // Front windshield
        ctx.beginPath();
        ctx.moveTo(cabinX + cabinW - 2, -cabinH / 2 + 1);
        ctx.lineTo(cabinX + cabinW - 8, -cabinH / 2 + 3);
        ctx.lineTo(cabinX + cabinW - 8, cabinH / 2 - 3);
        ctx.lineTo(cabinX + cabinW - 2, cabinH / 2 - 1);
        ctx.closePath();
        ctx.fill();

        // Car Roof
        ctx.fillStyle = this.darkenColor(this.model.color, 15);
        ctx.fillRect(cabinX + 4, -cabinH / 2 + 4, cabinW - 14, cabinH - 8);

        // Model specific features (Spoiler / Blower / Hyper-diffuser)
        if (this.carId === 'street') {
            // Street tuner spoiler wing
            ctx.fillStyle = '#1e272e';
            ctx.fillRect(-halfL - 4, -halfW - 2, 4, w + 4);
        } else if (this.carId === 'muscle') {
            // Supercharger blower on hood
            ctx.fillStyle = '#dcdde1';
            ctx.fillRect(halfL * 0.2, -5, 10, 10);
            ctx.fillStyle = '#718093';
            ctx.fillRect(halfL * 0.2 + 2, -3, 6, 6);
        } else if (this.carId === 'super') {
            // Aerodynamic rear winglets
            ctx.fillStyle = '#130f40';
            ctx.fillRect(-halfL - 3, -halfW + 2, 5, 4);
            ctx.fillRect(-halfL - 3, halfW - 6, 5, 4);
        }

        // 6. Headlights (Bright xenon yellow with subtle beam)
        ctx.fillStyle = '#f5cd79';
        ctx.fillRect(halfL - 2, -halfW + 3, 3, 5);
        ctx.fillRect(halfL - 2, halfW - 8, 3, 5);

        // Taillights (Red LEDs)
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(-halfL - 1, -halfW + 3, 2, 5);
        ctx.fillRect(-halfL - 1, halfW - 8, 2, 5);

        ctx.restore();
    }

    drawTank(ctx) {
        const w = 44;
        const l = 68;
        const halfW = w / 2;
        const halfL = l / 2;

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(-halfL + 4, -halfW + 6, l, w);

        // Caterpillar Treads (Left and Right)
        ctx.fillStyle = '#2d3436';
        ctx.fillRect(-halfL, -halfW, l, 9);
        ctx.fillRect(-halfL, halfW - 9, l, 9);

        // Tread wheels/links
        ctx.fillStyle = '#636e72';
        for (let x = -halfL + 4; x <= halfL - 6; x += 10) {
            ctx.fillRect(x, -halfW + 1, 6, 7);
            ctx.fillRect(x, halfW - 8, 6, 7);
        }

        // Heavy Armored Hull (Military Olive Drab)
        const hullGrad = ctx.createLinearGradient(0, -halfW, 0, halfW);
        hullGrad.addColorStop(0, '#354f2a');
        hullGrad.addColorStop(0.5, '#4b6e3b');
        hullGrad.addColorStop(1, '#2c4223');

        ctx.fillStyle = hullGrad;
        ctx.fillRect(-halfL + 6, -halfW + 8, l - 12, w - 16);

        // Front plow plate
        ctx.fillStyle = '#2d3436';
        ctx.beginPath();
        ctx.moveTo(halfL + 6, 0);
        ctx.lineTo(halfL - 2, -halfW + 4);
        ctx.lineTo(halfL - 2, halfW - 4);
        ctx.closePath();
        ctx.fill();

        // Turret (Centered round armored pod)
        ctx.fillStyle = '#3f5d32';
        ctx.beginPath();
        ctx.arc(0, 0, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#23361c';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Heavy Cannon Barrel
        ctx.fillStyle = '#2d3436';
        ctx.fillRect(6, -3.5, 30, 7);
        // Muzzle brake
        ctx.fillStyle = '#1e272e';
        ctx.fillRect(32, -4.5, 6, 9);
    }

    lightenColor(col, percent) {
        const num = parseInt(col.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, (num >> 8 & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return `rgb(${R}, ${G}, ${B})`;
    }

    darkenColor(col, percent) {
        const num = parseInt(col.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, (num >> 16) - amt);
        const G = Math.max(0, (num >> 8 & 0x00FF) - amt);
        const B = Math.max(0, (num & 0x0000FF) - amt);
        return `rgb(${R}, ${G}, ${B})`;
    }
}
