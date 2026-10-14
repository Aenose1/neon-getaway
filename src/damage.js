// src/damage.js - Vehicle damage calculation, contact tracking, cooldowns, and health status
export class DamageManager {
    constructor(durability = 100, armor = 1.0) {
        this.maxHealth = durability;
        this.health = durability;
        this.armor = armor;
        this.isWrecked = false;

        // Contact tracking & cooldown to prevent damage on every frame during persistent contact
        this.lastDamagedObstacleId = null;
        this.damageCooldownTimer = 0;
        this.minDamageCooldown = 0.35; // 350ms cooldown per obstacle contact
    }

    reset(durability = 100, armor = 1.0) {
        this.maxHealth = durability;
        this.health = durability;
        this.armor = armor;
        this.isWrecked = false;
        this.lastDamagedObstacleId = null;
        this.damageCooldownTimer = 0;
    }

    update(dt) {
        if (this.damageCooldownTimer > 0) {
            this.damageCooldownTimer -= dt;
            if (this.damageCooldownTimer <= 0) {
                this.lastDamagedObstacleId = null;
            }
        }
    }

    // Calculates collision damage based on impact velocity severity and vehicle durability
    calculateCollisionDamage(impactSpeed, isTank = false) {
        const absSpeed = Math.abs(impactSpeed);
        let baseDamage = 0;

        if (absSpeed < 100) {
            // Low-speed collision (minor damage)
            baseDamage = 5 + (absSpeed / 100) * 5; // 5 - 10
        } else if (absSpeed <= 260) {
            // Medium-speed collision (moderate damage)
            baseDamage = 12 + ((absSpeed - 100) / 160) * 16; // 12 - 28
        } else {
            // High-speed collision (significant damage)
            // Hitting a solid wall at top speed substantially reduces health
            baseDamage = 32 + ((absSpeed - 260) / 240) * 32; // 32 - 64+
        }

        // Durability/Armor factor (Muscle Car is tougher, absorbing more damage)
        let effectiveDamage = baseDamage / Math.max(0.8, this.armor);

        // Tank ability: substantially reduces damage, but does not provide permanent invulnerability
        if (isTank) {
            effectiveDamage *= 0.15; // 85% damage reduction while active
        }

        return Math.max(2, Math.round(effectiveDamage));
    }

    // Apply damage with contact tracking
    takeCollisionDamage(obstacleId, impactSpeed, isTank = false) {
        // If currently in cooldown with the same obstacle, ignore to prevent frame-by-frame damage
        if (this.lastDamagedObstacleId === obstacleId && this.damageCooldownTimer > 0) {
            return 0;
        }

        const damage = this.calculateCollisionDamage(impactSpeed, isTank);
        this.health = Math.max(0, this.health - damage);

        if (this.health <= 0) {
            this.isWrecked = true;
        }

        this.lastDamagedObstacleId = obstacleId;
        this.damageCooldownTimer = this.minDamageCooldown;

        return damage;
    }

    takeDirectDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        if (this.health <= 0) {
            this.isWrecked = true;
        }
        return amount;
    }

    getHealthPercentage() {
        return Math.max(0, Math.min(100, Math.round((this.health / this.maxHealth) * 100)));
    }

    getHealthStatus() {
        const pct = this.getHealthPercentage();
        if (pct > 60) return { status: 'healthy', color: '#2ecc71', class: 'health-green' };
        if (pct >= 28) return { status: 'moderate', color: '#f39c12', class: 'health-orange' };
        return { status: 'critical', color: '#e74c3c', class: 'health-red' };
    }
}
