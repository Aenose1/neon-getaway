// src/config.js - Configurable game title, vehicle definitions, map settings, and ability timings
export const CONFIG = {
    TITLE: 'NEON GETAWAY: DESTRUCTION RUN',
    SHORT_TITLE: 'NEON GETAWAY',
    SUBTITLE: 'DESTRUCTION RUN',
    VERSION: '1.2.0',

    // Ability balance
    ABILITY_COOLDOWN: 150, // Exactly 150 seconds (2m 30s) per ability
    TANK_DURATION: 10,     // 10s active duration

    // Police time escalation
    BLACK_POLICE_UNLOCK_TIME: 600, // 10 minutes (600 seconds)
    ESCALATION_INTERVAL: 600,      // Every 10 minutes thereafter
    MAX_ACTIVE_POLICE: 6,

    // Automatic reverse recovery thresholds
    RECOVERY_STUCK_TIME: 1.8,       // Seconds pressing against obstacle
    RECOVERY_DURATION: 1.2,         // Seconds reversing away
    RECOVERY_COOLDOWN: 3.5,         // Seconds before recovery can trigger again
    RECOVERY_VELOCITY_EPSILON: 15   // Movement below this counts as blocked
};

export const CAR_MODELS = {
    compact: {
        id: 'compact',
        name: 'Neon Compact',
        type: 'Starter Compact',
        price: 0,
        unlocked: true,
        description: 'Nimble lightweight hatchback with agile steering and balanced performance. Free getaway vehicle.',
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
        description: 'Modified Japanese tuner car with high-revving turbo, rear wing spoiler, and razor-sharp drift angles.',
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
        description: 'Heavy supercharged American muscle. Reinforced chassis crushes obstacles and rams police with brute force.',
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
        description: 'Exotic aerodynamic hypercar. Blistering top speed, rapid turbo acceleration, and surgical precision handling.',
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

export const MAP_CONFIGS = [
    {
        id: 'winter',
        name: 'Winter Wonderland',
        season: 'Winter',
        description: 'Snow-covered wilderness with frozen roads, snowy pines, and slick icy handling.',
        theme: 'winter',
        groundColor: '#dbe9f4',
        groundAccent: '#c3d9eb',
        roadColor: '#3a4454',
        roadLineColor: '#ffffff',
        roadBorderColor: '#8a9ba8',
        ambientColor: 'rgba(180, 215, 255, 0.08)',
        surfaceTraction: 0.82,
        weather: 'snow',
        spawnX: 2100,
        spawnY: 3400
    },
    {
        id: 'summer',
        name: 'Summer County',
        season: 'Summer',
        description: 'Sun-drenched countryside with farm barns, dusty dirt trails, and high road grip.',
        theme: 'summer',
        groundColor: '#78ab46',
        groundAccent: '#68963b',
        roadColor: '#2b303a',
        roadLineColor: '#f1c40f',
        roadBorderColor: '#a88a58',
        ambientColor: 'rgba(255, 230, 150, 0.08)',
        surfaceTraction: 1.0,
        weather: 'none',
        spawnX: 2100,
        spawnY: 3400
    },
    {
        id: 'spring',
        name: 'Spring Valley',
        season: 'Spring',
        description: 'Winding flower-lined roads with cherry blossom trees, scenic bridges, and smooth drift curves.',
        theme: 'spring',
        groundColor: '#70b263',
        groundAccent: '#5e9953',
        roadColor: '#343a40',
        roadLineColor: '#ffffff',
        roadBorderColor: '#7cb342',
        ambientColor: 'rgba(255, 210, 230, 0.08)',
        surfaceTraction: 0.94,
        weather: 'petal',
        spawnX: 2100,
        spawnY: 3400
    }
];
