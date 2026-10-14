// map.js - Three distinct seasonal maps (Winter, Summer, Spring), road network, scenery, and destructibles
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

export class GameMap {
    constructor(mapIndex = 0) {
        this.width = 4200;
        this.height = 4200;
        this.cellSize = 250;
        this.cols = Math.ceil(this.width / this.cellSize);
        this.rows = Math.ceil(this.height / this.cellSize);

        this.setMapIndex(mapIndex);
    }

    setMapIndex(index) {
        this.index = (index >= 0 && index < MAP_CONFIGS.length) ? index : 0;
        this.config = MAP_CONFIGS[this.index];
        this.id = this.config.id;
        this.name = this.config.name;
        this.theme = this.config.theme;
        this.surfaceTraction = this.config.surfaceTraction;

        // Generate geometry, roads, buildings, and destructibles
        this.generateRoads();
        this.generateBuildings();
        this.generateSceneryAndDestructibles();
        this.buildSpatialGrid();
    }

    generateRoads() {
        this.roads = [];
        this.roadWidth = 140;

        // Highway Grid & Scenic Loops
        // 1. Main North-South Central Arterial
        this.addRoad(2100, 200, 2100, 4000, 160);

        // 2. East-West Major Crossway
        this.addRoad(300, 2100, 3900, 2100, 160);

        // 3. North Loop Highway
        this.addRoad(700, 700, 3500, 700, 140);

        // 4. South Loop Highway
        this.addRoad(700, 3400, 3500, 3400, 140);

        // 5. West Outer Highway
        this.addRoad(700, 700, 700, 3400, 140);

        // 6. East Outer Highway
        this.addRoad(3500, 700, 3500, 3400, 140);

        // 7. Diagonal scenic connector routes (great for drifting!)
        this.addRoad(700, 2100, 1400, 1400, 120);
        this.addRoad(1400, 1400, 2100, 1400, 120);
        this.addRoad(2100, 1400, 2800, 1400, 120);
        this.addRoad(2800, 1400, 3500, 2100, 120);

        this.addRoad(700, 2100, 1400, 2800, 120);
        this.addRoad(1400, 2800, 2100, 2800, 120);
        this.addRoad(2100, 2800, 2800, 2800, 120);
        this.addRoad(2800, 2800, 3500, 2100, 120);

        // River for Spring Valley & Summer County (Bridge crossings)
        this.river = {
            points: [
                { x: 200, y: 1700 },
                { x: 1200, y: 1750 },
                { x: 2100, y: 1800 },
                { x: 3000, y: 1750 },
                { x: 4000, y: 1700 }
            ],
            width: 90
        };
    }

    addRoad(x1, y1, x2, y2, width = 140) {
        this.roads.push({
            x1, y1, x2, y2,
            width,
            halfW: width / 2,
            length: Math.hypot(x2 - x1, y2 - y1),
            angle: Math.atan2(y2 - y1, x2 - x1)
        });
    }

    isOnRoad(x, y) {
        // Fast bounding circle check against road segments
        for (let i = 0; i < this.roads.length; i++) {
            const r = this.roads[i];
            const dist = this.distToSegment(x, y, r.x1, r.y1, r.x2, r.y2);
            if (dist <= r.halfW) return true;
        }
        return false;
    }

    distToSegment(px, py, x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const lenSq = dx * dx + dy * dy;
        if (lenSq === 0) return Math.hypot(px - x1, py - y1);

        let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
        t = Math.max(0, Math.min(1, t));
        const projX = x1 + t * dx;
        const projY = y1 + t * dy;
        return Math.hypot(px - projX, py - projY);
    }

