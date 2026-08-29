/**
 * SNAKE 3D: Cyber Grid - UI Manager
 * Handles UI interactions, pause/resume/restart binds, and keyboard direction input.
 */

const UIManager = {
    activeScreenId: null,

    init() {
        this.bindMenuButtons();
        this.bindKeyboardInputs();
        this.setupAudioButtons();
        this.updateHUDHighScore();
    },

    showScreen(screenId) {
        // Hide previous active screen
        if (this.activeScreenId) {
            const oldScreen = document.getElementById(this.activeScreenId);
            if (oldScreen) oldScreen.classList.remove('active');
        }
        
        // Show new screen
        const newScreen = document.getElementById(screenId);
        if (newScreen) {
            newScreen.classList.add('active');
            this.activeScreenId = screenId;
        } else {
            this.activeScreenId = null;
        }

        AudioManager.playClick();
    },

    setupAudioButtons() {
        const soundBtn = document.getElementById('btn-sound-toggle');
        const musicBtn = document.getElementById('btn-music-toggle');

        if (AudioManager.sfxEnabled) soundBtn.classList.add('active');
        if (AudioManager.musicEnabled) musicBtn.classList.add('active');

        soundBtn.addEventListener('click', () => {
            const enabled = AudioManager.toggleSFX();
            soundBtn.classList.toggle('active', enabled);
            const icon = soundBtn.querySelector('i');
            icon.className = enabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';
        });

        musicBtn.addEventListener('click', () => {
            const enabled = AudioManager.toggleMusic();
            musicBtn.classList.toggle('active', enabled);
        });
    },

    bindMenuButtons() {
        // Overlay screen buttons (Pause screen)
        document.getElementById('btn-resume').addEventListener('click', () => {
            if (window.GameMain) window.GameMain.resumeGame();
        });
        document.getElementById('btn-restart-paused').addEventListener('click', () => {
            this.showScreen(null);
            if (window.GameMain) window.GameMain.startGame(1);
        });

        // Overlay screen buttons (Game Over screen)
        document.getElementById('btn-restart').addEventListener('click', () => {
            this.showScreen(null);
            if (window.GameMain) window.GameMain.startGame(1);
        });
    },

    showPopupNotification(text) {
        console.log("System Alert:", text);
    },

    /* --- IN-GAME KEYBOARD BINDINGS --- */

    bindKeyboardInputs() {
        document.addEventListener('keydown', (e) => {
            if (!window.GameMain || !GameState.playing) {
                // Pause resume check
                if (GameState.paused && (e.key === 'Escape' || e.key.toLowerCase() === 'p')) {
                    window.GameMain.resumeGame();
                }
                return;
            }

            const key = e.key.toLowerCase();
            const left = new THREE.Vector3(-1, 0, 0);
            const right = new THREE.Vector3(1, 0, 0);
            const forward = new THREE.Vector3(0, 0, 1);
            const backward = new THREE.Vector3(0, 0, -1);

            const snake = window.GameMain.snake;
            const dir = snake.direction;

            // Pause
            if (e.key === 'Escape' || key === 'p') {
                window.GameMain.pauseGame();
                return;
            }

            // Camera switch (C key)
            if (key === 'c') {
                const modes = ['classic', 'third-person', 'first-person', 'free-look'];
                const curIdx = modes.indexOf(Config.settings.cameraMode);
                const nextIdx = (curIdx + 1) % modes.length;
                ThreeSetup.setActiveCamera(modes[nextIdx]);
                return;
            }

            // 2.5D Mode direction bindings: Left/A turns relative left, Right/D turns relative right
            if (key === 'a' || e.key === 'ArrowLeft') {
                if (dir.z === 1) snake.setSteeringDirection(left);
                else if (dir.z === -1) snake.setSteeringDirection(right);
                else if (dir.x === 1) snake.setSteeringDirection(forward);
                else if (dir.x === -1) snake.setSteeringDirection(backward);
            } else if (key === 'd' || e.key === 'ArrowRight') {
                if (dir.z === 1) snake.setSteeringDirection(right);
                else if (dir.z === -1) snake.setSteeringDirection(left);
                else if (dir.x === 1) snake.setSteeringDirection(backward);
                else if (dir.x === -1) snake.setSteeringDirection(forward);
            } else if (key === 'w' || e.key === 'ArrowUp') {
                // Also support direct direction steering for flat ground
                if (dir.z === 0) snake.setSteeringDirection(forward);
            } else if (key === 's' || e.key === 'ArrowDown') {
                if (dir.z === 0) snake.setSteeringDirection(backward);
            }
        });
    },

    updateHUDHighScore() {
        const scores = StorageManager.getHighScores();
        const best = scores.length > 0 ? scores[0].score : 0;
        document.getElementById('hud-highscore').innerText = best.toString().padStart(6, '0');
    },

    renderShieldsHUD() {
        const container = document.getElementById('hud-shields');
        container.innerHTML = '';
        
        for (let i = 1; i <= 3; i++) {
            const icon = document.createElement('i');
            if (i <= GameState.shields) {
                icon.className = 'fas fa-shield-alt';
            } else {
                icon.className = 'far fa-shield-alt empty-shield';
            }
            container.appendChild(icon);
        }
    },

    renderPowerupsHUD() {
        // Power-ups display omitted for maximum simplification,
        // but core parameters are updated internally.
    },

    updateShopCredits() {},
    renderShop() {},
    renderAchievements() {}
};

window.UIManager = UIManager;
