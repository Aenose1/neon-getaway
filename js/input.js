// input.js - Unified input handling for Desktop (Mouse/Right-click/WASD) and Mobile (Single circular steering ring)
export class InputManager {
    constructor(canvas) {
        this.canvas = canvas;

        // Accurate device capability detection
        this.isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

        // Steering state
        this.hasSteerVector = false;
        this.steerAmount = 0; // -1 (full left) to +1 (full right)
        this.targetAngle = null;

        // Throttle & Braking
        this.isBoosting = false; // Right mouse button or W/Up
        this.isBraking = false;  // S/Down
        this.isHandbrake = false; // Space

        // Keyboard steer fallback
        this.keySteer = 0;

        // Action flags
        this.pauseTriggered = false;
        this.abilityTriggered = null;

        // Desktop mouse tracking
        this.mouseX = window.innerWidth / 2;
        this.mouseY = window.innerHeight / 2;
        this.mouseInCanvas = true;

        // Mobile circular touch control layout
        this.touchControl = {
            active: false,
            touchId: null,
            centerX: 0,
            centerY: 0,
            radius: 54, // ~2.2 inches depending on DPI
            dragOffset: 0
        };

        this.initListeners();
    }

    initListeners() {
        // Window resize
        window.addEventListener('resize', () => {
            this.updateMobileLayout();
        });

        // 1. Desktop Mouse Controls
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
            this.mouseInCanvas = true;
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.mouseInCanvas = false;
        });

        // Right-click throttle (Button 2)
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 2) {
                this.isBoosting = true;
                e.preventDefault();
            } else if (e.button === 0) {
                // Left click can also steer focus
            }
        });

        window.addEventListener('mouseup', (e) => {
            if (e.button === 2) {
                this.isBoosting = false;
            }
        });

        // Prevent browser context menu only on canvas
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // 2. Keyboard Controls (WASD / Arrows / Abilities)
        window.addEventListener('keydown', (e) => {
            if (e.repeat) return;
            const code = e.code;

            if (code === 'KeyW' || code === 'ArrowUp') {
                this.isBoosting = true;
            } else if (code === 'KeyS' || code === 'ArrowDown') {
                this.isBraking = true;
            } else if (code === 'KeyA' || code === 'ArrowLeft') {
                this.keySteer = -1;
            } else if (code === 'KeyD' || code === 'ArrowRight') {
                this.keySteer = 1;
            } else if (code === 'Space') {
                this.isHandbrake = true;
            } else if (code === 'KeyP' || code === 'Escape') {
                this.pauseTriggered = true;
            } else if (code === 'Digit1' || code === 'KeyQ') {
                this.abilityTriggered = 'tank';
            } else if (code === 'Digit2' || code === 'KeyE') {
                this.abilityTriggered = 'oil';
            } else if (code === 'Digit3' || code === 'KeyR') {
                this.abilityTriggered = 'emp';
            }
        });

        window.addEventListener('keyup', (e) => {
            const code = e.code;
            if (code === 'KeyW' || code === 'ArrowUp') {
                this.isBoosting = false;
            } else if (code === 'KeyS' || code === 'ArrowDown') {
                this.isBraking = false;
            } else if (code === 'KeyA' || code === 'ArrowLeft') {
                if (this.keySteer === -1) this.keySteer = 0;
            } else if (code === 'KeyD' || code === 'ArrowRight') {
                if (this.keySteer === 1) this.keySteer = 0;
            } else if (code === 'Space') {
                this.isHandbrake = false;
            }
        });

        // 3. Mobile Touch Controls (Single Circular Steering Ring)
        if (this.isTouchDevice) {
            this.initTouchListeners();
        }
    }

    initTouchListeners() {
        this.updateMobileLayout();

        const handleTouchStart = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            for (let i = 0; i < e.changedTouches.length; i++) {
                const t = e.changedTouches[i];
                const tx = t.clientX - rect.left;
                const ty = t.clientY - rect.top;

                // Check if touch is within or near the bottom-right circular steering control
                const distToCircle = Math.hypot(tx - this.touchControl.centerX, ty - this.touchControl.centerY);
                if (distToCircle <= this.touchControl.radius * 1.8 && this.touchControl.touchId === null) {
                    this.touchControl.active = true;
                    this.touchControl.touchId = t.identifier;
                    this.updateTouchSteer(tx);
                    e.preventDefault();
                }
            }
        };

        const handleTouchMove = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            for (let i = 0; i < e.changedTouches.length; i++) {
                const t = e.changedTouches[i];
                if (t.identifier === this.touchControl.touchId) {
                    const tx = t.clientX - rect.left;
                    this.updateTouchSteer(tx);
                    e.preventDefault();
                }
            }
        };

        const handleTouchEnd = (e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                const t = e.changedTouches[i];
                if (t.identifier === this.touchControl.touchId) {
                    this.touchControl.active = false;
                    this.touchControl.touchId = null;
                    this.touchControl.dragOffset = 0;
                    this.steerAmount = 0;
                    this.hasSteerVector = false;
                }
            }
        };

        this.canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        this.canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        this.canvas.addEventListener('touchend', handleTouchEnd, { passive: true });
        this.canvas.addEventListener('touchcancel', handleTouchEnd, { passive: true });
    }

    updateMobileLayout() {
        if (!this.canvas) return;
        const w = this.canvas.width || window.innerWidth;
        const h = this.canvas.height || window.innerHeight;

        // Position circular control approx 1.5 inches (~75px) above bottom edge, ~75px from right edge
        this.touchControl.centerX = w - 85;
        this.touchControl.centerY = h - 95;
        this.touchControl.radius = Math.min(60, Math.max(46, w * 0.1));
    }

    updateTouchSteer(touchX) {
        const dx = touchX - this.touchControl.centerX;
        const maxDrag = this.touchControl.radius * 1.3;
        // Clamp and normalize to -1.0 .. +1.0
        const norm = Math.max(-1.0, Math.min(1.0, dx / maxDrag));
        this.touchControl.dragOffset = norm * (this.touchControl.radius * 0.6);
        this.steerAmount = norm;
        this.hasSteerVector = true;
    }

    update(player, camera) {
        // If mobile touch steering active, touch steering is already set
        if (this.isTouchDevice && this.touchControl.active) {
            // Touch steer is active
            return;
        }

        // Desktop mouse steering logic
        if (!this.isTouchDevice && player && camera && this.mouseInCanvas) {
            // Get player position in screen space
            const playerScreen = camera.worldToScreen(player.x, player.y);
            const dx = this.mouseX - playerScreen.x;
            const dy = this.mouseY - playerScreen.y;
            const dist = Math.hypot(dx, dy);

            // Avoid erratic jitter when cursor is right on top of car
            if (dist > 35) {
                const pointerAngle = Math.atan2(dy, dx);
                let angleDiff = pointerAngle - player.angle;
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

                // Smooth steering proportional to angle difference
                const targetSteer = Math.max(-1.0, Math.min(1.0, angleDiff / 1.0));
                // Smooth interpolation to avoid abrupt snaps
                this.steerAmount += (targetSteer - this.steerAmount) * 0.25;
                this.hasSteerVector = true;
            } else {
                this.steerAmount *= 0.8;
            }
        } else if (!this.hasSteerVector && this.keySteer === 0) {
            this.steerAmount *= 0.8;
            if (Math.abs(this.steerAmount) < 0.02) this.steerAmount = 0;
        }
    }

    // Render mobile circular touch control ONLY on mobile touch devices!
    drawMobileControls(ctx) {
        if (!this.isTouchDevice) return; // Strictly NEVER show on desktop!

        const c = this.touchControl;
        ctx.save();

        // 1. Translucent white circular outline
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(c.centerX, c.centerY, c.radius, 0, Math.PI * 2);
        ctx.stroke();

        // 2. Subtle directional left/right notch arrows
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 2;
        // Left notch
        ctx.beginPath();
        ctx.moveTo(c.centerX - c.radius + 8, c.centerY - 6);
        ctx.lineTo(c.centerX - c.radius + 2, c.centerY);
        ctx.lineTo(c.centerX - c.radius + 8, c.centerY + 6);
        ctx.stroke();

        // Right notch
        ctx.beginPath();
        ctx.moveTo(c.centerX + c.radius - 8, c.centerY - 6);
        ctx.lineTo(c.centerX + c.radius - 2, c.centerY);
        ctx.lineTo(c.centerX + c.radius - 8, c.centerY + 6);
        ctx.stroke();

        // 3. Dynamic touch indicator dot when active
        if (c.active) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
            ctx.beginPath();
            ctx.arc(c.centerX + c.dragOffset, c.centerY, 14, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}