    generateBuildings() {
        this.buildings = [];
        // Hard unbreakable structures (barns, cabins, warehouses) positioned off the roads
        const buildingSpots = [
            // Northwest Sector
            { x: 1100, y: 1000, w: 160, h: 120, type: 'barn' },
            { x: 1700, y: 1000, w: 140, h: 140, type: 'cabin' },
            { x: 1000, y: 1700, w: 180, h: 110, type: 'warehouse' },

            // Northeast Sector
            { x: 2500, y: 1000, w: 150, h: 130, type: 'cabin' },
            { x: 3100, y: 1000, w: 170, h: 120, type: 'barn' },
            { x: 3200, y: 1700, w: 190, h: 130, type: 'warehouse' },

            // Southwest Sector
            { x: 1100, y: 2500, w: 160, h: 130, type: 'cabin' },
            { x: 1700, y: 2500, w: 150, h: 120, type: 'barn' },
            { x: 1100, y: 3100, w: 180, h: 140, type: 'warehouse' },

            // Southeast Sector
            { x: 2500, y: 2500, w: 140, h: 120, type: 'cabin' },
            { x: 3100, y: 2500, w: 170, h: 130, type: 'barn' },
            { x: 3100, y: 3100, w: 190, h: 140, type: 'warehouse' },

            // Central Waystation Complex
            { x: 1800, y: 1800, w: 130, h: 110, type: 'cabin' },
            { x: 2400, y: 1800, w: 130, h: 110, type: 'cabin' },
            { x: 1800, y: 2400, w: 130, h: 110, type: 'cabin' },
            { x: 2400, y: 2400, w: 130, h: 110, type: 'cabin' }
        ];

        for (let i = 0; i < buildingSpots.length; i++) {
            const b = buildingSpots[i];
            this.buildings.push({
                id: `bld_${i}`,
                x: b.x,
                y: b.y,
                w: b.w,
                h: b.h,
                halfW: b.w / 2,
                halfH: b.h / 2,
                type: b.type
            });
        }
    }

    generateSceneryAndDestructibles() {
        this.destructibles = [];
        this.trees = [];

        let objId = 0;
        const addDestructible = (type, x, y, hp, cash, score) => {
            let w = 24;
            let h = 24;
            let radius = 16;
            if (type === 'fence') { w = 46; h = 12; radius = 22; }
            else if (type === 'sign') { w = 32; h = 14; radius = 18; }
            else if (type === 'stall') { w = 48; h = 32; radius = 26; }
            else if (type === 'haybale') { w = 28; h = 28; radius = 16; }

            this.destructibles.push({
                id: `dest_${objId++}`,
                type,
                x, y,
                w, h,
                radius,
                hp,
                maxHp: hp,
                cashReward: cash,
                scoreReward: score,
                destroyed: false,
                destroyTime: 0
            });
        };

        // 1. Roadside Fences (Plentiful smashable wooden fences lining highways)
        for (let i = 0; i < this.roads.length; i++) {
            const r = this.roads[i];
            const cos = Math.cos(r.angle);
            const sin = Math.sin(r.angle);
            const normalX = -sin;
            const normalY = cos;
            const fenceOffset = r.halfW + 24;

            const step = 85;
            for (let dist = 80; dist < r.length - 80; dist += step) {
                const px = r.x1 + cos * dist;
                const py = r.y1 + sin * dist;

                // Alternate fence sections on left and right shoulder
                if (Math.random() > 0.35) {
                    addDestructible('fence', px + normalX * fenceOffset, py + normalY * fenceOffset, 15, 30, 100);
                }
                if (Math.random() > 0.35) {
                    addDestructible('fence', px - normalX * fenceOffset, py - normalY * fenceOffset, 15, 30, 100);
                }
            }
        }

        // 2. Road Signs & Detour Boards at junctions
        const signLocations = [
            { x: 2100, y: 700 }, { x: 2100, y: 3400 },
            { x: 700, y: 2100 }, { x: 3500, y: 2100 },
            { x: 1400, y: 1400 }, { x: 2800, y: 1400 },
            { x: 1400, y: 2800 }, { x: 2800, y: 2800 },
            { x: 2100, y: 1400 }, { x: 2100, y: 2800 },
            { x: 1400, y: 2100 }, { x: 2800, y: 2100 }
        ];

        for (const loc of signLocations) {
            addDestructible('sign', loc.x + 85, loc.y + 85, 20, 100, 250);
            addDestructible('sign', loc.x - 85, loc.y - 85, 20, 100, 250);
        }

        // 3. Crates & Barrels clustered near buildings and crossways
        for (const b of this.buildings) {
            // Clusters around buildings
            addDestructible('crate', b.x - b.halfW - 25, b.y, 25, 50, 150);
            addDestructible('crate', b.x + b.halfW + 25, b.y, 25, 50, 150);
            addDestructible('barrel', b.x, b.y - b.halfH - 25, 30, 80, 200);
            addDestructible('barrel', b.x, b.y + b.halfH + 25, 30, 80, 200);

            // Season specific props
            if (this.theme === 'summer') {
                addDestructible('haybale', b.x - b.halfW - 35, b.y - b.halfH - 35, 20, 60, 180);
                addDestructible('haybale', b.x + b.halfW + 35, b.y + b.halfH + 35, 20, 60, 180);
            } else if (this.theme === 'spring') {
                addDestructible('stall', b.x - b.halfW - 45, b.y + 10, 45, 150, 400);
                addDestructible('flowerpot', b.x + b.halfW + 30, b.y - 15, 15, 40, 120);
                addDestructible('flowerpot', b.x + b.halfW + 30, b.y + 15, 15, 40, 120);
            } else if (this.theme === 'winter') {
                addDestructible('rock', b.x - b.halfW - 35, b.y - b.halfH - 35, 35, 120, 300);
                addDestructible('rock', b.x + b.halfW + 35, b.y + b.halfH + 35, 35, 120, 300);
            }
        }

        // 4. Environmental Trees (Pine for Winter, Oak for Summer, Blossom for Spring)
        const treeCount = 280;
        for (let i = 0; i < treeCount; i++) {
            const tx = Math.random() * (this.width - 200) + 100;
            const ty = Math.random() * (this.height - 200) + 100;

            // Don't spawn trees directly on roads
            if (!this.isOnRoad(tx, ty)) {
                this.trees.push({
                    x: tx,
                    y: ty,
                    size: Math.random() * 24 + 32,
                    type: this.theme
                });
            }
        }
    }

