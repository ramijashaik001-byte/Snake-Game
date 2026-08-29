/**
 * SNAKE 3D: Cyber Grid - Main Game Controller
 * Manages game clock intervals, entity movements, and score metrics.
 */

const GameMain = {
    snake: null,
    gameTimer: null,
    isInvulnerable: false,
    invulnTime: 1500,
    
    init() {
        this.snake = new Snake();
        ThreeSetup.snakeRef = this.snake;

        UIManager.init();
        ThreeSetup.init('canvas-container');
        
        // Lock camera view to 'classic' (isometric angled overhead) for flat ground view
        Config.settings.cameraMode = 'classic';
        ThreeSetup.setActiveCamera('classic');
    },

    startGame(levelId) {
        this.stopPhysicsLoop();

        // 1. Reset Game Parameters
        GameState.resetState(levelId);
        
        // Setup simple Flat Ground (always Lock to 2.5D planar mode)
        Config.settings.playspaceMode = '2.5d';
        
        // Update HUD Values
        this.updateHUDScore();
        UIManager.renderShieldsHUD();
        UIManager.updateHUDHighScore();

        // 2. Setup level visual configurations
        const levelConfig = LevelData.levels[levelId];
        ThreeSetup.buildLevelEnvironment(levelConfig);

        // 3. Reset Snake segment meshes
        const equipped = StorageManager.getEquipped();
        this.snake.reset(levelConfig.gridSize, equipped.head, equipped.body);
        
        // Force cam track to center
        const headPos = this.snake.getHeadWorldPosition();
        const headDir = this.snake.getDirectionVector();
        ThreeSetup.updateCameras(headPos, headDir);

        // 4. Generate first food anomaly
        GameState.spawnFood(this.snake, levelConfig.gridSize, levelId);

        // 5. Setup loop variables
        GameState.playing = true;
        GameState.paused = false;
        this.isInvulnerable = false;

        // Hide menus
        document.getElementById('screen-paused').classList.remove('active');
        document.getElementById('screen-gameover').classList.remove('active');

        // Start loops
        this.scheduleNextTick();
    },

    scheduleNextTick() {
        if (!GameState.playing || GameState.paused) return;

        const interval = GameState.getCurrentTickInterval();
        this.gameTimer = setTimeout(() => {
            this.gameTick();
            this.scheduleNextTick();
        }, interval);
    },

    stopPhysicsLoop() {
        if (this.gameTimer) {
            clearTimeout(this.gameTimer);
            this.gameTimer = null;
        }
    },

    pauseGame() {
        if (!GameState.playing || GameState.paused) return;

        GameState.paused = true;
        this.stopPhysicsLoop();
        UIManager.showScreen('screen-paused');
        
        if (AudioManager.musicEnabled) {
            AudioManager.stopMusic();
        }
        AudioManager.playClick();
    },

    resumeGame() {
        if (!GameState.playing || !GameState.paused) return;

        GameState.paused = false;
        UIManager.showScreen(null);
        
        AudioManager.resumeContext();
        if (AudioManager.musicEnabled) {
            AudioManager.startMusic();
        }

        this.scheduleNextTick();
        AudioManager.playClick();
    },

    gameOver(reason) {
        GameState.playing = false;
        this.stopPhysicsLoop();

        AudioManager.playCrashSound();
        AudioManager.stopMusic();

        // Save Score
        StorageManager.saveHighScore('PILOT_01', `Sector ${GameState.currentLevel}`, GameState.score);
        
        // Sync final score screens
        document.getElementById('go-score').innerText = GameState.score.toLocaleString();
        
        const scores = StorageManager.getHighScores();
        const best = scores.length > 0 ? scores[0].score : 0;
        document.getElementById('go-highscore').innerText = best.toLocaleString();

        // Show Game Over Overlay
        UIManager.showScreen('screen-gameover');
    },

    /* --- GAME PHYSICS CLOCK TICK --- */

    gameTick() {
        if (!GameState.playing || GameState.paused) return;

        const levelConfig = LevelData.levels[GameState.currentLevel];
        const head = this.snake.getHead();
        
        // Determine next coordinates
        const nextX = head.x + this.snake.direction.x;
        const nextY = head.y + this.snake.direction.y;
        const nextZ = head.z + this.snake.direction.z;

        const isEating = (nextX === GameState.food.x && nextY === GameState.food.y && nextZ === GameState.food.z);
        
        // Move Snake
        this.snake.move(isEating);

        // Update cameras
        const headPos = this.snake.getHeadWorldPosition();
        const headDir = this.snake.getDirectionVector();
        ThreeSetup.updateCameras(headPos, headDir);

        // Resolve eating
        if (isEating) {
            AudioManager.playEatSound();
            
            // Add points
            GameState.score += Math.floor(100 * GameState.multiplier);
            GameState.multiplier = parseFloat((GameState.multiplier + 0.1).toFixed(1));
            this.updateHUDScore();

            // Burst feedback sparks
            const col = levelConfig.theme.particleColor;
            ThreeSetup.spawnExplosion(headPos, col, 15);

            // Spawn next food
            GameState.spawnFood(this.snake, levelConfig.gridSize, GameState.currentLevel);
            
            // Probability generator for powerup items (20% chance)
            if (Math.random() < 0.2) {
                GameState.spawnPowerupItem(this.snake, levelConfig.gridSize, GameState.currentLevel);
            }
        }

        // Apply Magnet Attraction
        if (GameState.powerups.magnet > 0) {
            GameState.applyMagnetLogic(this.snake.getHead());
        }

        // Decrement active timers
        const interval = GameState.getCurrentTickInterval();
        GameState.updatePowerupTimers(interval);

        // Collect Powerup
        const newHead = this.snake.getHead();
        if (GameState.powerupItem.mesh && 
            newHead.x === GameState.powerupItem.x && 
            newHead.y === GameState.powerupItem.y && 
            newHead.z === GameState.powerupItem.z) {
            
            GameState.activatePowerup(GameState.powerupItem.type);
            GameState.clearPowerupItem();
        }

        // Collision Checks
        let collisionDetected = false;
        let deathReason = "";

        if (this.snake.checkWallCollision(levelConfig.gridSize)) {
            collisionDetected = true;
            deathReason = "Boundary field breached";
        } else if (this.snake.checkSelfCollision()) {
            collisionDetected = true;
            deathReason = "Construct self-collision";
        }

        // Resolve Collision
        if (collisionDetected) {
            if (GameState.shields > 0 && !this.isInvulnerable) {
                GameState.shields--;
                UIManager.renderShieldsHUD();
                ThreeSetup.spawnExplosion(headPos, 0x39ff14, 20);
                
                this.isInvulnerable = true;
                const rev = this.snake.direction.clone().negate();
                this.snake.nextDirection.copy(rev);
                
                setTimeout(() => {
                    this.isInvulnerable = false;
                }, this.invulnTime);
            } else if (!this.isInvulnerable) {
                this.gameOver(deathReason);
            }
        }
    },

    updateHUDScore() {
        const valStr = GameState.score.toString().padStart(6, '0');
        document.getElementById('hud-score').innerText = valStr;
    }
};

