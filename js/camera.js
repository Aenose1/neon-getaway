// camera.js - 2.5D Smooth follow camera with lookahead and screen shake
export class Camera {
    constructor(viewportWidth, viewportHeight, worldWidth, worldHeight) {
        this.viewportWidth = viewportWidth;
        this.viewportHeight = viewportHeight;
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;

        this.x = worldWidth / 2;
        this.y = worldHeight / 2;
        this.targetX = this.x;
        this.targetY = this.y;

        // Smooth follow lerp speed
        this.smoothFactor = 0.08;

        // Lookahead factor (leads camera forward in car travel direction)
        this.lookAheadDistance = 140;

        // Screen shake
        this.shakeIntensity = 0;
        this.shakeDecay = 0.9;
        this.shakeX = 0;
        this.shakeY = 0;

        // Zoom scale (default 1.0)
        this.zoom = 1.0;
    }

    resize(w, h) {
        this.viewportWidth = w;
        this.viewportHeight = h;
    }

    shake(intensity = 8) {
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    }

    update(target, dt) {
        if (!target) return;

        // Calculate lookahead based on vehicle heading & speed
        const speedRatio = Math.min(1.0, (target.speed || 0) / (target.maxSpeed || 400));
        const forwardX = Math.cos(target.angle) * this.lookAheadDistance * speedRatio;
        const forwardY = Math.sin(target.angle) * this.lookAheadDistance * speedRatio;

        this.targetX = target.x + forwardX;
        this.targetY = target.y + forwardY;

        // Exponential smoothing (frame-rate independent)
        const lerpRate = 1 - Math.pow(0.001, dt || 0.016);
        this.x += (this.targetX - this.x) * Math.min(1, this.smoothFactor * (dt ? dt * 60 : 1));
        this.y += (this.targetY - this.y) * Math.min(1, this.smoothFactor * (dt ? dt * 60 : 1));

        // Clamp to world bounds
        const halfW = (this.viewportWidth / 2) / this.zoom;
        const halfH = (this.viewportHeight / 2) / this.zoom;
        this.x = Math.max(halfW, Math.min(this.worldWidth - halfW, this.x));
        this.y = Math.max(halfH, Math.min(this.worldHeight - halfH, this.y));

        // Update screen shake
        if (this.shakeIntensity > 0.1) {
            this.shakeX = (Math.random() * 2 - 1) * this.shakeIntensity;
            this.shakeY = (Math.random() * 2 - 1) * this.shakeIntensity;
            this.shakeIntensity *= this.shakeDecay;
        } else {
            this.shakeIntensity = 0;
            this.shakeX = 0;
            this.shakeY = 0;
        }
    }

    apply(ctx) {
        ctx.save();
        ctx.translate(this.viewportWidth / 2 + this.shakeX, this.viewportHeight / 2 + this.shakeY);
        ctx.scale(this.zoom, this.zoom);
        ctx.translate(-this.x, -this.y);
    }

    restore(ctx) {
        ctx.restore();
    }

    screenToWorld(sx, sy) {
        const cx = this.viewportWidth / 2;
        const cy = this.viewportHeight / 2;
        return {
            x: this.x + (sx - cx) / this.zoom,
            y: this.y + (sy - cy) / this.zoom
        };
    }

    worldToScreen(wx, wy) {
        const cx = this.viewportWidth / 2;
        const cy = this.viewportHeight / 2;
        return {
            x: cx + (wx - this.x) * this.zoom,
            y: cy + (wy - this.y) * this.zoom
        };
    }

    isVisible(wx, wy, radius = 64) {
        const screen = this.worldToScreen(wx, wy);
        const margin = radius * this.zoom;
        return (
            screen.x >= -margin &&
            screen.x <= this.viewportWidth + margin &&
            screen.y >= -margin &&
            screen.y <= this.viewportHeight + margin
        );
    }
}
