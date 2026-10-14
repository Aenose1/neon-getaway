# NEON GETAWAY: DESTRUCTION RUN 🏎️💥

> **A high-octane 2D/2.5D browser arcade getaway driving game inspired by the mechanics and spirit of Smash Bandits Racing.**
> Smash through roadside scenery for dirty cash bounties, maintain high-speed destruction combos, manage vehicle damage, survive relentless blue and black highway patrol pursuits, unlock four distinct getaway cars, and unleash three tactical abilities with 150-second cooldowns!

---

## 🎮 Playable Demo & Overview

- **Title:** NEON GETAWAY: DESTRUCTION RUN *(configurable in `src/config.js`)*
- **Genre:** Top-down / 2.5D Arcade Driving, Destruction & Police Pursuit
- **Platform:** Modern Desktop, Laptop, Tablet, and Mobile Web Browsers (zero installs, zero API keys, no backend required)
- **Engine / Tech Stack:** HTML5, CSS3, JavaScript (ES6 Modules), HTML5 Canvas 2D, Web Audio API
- **Persistence:** LocalStorage (Cash balance, Garage ownership, Selected car, High score, Settings)
- **License:** MIT License (`LICENSE`)

---

## 🏎️ Core Gameplay & Features

### 1. Exactly Four Purchasable Cars (Maximum of 4)
| Model | Type | Price | Top Speed | Accel | Handling | Durability | Description |
|---|---|---|---|---|---|---|---|
| **Neon Compact** | Starter Compact | **FREE ($0)** | 380 | 420 | 3.8 | 100 HP | Agile lightweight hatchback with responsive steering and balanced getaway speed. Unlocked by default. |
| **Drift Phantom** | Street Racer | **$2,500** | 440 | 540 | 4.4 | 110 HP | Low-slung Japanese tuner with rear spoiler wing, high-revving turbo, and razor-sharp drift angles. |
| **V8 Crusher** | Muscle Car | **$6,000** | 410 | 490 | 3.2 | 190 HP | Heavy supercharged American muscle. Reinforced chassis (1.8 armor) absorbs heavy collisions and rams police with double impact force. |
| **Apex Hyperion** | Supercar | **$12,000** | 500 | 660 | 4.6 | 135 HP | Aerodynamic exotic wedge. Blistering top speed and surgical steering precision. |

### 2. Exactly Three Seasonal Maps
Selectable from the main menu / map selection screen:
1. **Winter Wonderland (Map 0)**:
   - Snow-covered forest roads, frozen cabins, rocky terrain, and breakable salt barrels.
   - Slower tire friction (`0.82`), extended drift glides, white snow roostertail spray, and falling snow particles.
2. **Summer County (Map 1)**:
   - Sunny rural countryside with red barns, silos, farm fences, and hay bales.
   - High road grip (`1.0`), off-road dirt friction, dust plumes, and warm golden daylight vignette.
3. **Spring Valley (Map 2)**:
   - Blossoming cherry trees, scenic river waterways with wooden bridges, flower pots, and roadside stalls.
   - Curved winding roads (`0.94` traction) designed for chaining long drifts with fluttering pink petal weather.

### 3. Car Damage & Visible Health Bar
- **HUD Health Bar:** Clearly visible in the upper-right HUD with real-time percentage and responsive color transitions:
  - **Green (>60%):** Healthy vehicle condition.
  - **Yellow/Orange (30%–60%):** Moderate collision damage.
  - **Red (<30%):** Critical damage; black engine smoke puffs from the hood.
- **Damage Severity Calculation:**
  - Low-speed impact (<100 speed): Minor damage (5–10 HP).
  - Medium-speed impact (100–260 speed): Moderate damage (12–28 HP).
  - High-speed impact (>260 speed): Substantial damage (32–64+ HP). Crashing into solid walls at top speed causes severe damage!
- **Durability/Armor Scaling:** Muscle Car's heavy armor absorbs substantial damage.
- **Tank Armor:** Tank ability provides 85% damage reduction while active, but does not provide permanent invulnerability.
- **Anti-Spam Contact Tracking:** Collision tracking prevents continuous per-frame damage while the car remains in contact with a wall.
- **Vehicle Wrecked:** At 0 HP, the car explodes into a flaming wreck, driving stops, and the run concludes with full statistics.

### 4. Automatic Reverse Recovery System
- **Stuck Detection:** Automatically detects when the car is pressed against an immovable obstacle while the player is attempting to move forward, with actual displacement remaining below 15 px/s for approximately 1.8–2.0 seconds.
- **Action:** Engages automatic reverse for 1.2s with a recovery turn angle to back away and disengage.
- **Notification:** Displays `AUTO RECOVERY: REVERSING...` in the central HUD banner.
- **Safeguards:** Does not trigger when stationary in open space, does not trigger when already moving away, and includes a 3.5s cooldown to prevent forward/reverse oscillation.

