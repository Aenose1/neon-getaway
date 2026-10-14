// particles.js - Multi-type particle physics, debris, skid trails, and floating text
export class ParticleManager {
    constructor() {
        this.particles = [];
        this.debris = [];
        this.skidMarks = []; // Array of { x1, y1, x2, y2, alpha, color, width }
        this.floatingTexts = [];
        this.weatherParticles = [];
        this.maxSkidMarks = 400;
        this.maxParticles = 600;
    }

    reset() {
        this.particles = [];
        this.debris = [];
        this.skidMarks = [];
        this.floatingTexts = [];
        this.weatherParticles = [];
    }

    // Add tire skid mark segment
    addSkidSegment(x1, y1, x2, y2, alpha = 0.5, color = 'rgba(25, 25, 25, 0.45)', width = 4) {
        if (this.skidMarks.length >= this.maxSkidMarks) {
            this.skidMarks.shift();
        }
        this.skidMarks.push({
            x1, y1, x2, y2,
            alpha,
            color,
            width,
            life: 1.0,
            decay: 0.04
        });
    }

    // Spawn dust or snow puffs from tires
    spawnTirePuff(x, y, angle, type = 'dust') {
        if (this.particles.length >= this.maxParticles) return;
        const speed = Math.random() * 30 + 10;
        const spread = (Math.random() - 0.5) * 0.8;
        const pAngle = angle + Math.PI + spread;

        let color = 'rgba(210, 185, 140, ';
        if (type === 'snow') color = 'rgba(240, 248, 255, ';
        else if (type === 'smoke') color = 'rgba(200, 200, 200, ';
        else if (type === 'grass') color = 'rgba(120, 180, 80, ';

        this.particles.push({
            x: x + (Math.random() - 0.5) * 6,
            y: y + (Math.random() - 0.5) * 6,
            vx: Math.cos(pAngle) * speed,
            vy: Math.sin(pAngle) * speed,
            size: Math.random() * 6 + 4,
            growRate: Math.random() * 8 + 6,
            life: 1.0,
            decay: Math.random() * 1.5 + 1.2,
            color,
            type: 'smoke'
        });
    }

    // Spawn wood splinters, metal bits, rock pieces when an object is smashed
    spawnDebris(x, y, type = 'wood', count = 12) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 180 + 60;
            const zSpeed = Math.random() * 140 + 60; // vertical arc

            let color = '#b07842';
            let shape = 'splinter';
            let w = Math.random() * 10 + 6;
            let h = Math.random() * 4 + 2;

            if (type === 'barrel') {
                color = Math.random() > 0.4 ? '#c0392b' : '#7f8c8d';
                shape = 'strip';
                w = 8; h = 4;
            } else if (type === 'rock') {
                color = Math.random() > 0.5 ? '#7f8c8d' : '#95a5a6';
                shape = 'chunk';
                w = Math.random() * 8 + 4;
                h = w;
            } else if (type === 'sign') {
                color = Math.random() > 0.5 ? '#f39c12' : '#ffffff';
                shape = 'chunk';
                w = 7; h = 7;
            } else if (type === 'haybale') {
                color = '#d4ac0d';
                shape = 'splinter';
                w = 9; h = 3;
            } else if (type === 'flower') {
                color = Math.random() > 0.5 ? '#ff69b4' : '#e74c3c';
                shape = 'petal';
                w = 5; h = 4;
            }

