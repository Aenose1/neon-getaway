// test/game-test.js - Comprehensive test suite for Neon Getaway: Destruction Run
import assert from 'node:assert';
import { CONFIG, CAR_MODELS, MAP_CONFIGS } from '../src/config.js';
import { GameMap } from '../src/maps.js';
import { DamageManager } from '../src/damage.js';
import { RecoveryManager } from '../src/recovery.js';
import { AbilityManager } from '../src/abilities.js';
import { PoliceManager, PoliceCar } from '../src/police.js';

console.log('=== STARTING NEON GETAWAY TEST SUITE ===');

// Test 1: Config & Title
console.log('Test 1: Verifying game title and configuration...');
assert.strictEqual(CONFIG.TITLE, 'NEON GETAWAY: DESTRUCTION RUN');
assert.strictEqual(CONFIG.ABILITY_COOLDOWN, 150, 'Ability cooldown must be exactly 150 seconds');
assert.strictEqual(CONFIG.BLACK_POLICE_UNLOCK_TIME, 600, 'Black police must unlock at 10 minutes (600s)');
console.log('✓ Title and configuration verified.');

// Test 2: Exactly 4 Car Models
console.log('Test 2: Verifying four car models...');
const carKeys = Object.keys(CAR_MODELS);
assert.strictEqual(carKeys.length, 4, 'Must have exactly 4 car models');
assert.deepStrictEqual(carKeys, ['compact', 'street', 'muscle', 'super']);
assert.strictEqual(CAR_MODELS.compact.price, 0, 'Starter Compact must be free');
assert.strictEqual(CAR_MODELS.street.price, 2500, 'Street Racer price must be $2,500');
assert.strictEqual(CAR_MODELS.muscle.price, 6000, 'Muscle Car price must be $6,000');
assert.strictEqual(CAR_MODELS.super.price, 12000, 'Supercar price must be $12,000');

for (const key of carKeys) {
    const c = CAR_MODELS[key];
    assert(c.topSpeed > 0 && c.durability > 0 && c.armor > 0);
    assert(c.stats.speed <= 100 && c.stats.armor <= 100);
}
console.log('✓ Four car models verified with distinct attributes and prices.');

// Test 3: Exactly 3 Seasonal Maps
console.log('Test 3: Verifying three seasonal maps...');
assert.strictEqual(MAP_CONFIGS.length, 3, 'Must have exactly 3 maps');
assert.strictEqual(MAP_CONFIGS[0].id, 'winter');
assert.strictEqual(MAP_CONFIGS[1].id, 'summer');
assert.strictEqual(MAP_CONFIGS[2].id, 'spring');

for (let i = 0; i < 3; i++) {
    const map = new GameMap(i);
    assert(map.roads.length > 5);
    assert(map.destructibles.length > 50);
    assert(map.buildings.length > 5);
    assert(map.surfaceTraction > 0.5 && map.surfaceTraction <= 1.0);
}
console.log('✓ Three seasonal maps verified.');

// Test 4: Damage Calculation & Health Bar Severity
console.log('Test 4: Verifying damage calculation and health tracking...');
const damage = new DamageManager(100, 1.0);
assert.strictEqual(damage.getHealthPercentage(), 100);
assert.strictEqual(damage.getHealthStatus().status, 'healthy');

// Low speed collision (<100 speed)
const lowDmg = damage.calculateCollisionDamage(60);
assert(lowDmg >= 5 && lowDmg <= 10, `Low speed damage was ${lowDmg}`);

// Medium speed collision (100 - 260 speed)
const medDmg = damage.calculateCollisionDamage(180);
assert(medDmg >= 12 && medDmg <= 28, `Medium speed damage was ${medDmg}`);

// High speed collision (>260 speed)
const highDmg = damage.calculateCollisionDamage(450);
assert(highDmg >= 40, `High speed wall impact damage must be substantial: ${highDmg}`);

// Contact cooldown prevents per-frame damage spam
damage.takeCollisionDamage('wall_1', 300);
const hpAfterFirst = damage.health;
damage.takeCollisionDamage('wall_1', 300); // Immediate second frame contact
assert.strictEqual(damage.health, hpAfterFirst, 'Continuous frame contact must not reapply damage');

// Damage after cooldown timer passes
damage.update(0.4);
damage.takeCollisionDamage('wall_1', 300);
assert(damage.health < hpAfterFirst, 'Damage should reapply after cooldown window');
console.log('✓ Collision damage severity and contact cooldown verified.');

// Test 5: Automatic Reverse Recovery
console.log('Test 5: Verifying automatic reverse recovery...');
const recovery = new RecoveryManager();
const mockPlayer = { speed: 5, angle: 0 };

// Not stuck when free or moving fast
recovery.update(mockPlayer, false, true, 0.5);
assert.strictEqual(recovery.isActive(), false);