    buildSpatialGrid() {
        this.grid = new Array(this.cols * this.rows).fill(null).map(() => []);

        // Insert destructibles into grid
        for (let i = 0; i < this.destructibles.length; i++) {
            const d = this.destructibles[i];
            const col = Math.floor(d.x / this.cellSize);
            const row = Math.floor(d.y / this.cellSize);
            if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
                const cellIndex = row * this.cols + col;
                this.grid[cellIndex].push(d);
            }
        }
    }

    getNearbyDestructibles(x, y, radius = 160) {
        const minCol = Math.max(0, Math.floor((x - radius) / this.cellSize));
        const maxCol = Math.min(this.cols - 1, Math.floor((x + radius) / this.cellSize));
        const minRow = Math.max(0, Math.floor((y - radius) / this.cellSize));
        const maxRow = Math.min(this.rows - 1, Math.floor((y + radius) / this.cellSize));

        const nearby = [];
        for (let r = minRow; r <= maxRow; r++) {
            for (let c = minCol; c <= maxCol; c++) {
                const cell = this.grid[r * this.cols + c];
                for (let i = 0; i < cell.length; i++) {
                    nearby.push(cell[i]);
                }
            }
        }
        return nearby;
    }

    draw(ctx, camera) {
        // 1. Base Terrain
        ctx.fillStyle = this.config.groundColor;
        ctx.fillRect(0, 0, this.width, this.height);

        // Ground decorative texture patches
        this.drawGroundDetails(ctx, camera);

        // 2. River & Bridge (Spring & Summer)
        if (this.theme === 'spring' || this.theme === 'summer') {
            this.drawRiver(ctx, camera);
        }

        // 3. Roads & Intersections
        this.drawRoads(ctx, camera);

        // 4. Bridges over river
        if (this.theme === 'spring' || this.theme === 'summer') {
            this.drawBridges(ctx, camera);
        }

        // 5. Buildings
        this.drawBuildings(ctx, camera);

        // 6. Destructibles
        this.drawDestructibles(ctx, camera);

        // 7. Trees & Scenery Foliage
        this.drawTrees(ctx, camera);
    }

    drawGroundDetails(ctx, camera) {
        ctx.save();
        ctx.fillStyle = this.config.groundAccent;

        // Subtle decorative grass/snow grid patches
        const step = 300;
        for (let x = 100; x < this.width; x += step) {
            for (let y = 100; y < this.height; y += step) {
                if (!camera.isVisible(x, y, 120)) continue;
                ctx.beginPath();
                ctx.arc(x, y, 45, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();
    }

    drawRiver(ctx, camera) {
        ctx.save();
        ctx.strokeStyle = this.theme === 'spring' ? '#4ba3e3' : '#398bbd';
        ctx.lineWidth = this.river.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        const pts = this.river.points;
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
            ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.stroke();

        // River water highlights
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 6;
        ctx.stroke();
        ctx.restore();
    }

    drawRoads(ctx, camera) {
        ctx.save();

        for (let i = 0; i < this.roads.length; i++) {
            const r = this.roads[i];
            const midX = (r.x1 + r.x2) / 2;
            const midY = (r.y1 + r.y2) / 2;
            if (!camera.isVisible(midX, midY, r.length / 2 + 100)) continue;

            // Road border shoulder
            ctx.strokeStyle = this.config.roadBorderColor;
            ctx.lineWidth = r.width + 12;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(r.x1, r.y1);
            ctx.lineTo(r.x2, r.y2);
            ctx.stroke();

            // Main asphalt pavement
            ctx.strokeStyle = this.config.roadColor;
            ctx.lineWidth = r.width;
            ctx.stroke();

            // Dashed center line
            ctx.strokeStyle = this.config.roadLineColor;
            ctx.lineWidth = 4;
            ctx.setLineDash([25, 30]);
            ctx.beginPath();
            ctx.moveTo(r.x1, r.y1);
            ctx.lineTo(r.x2, r.y2);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        ctx.restore();
    }

    drawBridges(ctx, camera) {
        // Draw wooden bridge over the central intersection if crossing river
        const bridgeX = 2100;
        const bridgeY = 1800;
        if (!camera.isVisible(bridgeX, bridgeY, 150)) return;

        ctx.save();
        ctx.fillStyle = '#6d4c41';
        ctx.fillRect(bridgeX - 85, bridgeY - 60, 170, 120);

        // Wood planks
        ctx.fillStyle = '#4e342e';
        for (let y = bridgeY - 55; y <= bridgeY + 55; y += 15) {
            ctx.fillRect(bridgeX - 85, y, 170, 3);
        }
        // Guardrails
        ctx.fillStyle = '#8d6e63';
        ctx.fillRect(bridgeX - 85, bridgeY - 60, 12, 120);
        ctx.fillRect(bridgeX + 73, bridgeY - 60, 12, 120);
        ctx.restore();
    }

    drawBuildings(ctx, camera) {
        ctx.save();

        for (let i = 0; i < this.buildings.length; i++) {
            const b = this.buildings[i];
            if (!camera.isVisible(b.x, b.y, Math.max(b.w, b.h) + 80)) continue;

            // 1. Drop shadow (Angled 2.5D)
            ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
            ctx.fillRect(b.x - b.halfW + 12, b.y - b.halfH + 16, b.w, b.h);

            // 2. Building Walls (Slightly darker facade)
            let wallColor = '#8d6e63';
            let roofColor = '#c0392b';

            if (b.type === 'barn') {
                wallColor = '#a83232';
                roofColor = '#7a1c1c';
            } else if (b.type === 'warehouse') {
                wallColor = '#7f8c8d';
                roofColor = '#34495e';
            } else if (b.type === 'cabin') {
                wallColor = this.theme === 'winter' ? '#5d4037' : '#8d6e63';
                roofColor = this.theme === 'winter' ? '#ecf0f1' : '#b03a2e'; // Snow on roof in winter!
            }

            // Facade
            ctx.fillStyle = wallColor;
            ctx.fillRect(b.x - b.halfW, b.y - b.halfH, b.w, b.h);

            // Roof with 2.5D ridge
            ctx.fillStyle = roofColor;
            ctx.fillRect(b.x - b.halfW + 8, b.y - b.halfH + 8, b.w - 16, b.h - 16);

            // Roof Ridge highlight
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(b.x, b.y - b.halfH + 8);
            ctx.lineTo(b.x, b.y + b.halfH - 8);
            ctx.stroke();
        }

        ctx.restore();
    }

    drawDestructibles(ctx, camera) {
        ctx.save();

        for (let i = 0; i < this.destructibles.length; i++) {
            const d = this.destructibles[i];
            if (d.destroyed) continue; // Don't draw intact model if smashed
            if (!camera.isVisible(d.x, d.y, 60)) continue;

            // Drop shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
            ctx.beginPath();
            ctx.ellipse(d.x + 3, d.y + 4, d.radius * 0.8, d.radius * 0.45, 0, 0, Math.PI * 2);
            ctx.fill();

            if (d.type === 'fence') {
                // Wooden rail fence
                ctx.fillStyle = '#8b5a2b';
                ctx.fillRect(d.x - 22, d.y - 4, 44, 8);
                // Posts
                ctx.fillStyle = '#5c3a21';
                ctx.fillRect(d.x - 20, d.y - 6, 6, 12);
                ctx.fillRect(d.x - 3, d.y - 6, 6, 12);
                ctx.fillRect(d.x + 14, d.y - 6, 6, 12);
            } else if (d.type === 'crate') {
                // Wooden cargo crate
                ctx.fillStyle = '#b58a57';
                ctx.fillRect(d.x - 12, d.y - 12, 24, 24);
                ctx.strokeStyle = '#6d4825';
                ctx.lineWidth = 2;
                ctx.strokeRect(d.x - 12, d.y - 12, 24, 24);
                // X cross
                ctx.beginPath();
                ctx.moveTo(d.x - 10, d.y - 10);
                ctx.lineTo(d.x + 10, d.y + 10);
                ctx.moveTo(d.x + 10, d.y - 10);
                ctx.lineTo(d.x - 10, d.y + 10);
                ctx.stroke();
            } else if (d.type === 'barrel') {
                // Red or blue fuel barrel
                ctx.fillStyle = '#e74c3c';
                ctx.beginPath();
                ctx.arc(d.x, d.y, 11, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#7f8c8d';
                ctx.lineWidth = 2.5;
                ctx.stroke();
                // Center bung cap
                ctx.fillStyle = '#34495e';
                ctx.fillRect(d.x - 3, d.y - 3, 6, 6);
            } else if (d.type === 'sign') {
                // Highway or detour sign
                ctx.fillStyle = '#f39c12';
                ctx.beginPath();
                ctx.roundRect(d.x - 14, d.y - 10, 28, 20, 3);
                ctx.fill();
                ctx.strokeStyle = '#d35400';
                ctx.lineWidth = 2;
                ctx.stroke();
                // Arrow symbol
                ctx.fillStyle = '#2c3e50';
                ctx.beginPath();
                ctx.moveTo(d.x + 6, d.y);
                ctx.lineTo(d.x - 4, d.y - 5);
                ctx.lineTo(d.x - 4, d.y + 5);
                ctx.closePath();
                ctx.fill();
            } else if (d.type === 'haybale') {
                // Golden farm hay bale
                ctx.fillStyle = '#f1c40f';
                ctx.beginPath();
                ctx.arc(d.x, d.y, 13, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#d4ac0d';
                ctx.lineWidth = 3;
                ctx.stroke();
            } else if (d.type === 'flowerpot') {
                // Terracotta planter with flowers
                ctx.fillStyle = '#d35400';
                ctx.beginPath();
                ctx.arc(d.x, d.y, 10, 0, Math.PI * 2);
                ctx.fill();
                // Flowers
                ctx.fillStyle = '#ff69b4';
                ctx.beginPath();
                ctx.arc(d.x - 2, d.y - 2, 4, 0, Math.PI * 2);
                ctx.arc(d.x + 3, d.y + 2, 4, 0, Math.PI * 2);
                ctx.fill();
            } else if (d.type === 'stall') {
                // Roadside produce stall
                ctx.fillStyle = '#e67e22';
                ctx.fillRect(d.x - 22, d.y - 14, 44, 28);
                // Striped awning
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(d.x - 22, d.y - 14, 11, 28);
                ctx.fillRect(d.x, d.y - 14, 11, 28);
            } else if (d.type === 'rock') {
                // Boulder
                ctx.fillStyle = '#7f8c8d';
                ctx.beginPath();
                ctx.arc(d.x, d.y, 13, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#95a5a6';
                ctx.beginPath();
                ctx.arc(d.x - 3, d.y - 3, 7, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
    }

    drawTrees(ctx, camera) {
        ctx.save();

        for (let i = 0; i < this.trees.length; i++) {
            const t = this.trees[i];
            if (!camera.isVisible(t.x, t.y, t.size + 40)) continue;

            // 1. Trunk shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
            ctx.beginPath();
            ctx.ellipse(t.x + 8, t.y + 8, t.size * 0.8, t.size * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();

            // 2. Trunk
            ctx.fillStyle = '#4e342e';
            ctx.beginPath();
            ctx.arc(t.x, t.y, 6, 0, Math.PI * 2);
            ctx.fill();

            // 3. Foliage Crown
            if (this.theme === 'winter') {
                // Snowy Pine Tree (layered triangles)
                ctx.fillStyle = '#1b4d3e';
                ctx.beginPath();
                ctx.arc(t.x, t.y - 4, t.size * 0.8, 0, Math.PI * 2);
                ctx.fill();

                // Snow cap on top
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(t.x, t.y - 10, t.size * 0.5, 0, Math.PI * 2);
                ctx.fill();
            } else if (this.theme === 'spring') {
                // Cherry Blossom Tree (pink canopy)
                ctx.fillStyle = '#f06292';
                ctx.beginPath();
                ctx.arc(t.x, t.y - 6, t.size * 0.85, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#f8bbd0';
                ctx.beginPath();
                ctx.arc(t.x - 4, t.y - 10, t.size * 0.5, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Summer Lush Oak Tree
                ctx.fillStyle = '#2e7d32';
                ctx.beginPath();
                ctx.arc(t.x, t.y - 6, t.size * 0.85, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#4caf50';
                ctx.beginPath();
                ctx.arc(t.x - 5, t.y - 10, t.size * 0.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
    }
}
