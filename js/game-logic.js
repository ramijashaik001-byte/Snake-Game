/**
 * SNAKE 3D: Hyperdimensional - Game Logic, Entity Management, & Collision Grid
 * Houses classes for the Snake construct, food generation, powerups, collision, and physics.
 */

// Snake Segment representation
class SnakeSegment {
    constructor(x, y, z, mesh) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.mesh = mesh; // ThreeJS mesh reference
    }
}

// Core Snake Entity Class
class Snake {
    constructor() {
        this.segments = [];
        
        // Direction vectors (3D offsets)
        this.direction = new THREE.Vector3(0, 0, 1);     // Current direction (default: forward in Z)
        this.nextDirection = new THREE.Vector3(0, 0, 1); // Buffered keyboard input direction
        
        // Active cosmetics
        this.headSkin = 'head-neon';
        this.bodySkin = 'body-solid';
    }

    reset(gridSize, headSkin, bodySkin) {
        this.headSkin = headSkin;
        this.bodySkin = bodySkin;

        // Clear existing segments from 3D scene
        this.segments.forEach(seg => {
            if (seg.mesh) ThreeSetup.scene.remove(seg.mesh);
        });
        this.segments = [];

        // Reset direction
        this.direction.set(0, 0, 1);
        this.nextDirection.set(0, 0, 1);

        // Spawn initial snake at the center of the grid, facing +Z
        // Start with length 3
        const startX = 0;
        const startY = 0;
        const startZ = 0;

        // Head segment (index 0)
        const headMesh = ThreeSetup.createSnakeHeadMesh(this.headSkin);
        headMesh.position.set(startX, startY, startZ);
        ThreeSetup.scene.add(headMesh);
        this.segments.push(new SnakeSegment(startX, startY, startZ, headMesh));

        // Tail segments
        for (let i = 1; i <= 2; i++) {
            const bodyMesh = ThreeSetup.createSnakeSegmentMesh(this.bodySkin, i, 3);
            const zPos = startZ - i;
            bodyMesh.position.set(startX, startY, zPos);
            ThreeSetup.scene.add(bodyMesh);
            this.segments.push(new SnakeSegment(startX, startY, zPos, bodyMesh));
        }

        // Align meshes to face the right direction initially
        this.alignHeadMesh();
    }

    getHead() {
        return this.segments[0];
    }

    getHeadWorldPosition() {
        return this.segments[0].mesh.position;
    }

    getDirectionVector() {
        return this.direction;
    }

    // Set steering direction based on user keystrokes
    // Keeps track of valid directions (prevents instant 180 degree suicide turns)
    setSteeringDirection(newDir) {
        // Prevent reversing directly into self
        const angle = this.direction.angleTo(newDir);
        if (Math.abs(angle - Math.PI) > 0.01) {
            this.nextDirection.copy(newDir);
        }
    }

    // Main tick movement update called on physics intervals
    move(grow = false) {
        // Lock in next direction
        this.direction.copy(this.nextDirection);

        // 1. Calculate new head position
        const currentHead = this.segments[0];
        const nextX = currentHead.x + this.direction.x;
        const nextY = currentHead.y + this.direction.y;
        const nextZ = currentHead.z + this.direction.z;

        // Save last segment position in case we grow
        const lastIndex = this.segments.length - 1;
        const lastX = this.segments[lastIndex].x;
        const lastY = this.segments[lastIndex].y;
        const lastZ = this.segments[lastIndex].z;

        // 2. Shift body positions forward from tail
        for (let i = lastIndex; i > 0; i--) {
            this.segments[i].x = this.segments[i - 1].x;
            this.segments[i].y = this.segments[i - 1].y;
            this.segments[i].z = this.segments[i - 1].z;
            
            // Animate body mesh translation smoothly
            this.segments[i].mesh.position.set(this.segments[i].x, this.segments[i].y, this.segments[i].z);
        }

        // 3. Update head position
        currentHead.x = nextX;
        currentHead.y = nextY;
        currentHead.z = nextZ;
        currentHead.mesh.position.set(nextX, nextY, nextZ);
        
        // Orient head mesh towards movement direction
        this.alignHeadMesh();

        // 4. Handle Growth
        if (grow) {
            const index = this.segments.length;
            const newMesh = ThreeSetup.createSnakeSegmentMesh(this.bodySkin, index, index + 1);
            newMesh.position.set(lastX, lastY, lastZ);
            ThreeSetup.scene.add(newMesh);
            
            this.segments.push(new SnakeSegment(lastX, lastY, lastZ, newMesh));
            
            // Re-scale older segments to look tapered
            this.recalculateSegmentTaper();
        }
    }

    recalculateSegmentTaper() {
        const total = this.segments.length;
        for (let i = 1; i < total; i++) {
            const scale = 0.85 - (i / total) * 0.45;
            this.segments[i].mesh.scale.set(scale, scale, scale);
        }
    }