// Pressing solid obstacle while attempting to move with low speed (<15) for ~2 seconds
for (let t = 0; t < 2.0; t += 0.1) {
    recovery.update(mockPlayer, true, true, 0.1);
}
assert.strictEqual(recovery.isActive(), true, 'Recovery must activate after ~2 seconds stuck against wall');
assert(mockPlayer.speed < 0, 'Recovery must reverse the car backwards');
assert.strictEqual(recovery.getMessage(), 'AUTO RECOVERY: REVERSING...');

// Recovery stops after duration and enters cooldown
for (let t = 0; t < 1.5; t += 0.1) {
    recovery.update(mockPlayer, false, true, 0.1);
}
assert.strictEqual(recovery.isActive(), false, 'Recovery must disengage after clearance');
assert(recovery.recoveryCooldownTimer > 0, 'Recovery must enter cooldown to prevent oscillation');
console.log('✓ Automatic reverse recovery verified.');

// Test 6: Blue standard & Black advanced Police with 10-Minute Escalation
console.log('Test 6: Verifying police pursuit and 10-minute escalation...');
const police = new PoliceManager();
const blueCar = new PoliceCar('blue', 100, 100);
const blackCar = new PoliceCar('black', 100, 100);

assert.strictEqual(blueCar.type, 'blue');
assert.strictEqual(blackCar.type, 'black');
assert(blackCar.maxSpeed > blueCar.maxSpeed, 'Black advanced car must be faster');
assert(blackCar.armor > blueCar.armor, 'Black advanced car must be more durable');

// Before 10 minutes (600s), black cars are not unlocked
police.update({ x: 2000, y: 2000, angle: 0, speed: 200 }, null, null, true, 300); // 5 minutes
assert.strictEqual(police.blackPoliceUnlocked, false, 'Black police must be locked before 10 minutes');

// At 10 minutes (600s), black police unlock
police.update({ x: 2000, y: 2000, angle: 0, speed: 200 }, null, null, true, 305); // Total 605s
assert.strictEqual(police.blackPoliceUnlocked, true, 'Black police must unlock at 10 minutes');
assert(police.getAnnouncement().includes('BLACK PURSUIT UNITS DEPLOYED'));

// Pausing stops active timer
const timerBeforePause = police.activeGameplayTimer;
police.update({ x: 2000, y: 2000, angle: 0, speed: 200 }, null, null, false, 50); // isPlaying = false
assert.strictEqual(police.activeGameplayTimer, timerBeforePause, 'Active gameplay timer must pause when game is paused');

// Verify ZERO spike strips in code
const serializedPolice = JSON.stringify(police) + JSON.stringify(blueCar) + JSON.stringify(blackCar);
assert(!serializedPolice.toLowerCase().includes('spike'), 'Police must never deploy spike strips');
console.log('✓ Blue and Black police pursuit with 10-minute escalation and zero spike strips verified.');

// Test 7: Exactly 3 Abilities with Independent 150-Second Cooldowns
console.log('Test 7: Verifying abilities with independent 150s cooldowns...');
const abilities = new AbilityManager();
const abilityList = Object.keys(abilities.abilities);
assert.deepStrictEqual(abilityList, ['tank', 'oil', 'emp'], 'Must have exactly Tank, Oil, and EMP');

for (const key of abilityList) {
    assert.strictEqual(abilities.abilities[key].cooldown, 150, `${key} cooldown must be 150s`);
}

// Trigger Tank
const tankResult = abilities.triggerAbility('tank', { x: 100, y: 100, isWrecked: false, activateTank: () => {} }, police, null);
assert.strictEqual(tankResult.success, true);
assert.strictEqual(abilities.abilities.tank.timer, 150, 'Tank must start 150s cooldown immediately');
assert.strictEqual(abilities.abilities.oil.timer, 0, 'Oil cooldown must remain unaffected');
assert.strictEqual(abilities.abilities.emp.timer, 0, 'EMP cooldown must remain unaffected');

// Attempting to trigger Tank while on cooldown must fail with feedback
const repeatTank = abilities.triggerAbility('tank', { x: 100, y: 100, isWrecked: false }, police, null);
assert.strictEqual(repeatTank.success, false);
assert(repeatTank.reason.includes('ON COOLDOWN'));

// Cooldown ticks down only when isPlaying is true
abilities.update({ isTank: true }, police, null, true, 10);
assert.strictEqual(abilities.abilities.tank.timer, 140);

// Cooldown does not tick down while paused
abilities.update({ isTank: true }, police, null, false, 10);
assert.strictEqual(abilities.abilities.tank.timer, 140, 'Ability cooldowns must pause when game is paused');
console.log('✓ Three abilities with independent 150s cooldowns verified.');

console.log('=== ALL NEON GETAWAY TESTS PASSED (7/7) ===');
