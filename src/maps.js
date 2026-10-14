// src/maps.js - Exactly three seasonal maps: Winter Wonderland, Summer County, Spring Valley
import { MAP_CONFIGS } from './config.js';

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

        this.generateRoads();
        this.generateBuildings();
        this.generateSceneryAndDestructibles();
        this.buildSpatialGrid();
    }

    generateRoads() {
        this.roads = [];

        // 1. Main North-South Central Highway
        this.addRoad(2100, 200, 2100, 4000, 160);

        // 2. East-West Major Crossway
        this.addRoad(300, 2100, 3900, 2100, 160);

        // 3. North & South Outer Loops
        this.addRoad(700, 700, 3500, 700, 140);
        this.addRoad(700, 3400, 3500, 3400, 140);

        // 4. West & East Boundary Highways
        this.addRoad(700, 700, 700, 3400, 140);
        this.addRoad(3500, 700, 3500, 3400, 140);

        // 5. Diagonal connector highways (encourages drifting)
        this.addRoad(700, 2100, 1400, 1400, 120);
        this.addRoad(1400, 1400, 2100, 1400, 120);
        this.addRoad(2100, 1400, 2800, 1400, 120);
        this.addRoad(2800, 1400, 3500, 2100, 120);

        this.addRoad(700, 2100, 1400, 2800, 120);
        this.addRoad(1400, 2800, 2100, 2800, 120);
        this.addRoad(2100, 2800, 2800, 2800, 120);
        this.addRoad(2800, 2800, 3500, 2100, 120);

        // River stream (Spring and Summer)
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
        const buildingSpots = [
            { x: 1100, y: 1000, w: 160, h: 120, type: 'barn' },
            { x: 1700, y: 1000, w: 140, h: 140, type: 'cabin' },
            { x: 1000, y: 1700, w: 180, h: 110, type: 'warehouse' },
            { x: 2500, y: 1000, w: 150, h: 130, type: 'cabin' },
            { x: 3100, y: 1000, w: 170, h: 120, type: 'barn' },
            { x: 3200, y: 1700, w: 190, h: 130, type: 'warehouse' },
            { x: 1100, y: 2500, w: 160, h: 130, type: 'cabin' },
            { x: 1700, y: 2500, w: 150, h: 120, type: 'barn' },
            { x: 1100, y: 3100, w: 180, h: 140, type: 'warehouse' },
            { x: 2500, y: 2500, w: 140, h: 120, type: 'cabin' },
            { x: 3100, y: 2500, w: 170, h: 130, type: 'barn' },
            { x: 3100, y: 3100, w: 190, h: 140, type: 'warehouse' },
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
            let w = 24, h = 24, radius = 16;
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

        // Roadside Fences
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

                if (Math.random() > 0.35) {
                    addDestructible('fence', px + normalX * fenceOffset, py + normalY * fenceOffset, 15, 30, 100);
                }
                if (Math.random() > 0.35) {
                    addDestructible('fence', px - normalX * fenceOffset, py - normalY * fenceOffset, 15, 30, 100);
                }
            }
        }

        // Road Signs at intersections
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

        // Crates, Barrels, Haybales, Stalls near buildings
        for (const b of this.buildings) {
            addDestructible('crate', b.x - b.halfW - 25, b.y, 25, 50, 150);
            addDestructible('crate', b.x + b.halfW + 25, b.y, 25, 50, 150);
            addDestructible('barrel', b.x, b.y - b.halfH - 25, 30, 80, 200);
            addDestructible('barrel', b.x, b.y + b.halfH + 25, 30, 80, 200);

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

        // Environmental Trees
        const treeCount = 280;
        for (let i = 0; i < treeCount; i++) {
            const tx = Math.random() * (this.width - 200) + 100;
            const ty = Math.random() * (this.height - 200) + 100;

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

        // Ground accents
        this.drawGroundDetails(ctx, camera);

        // 2. River
        if (this.theme === 'spring' || this.theme === 'summer') {
            this.drawRiver(ctx, camera);
        }

        // 3. Roads
        this.drawRoads(ctx, camera);

        // 4. Bridges
        if (this.theme === 'spring' || this.theme === 'summer') {
            this.drawBridges(ctx, camera);
        }

        // 5. Buildings
        this.drawBuildings(ctx, camera);

        // 6. Destructibles
        this.drawDestructibles(ctx, camera);

        // 7. Trees
        this.drawTrees(ctx, camera);
    }

    drawGroundDetails(ctx, camera) {
        ctx.save();
        ctx.fillStyle = this.config.groundAccent;

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

            // Border shoulder
            ctx.strokeStyle = this.config.roadBorderColor;
            ctx.lineWidth = r.width + 12;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(r.x1, r.y1);
            ctx.lineTo(r.x2, r.y2);
            ctx.stroke();

            // Main asphalt
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
        const bridgeX = 2100;
        const bridgeY = 1800;
        if (!camera.isVisible(bridgeX, bridgeY, 150)) return;

        ctx.save();
        ctx.fillStyle = '#6d4c41';
        ctx.fillRect(bridgeX - 85, bridgeY - 60, 170, 120);

        ctx.fillStyle = '#4e342e';
        for (let y = bridgeY - 55; y <= bridgeY + 55; y += 15) {
            ctx.fillRect(bridgeX - 85, y, 170, 3);
        }

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

            // Drop shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
            ctx.fillRect(b.x - b.halfW + 12, b.y - b.halfH + 16, b.w, b.h);

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
                roofColor = this.theme === 'winter' ? '#ecf0f1' : '#b03a2e';
            }

            ctx.fillStyle = wallColor;
            ctx.fillRect(b.x - b.halfW, b.y - b.halfH, b.w, b.h);

            ctx.fillStyle = roofColor;
            ctx.fillRect(b.x - b.halfW + 8, b.y - b.halfH + 8, b.w - 16, b.h - 16);

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
            if (d.destroyed) continue;
            if (!camera.isVisible(d.x, d.y, 60)) continue;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
            ctx.beginPath();
            ctx.ellipse(d.x + 3, d.y + 4, d.radius * 0.8, d.radius * 0.45, 0, 0, Math.PI * 2);
            ctx.fill();

            if (d.type === 'fence') {
                ctx.fillStyle = '#8b5a2b';
                ctx.fillRect(d.x - 22, d.y - 4, 44, 8);
                ctx.fillStyle = '#5c3a21';
                ctx.fillRect(d.x - 20, d.y - 6, 6, 12);
                ctx.fillRect(d.x - 3, d.y - 6, 6, 12);
                ctx.fillRect(d.x + 14, d.y - 6, 6, 12);
            } else if (d.type === 'crate') {
                ctx.fillStyle = '#b58a57';
                ctx.fillRect(d.x - 12, d.y - 12, 24, 24);
                ctx.strokeStyle = '#6d4825';
                ctx.lineWidth = 2;
                ctx.strokeRect(d.x - 12, d.y - 12, 24, 24);
                ctx.beginPath();
                ctx.moveTo(d.x - 10, d.y - 10);
                ctx.lineTo(d.x + 10, d.y + 10);
                ctx.moveTo(d.x + 10, d.y - 10);
                ctx.lineTo(d.x - 10, d.y + 10);
                ctx.stroke();
            } else if (d.type === 'barrel') {
                ctx.fillStyle = '#e74c3c';
                ctx.beginPath();
                ctx.arc(d.x, d.y, 11, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#7f8c8d';
                ctx.lineWidth = 2.5;
                ctx.stroke();
                ctx.fillStyle = '#34495e';
                ctx.fillRect(d.x - 3, d.y - 3, 6, 6);
            } else if (d.type === 'sign') {
                ctx.fillStyle = '#f39c12';
                ctx.beginPath();
                ctx.roundRect(d.x - 14, d.y - 10, 28, 20, 3);
                ctx.fill();
                ctx.strokeStyle = '#d35400';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.fillStyle = '#2c3e50';
                ctx.beginPath();
                ctx.moveTo(d.x + 6, d.y);
                ctx.lineTo(d.x - 4, d.y - 5);
                ctx.lineTo(d.x - 4, d.y + 5);
                ctx.closePath();
                ctx.fill();
            } else if (d.type === 'haybale') {
                ctx.fillStyle = '#f1c40f';
                ctx.beginPath();
                ctx.arc(d.x, d.y, 13, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#d4ac0d';
                ctx.lineWidth = 3;
                ctx.stroke();
            } else if (d.type === 'flowerpot') {
                ctx.fillStyle = '#d35400';
                ctx.beginPath();
                ctx.arc(d.x, d.y, 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ff69b4';
                ctx.beginPath();
                ctx.arc(d.x - 2, d.y - 2, 4, 0, Math.PI * 2);
                ctx.arc(d.x + 3, d.y + 2, 4, 0, Math.PI * 2);
                ctx.fill();
            } else if (d.type === 'stall') {
                ctx.fillStyle = '#e67e22';
                ctx.fillRect(d.x - 22, d.y - 14, 44, 28);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(d.x - 22, d.y - 14, 11, 28);
                ctx.fillRect(d.x, d.y - 14, 11, 28);
            } else if (d.type === 'rock') {
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

            ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
            ctx.beginPath();
            ctx.ellipse(t.x + 8, t.y + 8, t.size * 0.8, t.size * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#4e342e';
            ctx.beginPath();
            ctx.arc(t.x, t.y, 6, 0, Math.PI * 2);
            ctx.fill();

            if (this.theme === 'winter') {
                ctx.fillStyle = '#1b4d3e';
                ctx.beginPath();
                ctx.arc(t.x, t.y - 4, t.size * 0.8, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(t.x, t.y - 10, t.size * 0.5, 0, Math.PI * 2);
                ctx.fill();
            } else if (this.theme === 'spring') {
                ctx.fillStyle = '#f06292';
                ctx.beginPath();
                ctx.arc(t.x, t.y - 6, t.size * 0.85, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#f8bbd0';
                ctx.beginPath();
                ctx.arc(t.x - 4, t.y - 10, t.size * 0.5, 0, Math.PI * 2);
                ctx.fill();
            } else {
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