// Bind to window load
window.addEventListener('DOMContentLoaded', () => {
    try {
        GameMain.init();
        window.GameMain = GameMain;
        
        // Start the game immediately on load (bypass menus)
        GameMain.startGame(1);
    } catch (e) {
        console.error("Game boot failed:", e);
        var errorDiv = document.getElementById('debug-error-panel');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.id = 'debug-error-panel';
            errorDiv.style.position = 'fixed';
            errorDiv.style.bottom = '10px';
            errorDiv.style.right = '10px';
            errorDiv.style.width = '95%';
            errorDiv.style.maxWidth = '500px';
            errorDiv.style.zIndex = '99999';
            errorDiv.style.background = 'rgba(255, 0, 85, 0.95)';
            errorDiv.style.color = 'white';
            errorDiv.style.padding = '20px';
            errorDiv.style.fontFamily = 'monospace';
            errorDiv.style.fontSize = '12px';
            errorDiv.style.borderRadius = '5px';
            errorDiv.style.maxHeight = '300px';
            errorDiv.style.overflow = 'auto';
            document.body.appendChild(errorDiv);
        }
        errorDiv.innerHTML += '<div><strong>[BOOT CRASH]</strong> ' + e.message + '<br>' + (e.stack ? e.stack.replace(/\n/g, '<br>') : '') + '</div>';
    }
});