    alignHeadMesh() {
        const headMesh = this.segments[0].mesh;
        
        // Reset rotation first
        headMesh.rotation.set(0, 0, 0);

        // Rotate head to point in movement vector direction
        if (this.direction.z === 1) { // Forward
            headMesh.rotation.y = 0;
        } else if (this.direction.z === -1) { // Backward
            headMesh.rotation.y = Math.PI;
        } else if (this.direction.x === 1) { // Right
            headMesh.rotation.y = Math.PI / 2;
        } else if (this.direction.x === -1) { // Left
            headMesh.rotation.y = -Math.PI / 2;
        } else if (this.direction.y === 1) { // Up
            headMesh.rotation.x = -Math.PI / 2;
        } else if (this.direction.y === -1) { // Down
            headMesh.rotation.x = Math.PI / 2;
        }
    }

    /* --- COLLISION DETECTIONS --- */

    checkSelfCollision() {
        const head = this.segments[0];
        // Skip head and check rest of body
        for (let i = 1; i < this.segments.length; i++) {
            if (head.x === this.segments[i].x && 
                head.y === this.segments[i].y && 
                head.z === this.segments[i].z) {
                return true;
            }
        }
        return false;
    }

    checkWallCollision(gridSize) {
        const head = this.segments[0];
        const boundary = gridSize / 2;
        
        // Boundary is from -gridSize/2 to gridSize/2
        // Integer checks
        return (
            Math.abs(head.x) >= boundary ||
            Math.abs(head.y) >= boundary ||
            Math.abs(head.z) >= boundary
        );
    }
}

