# Gameplay Guide: Neon Getaway: Destruction Run

## 1. Overview
**Neon Getaway: Destruction Run** is an arcade driving and destruction getaway game inspired by Smash Bandits Racing. Players drive freely through open seasonal county maps, smashing destructible roadside scenery for cash bounties, evading dynamic police pursuit cruisers, managing car health, and using powerful tactical abilities to escape.

---

## 2. Vehicles & Garage Progression
The garage features exactly four purchasable vehicles:

1. **Neon Compact (Starter Compact):** Free ($0). Balanced handling, moderate top speed (380), durable hot-hatch chassis.
2. **Drift Phantom (Street Racer):** $2,500. Tuner widebody, aggressive rear wing spoiler, rapid turbo acceleration (540), and sharp steering (turn rate 4.4).
3. **V8 Crusher (Muscle Car):** $6,000. Heavy supercharged American muscle. Massive durability (190 HP, 1.8 armor) designed to plow through obstacles and ram police with double impact force.
4. **Apex Hyperion (Supercar):** $12,000. Exotic aerodynamic wedge. Blistering top speed (500), extreme acceleration (660), and precision handling.

---

## 3. Seasonal Maps (Exactly Three)

1. **Winter Wonderland (Map 0):**
   - Snow-covered roads, pine forests, frozen log cabins, and snowbanks.
   - Slower tire friction (`traction: 0.82`), extended drift glides, white snow spray from wheels, and falling snow particles.
2. **Summer County (Map 1):**
   - Sun-drenched farmlands, red barns, silos, farm fences, and hay bales.
   - Fast asphalt grip (`traction: 1.0`), off-road dirt friction, and dust plumes.
3. **Spring Valley (Map 2):**
   - Blossom cherry trees, scenic river waterways with wooden bridges, and roadside flower stalls.
   - Smooth curved roadways (`traction: 0.94`) designed for chaining high-speed drifts with falling petal weather.

---

## 4. Vehicle Damage & Health Bar
- **Health Bar:** Displayed in the top-right HUD. Starts at 100% (Green).
- **Damage Severity:**
  - Low-speed impacts (<100 speed): Minor damage (5–10 HP).
  - Medium-speed impacts (100–260 speed): Moderate damage (12–28 HP).
  - High-speed impacts (>260 speed): Substantial damage (32–64+ HP). Hitting a solid wall at top speed deals severe damage!
- **Durability Factor:** Heavy armor on the Muscle Car absorbs substantial damage.
- **Tank Armor:** The temporary Tank ability grants 85% damage reduction while active, but does not grant permanent invulnerability.
- **Anti-Spam Contact Tracking:** Collision tracking prevents continuous damage while resting in contact with the same wall.
- **Vehicle Wrecked:** At 0% HP, the car explodes into a flaming wreck, driving halts, and the run ends with complete statistics recorded.

---

## 5. Automatic Reverse Recovery
- **Stuck Detection:** If the vehicle presses against a solid building/obstacle with negligible displacement (<15 px/s) while attempting forward movement for approximately 1.8–2.0 seconds.
- **Action:** Engages automatic reverse for ~1.2s with a recovery turn angle to disengage from the obstacle.
- **HUD Notification:** Displays `AUTO RECOVERY: REVERSING...`.
- **Safeguards:** Does not trigger in open space, does not trigger when already moving away, and features a 3.5s cooldown to prevent forward/reverse oscillation.

---

## 6. Police Pursuit & Time-Based Escalation
- **Standard Blue Police Patrol Cruisers:**
  - Active from the start of the getaway.
  - Recognizable blue-and-white livery, blue emergency lightbar, and sirens.
  - Agile pursuit and PIT maneuver attempts.
- **Advanced Black Police Interceptors:**
  - Deployed after **10 minutes (600 seconds)** of active gameplay.
  - Sleek black tactical bodywork, heavy ramming bull-bar, higher top speed, greater durability (160 HP), and red/amber lightbar.
  - Announcement displayed: `⚠️ WARNING: ADVANCED BLACK PURSUIT UNITS DEPLOYED!`.
- **Subsequent 10-Minute Escalation:**
  - Pursuit intensity and black unit quotas escalate at 20 minutes, 30 minutes, etc.
  - Standard blue police cars remain in the pursuit alongside black units.
  - Active gameplay timer stops during pause or game-over.
- **NO Spike Strips:** Strictly zero spike strips are deployed by police.

---

## 7. Special Abilities (Independent 150-Second Cooldowns)
Each ability operates with an independent 150-second (2m 30s) cooldown:

1. **Titan Tank (`1` / `Q`):**
   - Transforms the vehicle into an armored tracked battle tank for 10 seconds.
   - Smashes destructibles effortlessly and obliterates pursuing police cars into flaming wrecks on contact.
2. **Oil Slick (`2` / `E`):**
   - Deploys an iridescent oil slick behind the vehicle lasting 14 seconds.
   - Any pursuing police car that crosses it enters a 360-degree spinout and loses traction. Does not affect the player.
3. **Electric Shock (`3` / `R`):**
   - Releases a 280px radius EMP shockwave with blue electrical arcs.
   - Stuns all police vehicles within the radius for 4.0 seconds.
- **Cooldown Display:** Real-time countdown (`MM:SS`) overlaid on each icon in the HUD. Attempting to use an ability on cooldown displays instant visual feedback (`ON COOLDOWN`).

---

## 8. Controls Reference

### Desktop
| Action | Input |
|---|---|
| Steer Vehicle | Mouse Movement |
| Throttle / Boost | Hold Right Mouse Button |
| Cruising Drive | Automatic |
| Alternative Driving | WASD or Arrow Keys |
| Handbrake / Drift | Spacebar |
| Titan Tank | Key 1 or Q |
| Oil Slick | Key 2 or E |
| Electric Shock | Key 3 or R |
| Pause / Resume | Esc or P |

### Mobile
| Action | Input |
|---|---|
| Steer Left / Right | Touch & Drag Circular Ring (Bottom-Right) |
| Cruising Drive | Automatic (no gas button needed) |
| Titan Tank | Tap Tank Icon (Bottom-Left) |
| Oil Slick | Tap Oil Icon (Bottom-Left) |
| Electric Shock | Tap EMP Icon (Bottom-Left) |
| Pause | Tap Pause Icon (Top-Right) |