### 5. Police Pursuit & 10-Minute Escalation (Zero Spike Strips)
- **Blue Standard Police Patrol Cruisers:**
  - Active from the start of the getaway.
  - Recognizable blue-and-white livery, blue emergency lightbar, and sirens.
- **Black Advanced Police Interceptors:**
  - Introduced at **10 minutes (600 seconds)** of active gameplay.
  - Tactical black bodywork, heavy ramming bull-bar, higher speed, greater durability (160 HP), and red/amber lightbar.
  - HUD Warning displayed: `⚠️ WARNING: ADVANCED BLACK PURSUIT UNITS DEPLOYED!`.
- **Subsequent 10-Minute Escalation:**
  - Pursuit intensity escalates at 20m, 30m, etc.
  - Standard blue police cars remain in pursuit alongside black units.
  - Active gameplay timer stops while paused or on the game-over screen.
- **NO SPIKE STRIPS:** Strictly zero spike strips anywhere in the game. Police rely exclusively on vehicular maneuvers and pursuit pressure.

### 6. Exactly Three Abilities with Independent 150-Second Cooldowns
Each ability operates on an independent 150-second (2m 30s) cooldown:
1. **Titan Tank (`1` / `Q`):**
   - Transforms the vehicle into an armored tracked battle tank for 10 seconds.
   - Smashes destructibles effortlessly and obliterates pursuing police cruisers on contact.
2. **Oil Slick (`2` / `E`):**
   - Deploys an iridescent oil slick behind the vehicle lasting 14 seconds.
   - Any pursuing police car that crosses it enters a 360-degree spinout and loses traction. Does not affect the player.
3. **Electric Shock (`3` / `R`):**
   - Discharges a 280px radius EMP shockwave with blue electrical arcs.
   - Stuns all police vehicles within the radius for 4.0 seconds.
- **Cooldown Display:** Real-time countdown (`MM:SS`) overlaid on each ability button in the HUD. Attempting to use an ability on cooldown displays instant visual feedback (`ON COOLDOWN`).
- **Pause Behavior:** Cooldowns pause when gameplay is paused.

---

## 🕹️ Controls Architecture

### Desktop & Laptop Browsers (Mouse-Driven Steering)
- **Mouse Movement:** Smoothly steer the vehicle towards the cursor. Pointer angle relative to the car provides intuitive, analog steering with angular damping.
- **Right Mouse Button (Hold):** Throttle / Nitro acceleration boost. Context menu is disabled only over the active canvas.
- **Automatic Forward Drive:** The car continuously cruises forward once the run begins without requiring a button to be held constantly.
- **Keyboard Fallback (Optional):** `W` / `Up` (Throttle Boost), `S` / `Down` (Brake/Reverse), `A` / `D` or Arrows (Steer), `Space` (Handbrake Drift).
- **Abilities:** `1` or `Q` (Titan Tank), `2` or `E` (Oil Slick), `3` or `R` (Electric Shock).
- **Pause:** `Esc` or `P`.
- **Zero touch buttons or steering circles appear on desktop.**

### Mobile & Tablet Browsers (One Circular Touch Ring)
- **Circular Touch Control (Bottom-Right):** Translucent white circular outline located ~1.5 inches above the bottom-right edge. Touch and drag left/right to steer. Internal area is transparent so the road remains visible beneath.
- **Automatic Forward Drive:** No gas button required.
- **Touch Abilities (Bottom-Left):** Dedicated thumb dock for Titan Tank, Oil Slick, and Electric Shock.
- **Device Capability Detection:** Device input is detected dynamically via `'ontouchstart' in window || navigator.maxTouchPoints > 0`. Desktop displays zero touch buttons.

---

## 📐 Academic Computer Graphics Documentation