// Centralized Game State Machine and variables
const GameState = {
    playing: false,
    paused: false,
    score: 0,
    multiplier: 1.0,
    highScore: 0,
    creditsEarned: 0,
    currentLevel: 1,
    shields: 0,
    tickInterval: 120, // baseline loop clock speed
    
    // Active Power-ups and timers (stored in milliseconds left)
    powerups: {
        speed: 0,
        slow: 0,
        magnet: 0,
        shield: 0
    },

    // Spawns
    food: {
        x: 0, y: 0, z: 0,
        mesh: null,
        skinId: 'food-sphere'
    },
    
    powerupItem: {
        x: 0, y: 0, z: 0,
        type: null, // 'speed', 'slow', 'magnet', 'shield'
        mesh: null
    },

    init() {
        this.highScore = StorageManager.getHighScores()
            .filter(s => s.level === `Sector ${this.currentLevel}`)[0]?.score || 0;
    },

    resetState(levelId) {
        this.currentLevel = levelId;
        this.score = 0;
        this.multiplier = 1.0;
        this.shields = 0;
        this.creditsEarned = 0;
        
        const levelConfig = LevelData.levels[levelId];
        this.tickInterval = levelConfig.tickSpeed;
        
        // Reset powerups
        Object.keys(this.powerups).forEach(key => this.powerups[key] = 0);

        // Clear meshes
        this.clearFood();
        this.clearPowerupItem();

        // Get Level High Score
        const sectorName = `Sector ${levelId}`;
        const scores = StorageManager.getHighScores();
        const sectorScores = scores.filter(s => s.level === sectorName);
        this.highScore = sectorScores.length > 0 ? sectorScores[0].score : 0;
    },

    /* --- FOOD CONSTRUCT PROCEDURAL SPAWNERS --- */

    spawnFood(snake, gridSize, levelId) {
        this.clearFood();
        
        this.food.skinId = StorageManager.getEquipped().food || 'food-sphere';
        const mesh = ThreeSetup.createFoodMesh(this.food.skinId);
        
        const pos = this.getRandomEmptyPosition(snake, gridSize, levelId);
        this.food.x = pos.x;
        this.food.y = pos.y;
        this.food.z = pos.z;
        
        mesh.position.set(pos.x, pos.y, pos.z);
        ThreeSetup.scene.add(mesh);
        this.food.mesh = mesh;
    },

    clearFood() {
        if (this.food.mesh) {
            ThreeSetup.scene.remove(this.food.mesh);
            this.food.mesh.geometry.dispose();
            this.food.mesh = null;
        }
    },

    /* --- POWERUP PROCEDURAL SPAWNERS --- */

    spawnPowerupItem(snake, gridSize, levelId) {
        this.clearPowerupItem();
        
        // 25% chance of spawning if none exists
        if (Math.random() > 0.25) return;

        const types = ['speed', 'slow', 'magnet', 'shield'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        const pos = this.getRandomEmptyPosition(snake, gridSize, levelId);
        
        // Ensure it doesn't overlap food
        if (pos.x === this.food.x && pos.y === this.food.y && pos.z === this.food.z) return;

        const mesh = ThreeSetup.createPowerupMesh(type);
        mesh.position.set(pos.x, pos.y, pos.z);
        ThreeSetup.scene.add(mesh);

        this.powerupItem.x = pos.x;
        this.powerupItem.y = pos.y;
        this.powerupItem.z = pos.z;
        this.powerupItem.type = type;
        this.powerupItem.mesh = mesh;
    },

    clearPowerupItem() {
        if (this.powerupItem.mesh) {
            ThreeSetup.scene.remove(this.powerupItem.mesh);
            this.powerupItem.mesh.geometry.dispose();
            this.powerupItem.mesh = null;
            this.powerupItem.type = null;
        }
    },

    // Helper to scan coordinates and avoid snake / obstacles / walls
    getRandomEmptyPosition(snake, gridSize, levelId) {
        const half = Math.floor(gridSize / 2);
        
        // Try up to 200 times to find a completely vacant grid coordinate
        for (let attempt = 0; attempt < 200; attempt++) {
            // Subtracting 1 from bounds to ensure it spawns inside the walls nicely
            const rx = Math.floor(Math.random() * (gridSize - 2)) - (half - 1);
            const ry = Math.floor(Math.random() * (gridSize - 2)) - (half - 1);
            let rz = Math.floor(Math.random() * (gridSize - 2)) - (half - 1);

            // Plane lock for 2.5D Mode (keep Y coordinate locked to 0)
            let finalY = ry;
            if (Config.settings.playspaceMode === '2.5d') {
                finalY = 0;
            }

            // Check if matches snake body
            const onSnake = snake.segments.some(seg => seg.x === rx && seg.y === finalY && seg.z === rz);
            if (onSnake) continue;

            // Check if matches obstacles
            const onObstacle = LevelData.isObstacle(levelId, rx, finalY, rz);
            if (onObstacle) continue;

            // Found valid location
            return { x: rx, y: finalY, z: rz };
        }
        
        // Fallback default safe position
        return { x: 0, y: 0, z: 0 };
    },

    /* --- TICK-BASED POWERUP MODIFIER CHECKS --- */

    updatePowerupTimers(dtMs) {
        let updateUI = false;

        Object.keys(this.powerups).forEach(type => {
            if (this.powerups[type] > 0) {
                this.powerups[type] = Math.max(0, this.powerups[type] - dtMs);
                updateUI = true;
            }
        });

        if (updateUI && window.UIManager) {
            window.UIManager.renderPowerupsHUD();
        }
    },

    activatePowerup(type) {
        // Duration: 8 seconds (8000ms)
        const duration = 8000;
        
        if (type === 'shield') {
            this.shields = Math.min(3, this.shields + 1);
            AudioManager.playPowerupSound('shield');
            if (window.UIManager) window.UIManager.renderShieldsHUD();
        } else {
            this.powerups[type] = duration;
            AudioManager.playPowerupSound(type);
        }

        if (window.UIManager) {
            window.UIManager.renderPowerupsHUD();
        }
    },

    // Apply Magnet Attraction: pulls food 1 unit closer to head
    applyMagnetLogic(snakeHeadPos) {
        if (this.powerups.magnet <= 0 || !this.food.mesh) return;

        const headPos = new THREE.Vector3(snakeHeadPos.x, snakeHeadPos.y, snakeHeadPos.z);
        const foodPos = new THREE.Vector3(this.food.x, this.food.y, this.food.z);
        
        const dist = headPos.distanceTo(foodPos);
        
        // Pull within radius of 5 units
        if (dist > 1.1 && dist <= 5.0) {
            // Find direction vector towards head
            const direction = new THREE.Vector3().subVectors(headPos, foodPos).normalize();
            
            // Move food 1 unit along axis of closest distance
            const axisDiff = {
                x: Math.abs(headPos.x - foodPos.x),
                y: Math.abs(headPos.y - foodPos.y),
                z: Math.abs(headPos.z - foodPos.z)
            };
            
            // Drag on the coordinate axis that has the largest gap
            if (axisDiff.x >= axisDiff.y && axisDiff.x >= axisDiff.z) {
                this.food.x += (headPos.x > foodPos.x) ? 1 : -1;
            } else if (axisDiff.y >= axisDiff.x && axisDiff.y >= axisDiff.z && Config.settings.playspaceMode !== '2.5d') {
                this.food.y += (headPos.y > foodPos.y) ? 1 : -1;
            } else {
                this.food.z += (headPos.z > foodPos.z) ? 1 : -1;
            }

            // Reposition mesh visually
            this.food.mesh.position.set(this.food.x, this.food.y, this.food.z);
        }
    },

    // Calculate dynamic clock rate based on levels and active speed powerups
    getCurrentTickInterval() {
        let interval = this.tickInterval;
        
        if (this.powerups.speed > 0) {
            interval = interval * 0.6; // Speed up 40% (shorter tick interval)
        } else if (this.powerups.slow > 0) {
            interval = interval * 1.6; // Slow down 60%
        }
        
        return interval;
    }
};

// Hook pointers in setup
ThreeSetup.gameStateRef = GameState;

window.GameState = GameState;
window.Snake = Snake;