            this.debris.push({
                x, y,
                z: 0,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                vz: zSpeed,
                rot: Math.random() * Math.PI * 2,
                vrot: (Math.random() - 0.5) * 14,
                w, h,
                color,
                shape,
                life: 1.0,
                decay: Math.random() * 0.4 + 0.3
            });
        }

        // Additional smoke/dust burst at impact center
        for (let i = 0; i < 6; i++) {
            const ang = Math.random() * Math.PI * 2;
            const spd = Math.random() * 50 + 20;
            this.particles.push({
                x, y,
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd,
                size: Math.random() * 12 + 8,
                growRate: 14,
                life: 1.0,
                decay: 2.0,
                color: 'rgba(215, 200, 175, ',
                type: 'smoke'
            });
        }
    }

    // High speed collision sparks
    spawnSparks(x, y, count = 10) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 200 + 80;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 3 + 1,
                growRate: -1,
                life: 1.0,
                decay: Math.random() * 3 + 2.5,
                color: Math.random() > 0.3 ? '#f39c12' : '#ffffff',
                type: 'spark'
            });
        }
    }

    // EMP Shockwave visual effect
    spawnEmpWave(x, y, radius = 280) {
        this.particles.push({
            x, y,
            size: 10,
            targetSize: radius,
            life: 1.0,
            decay: 2.2, // ~0.45s
            color: 'rgba(0, 210, 255, ',
            type: 'shockwave'
        });

        // Electrical arcs around the car
        for (let i = 0; i < 16; i++) {
            const ang = Math.random() * Math.PI * 2;
            const dist = Math.random() * radius * 0.8;
            this.particles.push({
                x: x + Math.cos(ang) * dist,
                y: y + Math.sin(ang) * dist,
                vx: (Math.random() - 0.5) * 60,
                vy: (Math.random() - 0.5) * 60,
                size: Math.random() * 5 + 3,
                growRate: 0,
                life: 1.0,
                decay: 3.0,
                color: '#67e8f9',
                type: 'spark'
            });
        }
    }

    // Vehicle destruction explosion
    spawnExplosion(x, y) {
        // Shockwave
        this.particles.push({
            x, y,
            size: 15,
            targetSize: 140,
            life: 1.0,
            decay: 3.0,
            color: 'rgba(255, 140, 0, ',
            type: 'shockwave'
        });

        // Fire & smoke plumes
        for (let i = 0; i < 22; i++) {
            const ang = Math.random() * Math.PI * 2;
            const spd = Math.random() * 140 + 40;
            const isFire = Math.random() > 0.4;
            this.particles.push({
                x, y,
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd,
                size: Math.random() * 16 + 10,
                growRate: 15,
                life: 1.0,
                decay: Math.random() * 1.5 + 1.2,
                color: isFire ? 'rgba(255, 100, 20, ' : 'rgba(70, 70, 70, ',
                type: 'smoke'
            });
        }

        // Metal shrapnel
        this.spawnDebris(x, y, 'barrel', 14);
        this.spawnSparks(x, y, 20);
    }

    // Floating text indicator (+Cash, Combo, Alert)
    addFloatingText(text, x, y, color = '#f1c40f', size = 18, isCritical = false) {
        this.floatingTexts.push({
            text,
            x: x + (Math.random() - 0.5) * 20,
            y: y - 10,
            vy: -45, // upward speed
            color,
            size,
            scale: isCritical ? 1.4 : 1.0,
            life: 1.0,
            decay: 0.9,
            isCritical
        });
    }

    // Weather particles initialization (snow or cherry petals)
    initWeather(type, count = 120, worldW = 4000, worldH = 4000) {
        this.weatherParticles = [];
        if (!type || type === 'none') return;

        for (let i = 0; i < count; i++) {
            this.weatherParticles.push({
                x: Math.random() * worldW,
                y: Math.random() * worldH,
                vx: type === 'snow' ? (Math.random() * 40 - 20) : (Math.random() * 60 + 30),
                vy: type === 'snow' ? (Math.random() * 60 + 40) : (Math.random() * 40 + 20),
                size: type === 'snow' ? (Math.random() * 2.5 + 1.5) : (Math.random() * 4 + 3),
                rot: Math.random() * Math.PI * 2,
                vrot: (Math.random() - 0.5) * 4,
                type: type, // 'snow' or 'petal'
                alpha: Math.random() * 0.5 + 0.4
            });
        }
    }

    update(dt) {
        // Update skid marks
        for (let i = this.skidMarks.length - 1; i >= 0; i--) {
            const sm = this.skidMarks[i];
            sm.life -= sm.decay * dt;
            if (sm.life <= 0) {
                this.skidMarks.splice(i, 1);
            }
        }

        // Update generic particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= p.decay * dt;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            if (p.type === 'shockwave') {
                p.size += (p.targetSize - p.size) * (8 * dt);
            } else {
                p.x += (p.vx || 0) * dt;
                p.y += (p.vy || 0) * dt;
                p.size += (p.growRate || 0) * dt;
                if (p.size < 0) p.size = 0;
            }
        }

        // Update 3D parabolic debris
        const gravity = 420;
        for (let i = this.debris.length - 1; i >= 0; i--) {
            const d = this.debris[i];
            d.life -= d.decay * dt;
            if (d.life <= 0) {
                this.debris.splice(i, 1);
                continue;
            }

            d.x += d.vx * dt;
            d.y += d.vy * dt;
            d.rot += d.vrot * dt;

            // Z arc physics
            d.z += d.vz * dt;
            d.vz -= gravity * dt;

            // Bounce on ground
            if (d.z <= 0) {
                d.z = 0;
                d.vz = -d.vz * 0.45;
                d.vx *= 0.65;
                d.vy *= 0.65;
                d.vrot *= 0.65;
            }
        }

        // Update floating texts
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.life -= ft.decay * dt;
            if (ft.life <= 0) {
                this.floatingTexts.splice(i, 1);
                continue;
            }
            ft.y += ft.vy * dt;
        }

        // Update weather ambient particles
        for (let i = 0; i < this.weatherParticles.length; i++) {
            const wp = this.weatherParticles[i];
            wp.x += wp.vx * dt;
            wp.y += wp.vy * dt;
            wp.rot += wp.vrot * dt;

            // Wrap within world bounds
            if (wp.y > 4000) wp.y = 0;
            if (wp.x > 4000) wp.x = 0;
            if (wp.x < 0) wp.x = 4000;
        }
    }

    // Render skid marks beneath vehicles and scenery
    drawSkids(ctx, camera) {
        ctx.save();
        for (let i = 0; i < this.skidMarks.length; i++) {
            const sm = this.skidMarks[i];
            if (!camera.isVisible(sm.x1, sm.y1, 60)) continue;

            ctx.beginPath();
            ctx.moveTo(sm.x1, sm.y1);
            ctx.lineTo(sm.x2, sm.y2);
            ctx.strokeStyle = sm.color;
            ctx.globalAlpha = sm.alpha * sm.life;
            ctx.lineWidth = sm.width;
            ctx.lineCap = 'round';
            ctx.stroke();
        }
        ctx.restore();
    }

    // Render debris, smoke, sparks
    drawWorldParticles(ctx, camera) {
        ctx.save();

        // 1. Draw Debris with simulated 2.5D height & shadow
        for (let i = 0; i < this.debris.length; i++) {
            const d = this.debris[i];
            if (!camera.isVisible(d.x, d.y, 40)) continue;

            ctx.save();
            ctx.globalAlpha = Math.min(1.0, d.life * 1.5);

            // Debris drop shadow on ground
            ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
            ctx.beginPath();
            ctx.ellipse(d.x + 3, d.y + 3, d.w * 0.7, d.h * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();

            // Elevated piece (offset by -z)
            ctx.translate(d.x, d.y - d.z);
            ctx.rotate(d.rot);
            ctx.fillStyle = d.color;
            ctx.fillRect(-d.w / 2, -d.h / 2, d.w, d.h);

            ctx.restore();
        }

        // 2. Draw Dust, Smoke, Sparks, Shockwaves
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            if (!camera.isVisible(p.x, p.y, p.size + 20)) continue;

            ctx.save();
            if (p.type === 'smoke') {
                ctx.fillStyle = `${p.color}${p.life * 0.65})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === 'spark') {
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.life;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === 'shockwave') {
                ctx.strokeStyle = `${p.color}${p.life})`;
                ctx.lineWidth = 6 * p.life;
                ctx.shadowColor = '#00e5ff';
                ctx.shadowBlur = 15;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.restore();
        }

        // 3. Draw Weather (Snow or Cherry Petals)
        for (let i = 0; i < this.weatherParticles.length; i++) {
            const wp = this.weatherParticles[i];
            if (!camera.isVisible(wp.x, wp.y, 20)) continue;

            ctx.save();
            ctx.globalAlpha = wp.alpha;
            if (wp.type === 'snow') {
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(wp.x, wp.y, wp.size, 0, Math.PI * 2);
                ctx.fill();
            } else if (wp.type === 'petal') {
                ctx.translate(wp.x, wp.y);
                ctx.rotate(wp.rot);
                ctx.fillStyle = '#ff9ebb';
                ctx.beginPath();
                ctx.ellipse(0, 0, wp.size * 1.5, wp.size * 0.8, 0, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        ctx.restore();
    }

    // Render floating arcade text in world space
    drawFloatingTexts(ctx, camera) {
        if (this.floatingTexts.length === 0) return;
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let i = 0; i < this.floatingTexts.length; i++) {
            const ft = this.floatingTexts[i];
            if (!camera.isVisible(ft.x, ft.y, 80)) continue;

            ctx.save();
            ctx.globalAlpha = Math.min(1.0, ft.life * 1.3);
            const scale = ft.scale + (1.0 - ft.life) * 0.3;
            ctx.translate(ft.x, ft.y);
            ctx.scale(scale, scale);

            // Bold drop shadow
            ctx.font = `900 ${ft.size}px 'Arial Black', Impact, sans-serif`;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillText(ft.text, 2, 2);

            // Foreground text
            ctx.fillStyle = ft.color;
            ctx.fillText(ft.text, 0, 0);

            ctx.restore();
        }
        ctx.restore();
    }
}