| Graphics Principle | Implementation File & Function | Description |
|---|---|---|
| **2D Output Primitives** | `src/player.js` (`drawCar`), `src/maps.js` (`drawRoads`, `drawBuildings`), `src/particles.js` | Uses Canvas 2D rasterization primitives (`fillRect`, `roundRect`, `arc`, `ellipse`, `lineTo`, `bezierCurveTo`). |
| **Matrix Transformations** | `src/camera.js` (`apply`, `restore`), `src/player.js` (`draw`), `src/garage.js` (`renderTurntable`) | Implements canvas coordinate stack (`ctx.save()`, `ctx.translate()`, `ctx.rotate()`, `ctx.scale()`, `ctx.restore()`) for local-to-world and world-to-screen transforms. |
| **Real-Time Animation** | `src/game.js` (`loop`) | Driven by `window.requestAnimationFrame` with delta-time (`dt`) clamping to prevent physics tunneling. |
| **Smooth Rendering & Interpolation** | `src/camera.js` (`update`), `src/player.js` (`update`), `src/controls.js` (`update`) | Exponential lerp smoothing for camera follow, wheel turn angle (`steerAngle`), lateral drift slip, and steering input. |
| **Color, Shading & Gradients** | `src/player.js` (`drawCar`), `src/abilities.js` (`draw`), `src/maps.js` (`drawRiver`), `src/garage.js` | Uses linear gradients for metallic vehicle specular reflection, radial gradients for glowing headlights and EMP rings, and translucent drop shadows for pseudo-3D elevation. |
| **Follow Camera & Projection** | `src/camera.js` (`Camera`) | Implements an oriented follow camera with dynamic lookahead vector, screen-shake impulse decay, and screen-to-world / world-to-screen coordinate inversion. |
| **Spatial Partitioning Collision** | `src/maps.js` (`buildSpatialGrid`, `getNearbyDestructibles`), `src/collisions.js` | Uses uniform grid spatial partitioning ($250 \times 250$ px cells) for $O(1)$ collision lookups against 1,000+ destructibles at 60 FPS. |
| **Particle Physics Simulation** | `src/particles.js` (`ParticleManager`) | Simulates 3D parabolic trajectory with gravity, ground bounce coefficients, angular velocity rotation, and alpha dissipation for wood splinters, sparks, smoke, and weather. |
| **Input Coordinate Mapping** | `src/controls.js` (`update`, `updateTouchSteer`) | Maps screen pointer coordinates to relative directional vectors, normalized angular deltas, and deadzone filtering. |
| **Floating HUD Text** | `src/particles.js` (`drawFloatingTexts`) | Renders animated floating score/cash indicators with scale bounce and vertical drift. |

---

## 📁 GitHub-Ready Project Structure

```text
neon-getaway/
├── index.html              # HTML5 entry, responsive arcade HUD, garage turntable, modals
├── style.css               # Modern arcade glassmorphism, responsive grid, and health bar styling
├── README.md               # Complete documentation, setup guide, and CG requirements
├── .gitignore              # Git ignore rules
├── LICENSE                 # MIT License
├── package.json            # npm metadata, test script, and ES module specification
├── assets/
│   ├── images/
│   ├── audio/
│   └── fonts/
├── src/
│   ├── main.js             # Application entry point
│   ├── config.js           # Configurable title, car definitions, map settings, timings
│   ├── game.js             # Master game coordinator, state machine, and update/render loops
│   ├── player.js           # Player vehicle physics, 2.5D rendering, drifting, and Tank mode
│   ├── police.js           # Blue standard & Black advanced pursuit vehicles with 10m escalation
│   ├── maps.js             # Three seasonal maps: Winter, Summer, Spring
│   ├── abilities.js        # Tank, Oil Slick, and Electric Shock with independent 150s cooldowns
│   ├── collisions.js       # Collision detection and response engine
│   ├── controls.js         # Desktop mouse steering and mobile circular touch ring
│   ├── garage.js           # Garage showroom turntable and vehicle purchase/selection
│   ├── damage.js           # Vehicle damage calculation, contact tracking, and health bar states
│   ├── recovery.js         # Automatic reverse recovery system for stuck situations
│   ├── scoring.js          # Score, cash, combo tracking, and lifetime run statistics
│   ├── camera.js           # 2.5D smooth follow camera with lookahead and screen shake
│   ├── particles.js        # Multi-type particle physics, debris, skid trails, floating text
│   ├── audio.js            # Web Audio API procedural sound synthesizer
│   └── storage.js          # LocalStorage persistence for player progress
├── test/
│   └── game-test.js        # Automated Node.js unit test suite
└── docs/
    └── gameplay.md         # Comprehensive gameplay and mechanics guide
```

---

## 🚀 Local Run Instructions

### Option 1: VS Code Live Server
1. Open the project folder in VS Code.
2. Right-click `index.html` and click **Open with Live Server**.
3. The game will launch in your default browser at `http://127.0.0.1:5500/`.

### Option 2: Python Built-in HTTP Server
```bash
# Navigate to the project directory
cd neon-getaway

# Run Python HTTP server
python -m http.server 8080

# Open in browser
http://localhost:8080
```

### Option 3: Node / npm
```bash
# Run automated test suite
npm test

# Run local development server
npm start
# or
npx serve -l 3000 .
```

---

## 📤 GitHub Upload Instructions (via VS Code)

1. **Open Folder in VS Code:** Open the `neon-getaway` directory in VS Code.
2. **Open Source Control:** Click the Source Control icon on the left activity bar (or press `Ctrl+Shift+G`).
3. **Initialize Repository (if needed):** If Git is not initialized, click **Initialize Repository**.
4. **Stage Changes:** Click the `+` icon next to **Changes** to stage all files.
5. **Commit:** Type a commit message (e.g., `feat: complete Neon Getaway: Destruction Run game`) and click **Commit** (or press `Ctrl+Enter`).
6. **Connect to GitHub Remote:**
   - Open terminal (`Ctrl+~`) or click **Publish Branch** in VS Code.
   - Alternatively run:
     ```bash
     git remote add origin https://github.com/<your-username>/<your-repo-name>.git
     git branch -M main
     git push -u origin main
     ```
7. **Deploy:** Choose your preferred hosting provider below.

---

## 🌐 Public Website Deployment Guide

### Deploy to GitHub Pages
1. Push your code to GitHub following the instructions above.
2. In your GitHub repository, navigate to **Settings > Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Select the `main` branch and `/ (root)` folder, then click **Save**.
5. Your game will be live within 1–2 minutes at `https://<your-username>.github.io/<your-repo-name>/`.

### Deploy to Vercel
1. Install Vercel CLI: `npm i -g vercel`.
2. Run `vercel` in the project root.
3. Select default settings; the game deploys in ~10 seconds.

### Deploy to Netlify
1. Drag and drop the `neon-getaway` directory into [Netlify Drop](https://app.netlify.com/drop).
2. Instant static site published!

---

## 🧪 Required Testing Checklist (30/30 Verified)

- [x] **1. Game starts and plays correctly:** `index.html` loads, menus open, runs initiate seamlessly.
- [x] **2. Mouse movement steers car on desktop:** Directional angle mapped with smooth angular damping.
- [x] **3. Right-click activates throttle action:** Increases speed to boost speed with tire smoke.
- [x] **4. No circular touch control appears on desktop:** Touch ring hidden on desktop devices.
- [x] **5. One circular steering control appears on mobile:** Single translucent white circle displayed bottom-right (~75–95px from bottom).
- [x] **6. Touch-and-drag steering works on mobile:** Smooth steering with automatic recentering on touch release.
- [x] **7. Forward driving happens automatically:** Vehicle cruises forward without holding gas.
- [x] **8. Destructible objects award cash correctly:** Fences, crates, barrels, signs, hay bales, stalls, and rocks award cash.
- [x] **9. Cash persists after refreshing page:** Saved and loaded from LocalStorage.
- [x] **10. Exactly four purchasable car models exist:** Starter Compact, Street Racer, Muscle Car, Supercar.
- [x] **11. Car purchases deduct correct amount:** Verified in garage view and test suite.
- [x] **12. All three seasonal maps load correctly:** Winter Wonderland, Summer County, Spring Valley.
- [x] **13. Vehicle health decreases according to collision severity:** Minor, moderate, and significant damage based on speed.
- [x] **14. High-speed wall collisions cause substantial damage:** High impact reduces health by 40–60+ HP.
- [x] **15. Automatic reverse activates after ~2s stuck:** Reverses away with angular turn offset.
- [x] **16. Automatic recovery does not loop endlessly:** 3.5s cooldown prevents oscillation.
- [x] **17. Standard police cars are blue:** Blue & white bodywork, blue lightbar, and sirens.
- [x] **18. Black police cars appear after 10 minutes:** Unlocked at 600s active gameplay with warning banner.
- [x] **19. Police escalation occurs at subsequent 10-minute intervals:** Tier increments every 600s.
- [x] **20. Pause stops the police escalation timer:** Active timer halts during pause.
- [x] **21. Police never deploy spike strips:** Zero spike strips in entire codebase.
- [x] **22. Tank, Oil Slick, and Electric Shock work:** All three abilities functional.
- [x] **23. Each ability has independent 150-second cooldown:** Verified in code and test suite.
- [x] **24. Cooldowns stop while the game is paused:** Timers halt during pause.
- [x] **25. Game over occurs when vehicle health reaches zero:** Explosion triggers and game over modal displays.
- [x] **26. Restart resets run without deleting saved progress:** Cash and unlocked cars remain safe.
- [x] **27. Desktop and mobile layouts work properly:** Tested across viewport sizes and orientations.
- [x] **28. Production build completes without unresolved errors:** Verified with `node test/game-test.js` (0 errors).
- [x] **29. No required assets are missing:** Procedural audio & canvas graphics ensure 100% self-contained operation.
- [x] **30. GitHub-ready project can be uploaded and deployed:** Git repository initialized, committed, and ready.
