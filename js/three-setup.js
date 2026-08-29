/**
 * SNAKE 3D: Hyperdimensional - WebGL Graphics Setup & Rendering Engine
 * Handles Three.js initialization, cameras, lights, materials, environments, and particle effects.
 */

const ThreeSetup = {
    container: null,
    renderer: null,
    scene: null,
    
    // Cameras
    cameras: {
        thirdPerson: null,
        firstPerson: null,
        classic: null,
        freeLook: null,
        active: null
    },
    
    controls: null, // OrbitControls for freeLook
    
    // Lighting
    lights: {
        ambient: null,
        dirLight: null,
        headLight: null
    },
    
    // Environments & helpers
    gridSize: 16,
    gridHelper: null,
    boundaryCage: null,
    obstacleMeshes: [],
    
    // Particles System
    particles: [],
    maxParticles: 300,
    
    // Rendering animations
    animFrameId: null,
    targetCameraLerpSpeed: 0.08,
    
    // Reference variables for game loop connection
    snakeRef: null,
    gameStateRef: null,

    init(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        const width = this.container.clientWidth || window.innerWidth || 800;
        const height = this.container.clientHeight || window.innerHeight || 600;

        // 1. Create WebGL Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Setup shadows if high quality is set
        const quality = Config.settings.graphics;
        if (quality === 'high') {
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        } else {
            this.renderer.shadowMap.enabled = false;
        }
        
        // Append canvas
        this.container.appendChild(this.renderer.domElement);

        // 2. Create Scene & Fog
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x05050a);
        this.scene.fog = new THREE.FogExp2(0x05050a, 0.015);

        // 3. Create Cameras
        this.setupCameras(width, height);

        // 4. Create Lighting Rig
        this.setupLights();

        // 5. Orbit Controls for Free-Look Camera (wrapped in a try-catch for bulletproof CDN loading)
        try {
            if (typeof THREE.OrbitControls === 'function') {
                this.controls = new THREE.OrbitControls(this.cameras.freeLook, this.renderer.domElement);
                this.controls.enableDamping = true;
                this.controls.dampingFactor = 0.05;
                this.controls.maxPolarAngle = Math.PI; // Full orbit
                this.controls.minDistance = 5;
                this.controls.maxDistance = 80;
            } else {
                console.warn("THREE.OrbitControls is not a function. Free-look camera will be static.");
                this.controls = { update: () => {}, target: new THREE.Vector3() };
            }
        } catch (e) {
            console.error("OrbitControls failed to initialize. Disabling free-look rotation.", e);
            this.controls = { update: () => {}, target: new THREE.Vector3() };
        }

        // Listen for screen resize
        window.addEventListener('resize', this.onWindowResize.bind(this));

        // Start render loop
        this.animate();
    },

    setupCameras(width, height) {
        const aspect = width / height;

        // Third Person Camera (Chase)
        this.cameras.thirdPerson = new THREE.PerspectiveCamera(65, aspect, 0.1, 1000);
        
        // First Person Camera (Cockpit)
        this.cameras.firstPerson = new THREE.PerspectiveCamera(80, aspect, 0.1, 1000);

        // Classic Camera (Orthogonal / Angled overhead)
        this.cameras.classic = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
        this.cameras.classic.position.set(0, 32, 0); // Position high above looking straight down
        
        // Free Look Camera (Orbit controls)
        this.cameras.freeLook = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
        this.cameras.freeLook.position.set(22, 22, 22);

        // Set initial active camera
        this.setActiveCamera(Config.settings.cameraMode);
    },

    setActiveCamera(mode) {
        Config.settings.cameraMode = mode;
        
        if (mode === 'third-person') {
            this.cameras.active = this.cameras.thirdPerson;
            if (this.controls) this.controls.enabled = false;
        } else if (mode === 'first-person') {
            this.cameras.active = this.cameras.firstPerson;
            if (this.controls) this.controls.enabled = false;
        } else if (mode === 'classic') {
            this.cameras.active = this.cameras.classic;
            this.cameras.active.position.set(0, this.gridSize * 1.6, 0);
            this.cameras.active.lookAt(0, 0, 0);
            if (this.controls) this.controls.enabled = false;
        } else if (mode === 'free-look') {
            this.cameras.active = this.cameras.freeLook;
            if (this.controls) this.controls.enabled = true;
        }
    },

    setupLights() {
        // Ambient Light
        this.lights.ambient = new THREE.AmbientLight(0xffffff, 0.3);
        this.scene.add(this.lights.ambient);

        // Directional Shadow Light
        this.lights.dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        this.lights.dirLight.position.set(20, 40, 20);
        
        if (Config.settings.graphics === 'high') {
            this.lights.dirLight.castShadow = true;
            this.lights.dirLight.shadow.mapSize.width = 1024;
            this.lights.dirLight.shadow.mapSize.height = 1024;
            this.lights.dirLight.shadow.camera.near = 0.5;
            this.lights.dirLight.shadow.camera.far = 100;
            const d = 25;
            this.lights.dirLight.shadow.camera.left = -d;
            this.lights.dirLight.shadow.camera.right = d;
            this.lights.dirLight.shadow.camera.top = d;
            this.lights.dirLight.shadow.camera.bottom = -d;
        }
        this.scene.add(this.lights.dirLight);

        // Point Light attached to Snake Head (Dynamic neon illumination)
        this.lights.headLight = new THREE.PointLight(0x00f0ff, 1.8, 18, 1.5);
        this.lights.headLight.position.set(0, 0, 0);
        this.scene.add(this.lights.headLight);
    },

    // Rebuild level aesthetic environment when transitioning sectors
    buildLevelEnvironment(levelConfig) {
        this.gridSize = levelConfig.gridSize;
        
        // 1. Clear old obstacles & environment meshes
        this.clearEnvironment();

        // 2. Set colors from theme config
        const theme = levelConfig.theme;
        this.renderer.setClearColor(theme.clearColor);
        this.scene.background = new THREE.Color(theme.clearColor);
        this.scene.fog.color.setHex(theme.clearColor);
        this.scene.fog.density = 0.025;

        this.lights.ambient.color.setHex(theme.ambientLight);
        this.lights.dirLight.color.setHex(theme.spotLight);
        this.lights.headLight.color.setHex(theme.gridColor);

        // 3. Create Boundary Wireframe Cage
        const cageGeo = new THREE.BoxGeometry(this.gridSize, this.gridSize, this.gridSize);
        const cageMat = new THREE.MeshBasicMaterial({
            color: theme.wallColor,
            wireframe: true,
            transparent: true,
            opacity: 0.15
        });
        
        const edges = new THREE.EdgesGeometry(cageGeo);
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
            color: theme.gridColor,
            linewidth: 1.5,
            transparent: true,
            opacity: 0.3
        }));
        this.boundaryCage = line;
        this.scene.add(line);

        // Add semi-transparent floor/walls bounds
        const solidCageMat = new THREE.MeshPhongMaterial({
            color: theme.wallColor,
            emissive: theme.wallEmissive,
            side: THREE.BackSide,
            transparent: true,
            opacity: 0.45,
            shininess: 30
        });
        const solidCage = new THREE.Mesh(cageGeo, solidCageMat);
        
        if (Config.settings.shadows && Config.settings.graphics === 'high') {
            solidCage.receiveShadow = true;
        }
        this.boundaryCage.add(solidCage);

        // 4. Create Grid Helper (plane grid on floor y = -gridSize/2)
        if (Config.settings.gridHelper) {
            this.gridHelper = new THREE.GridHelper(this.gridSize, this.gridSize, theme.gridColor, 0x333333);
            this.gridHelper.position.y = -this.gridSize / 2;
            
            // Adjust materials to glow
            if (this.gridHelper.material) {
                this.gridHelper.material.transparent = true;
                this.gridHelper.material.opacity = 0.15;
            }
            this.scene.add(this.gridHelper);
        }

        // 5. Build static obstacles
        const obstacleGeo = new THREE.BoxGeometry(0.95, 0.95, 0.95);
        const obstacleMat = new THREE.MeshStandardMaterial({
            color: theme.wallColor,
            emissive: theme.wallEmissive,
            roughness: 0.2,
            metalness: 0.8,
            transparent: true,
            opacity: 0.9
        });

        levelConfig.obstacles.forEach(obs => {
            const mesh = new THREE.Mesh(obstacleGeo, obstacleMat);
            // Translate grid coordinates (which are integers) to 3D space
            // E.g., center offset is 0.5 for odd sizes, etc.
            mesh.position.set(obs.x, obs.y, obs.z);
            
            if (Config.settings.shadows && Config.settings.graphics === 'high') {
                mesh.castShadow = true;
                mesh.receiveShadow = true;
            }
            this.scene.add(mesh);
            this.obstacleMeshes.push(mesh);
        });

        // Clear existing particles
        this.particles.forEach(p => this.scene.remove(p.mesh));
        this.particles = [];
        
        // Reset camera positions
        this.cameras.freeLook.position.set(this.gridSize * 1.2, this.gridSize * 1.2, this.gridSize * 1.2);
        this.controls.target.set(0, 0, 0);
        this.controls.update();
    },

    clearEnvironment() {
        if (this.boundaryCage) {
            this.scene.remove(this.boundaryCage);
            this.boundaryCage = null;
        }
        if (this.gridHelper) {
            this.scene.remove(this.gridHelper);
            this.gridHelper = null;
        }
        this.obstacleMeshes.forEach(mesh => {
            this.scene.remove(mesh);
            mesh.geometry.dispose();
        });
        this.obstacleMeshes = [];
    },

    /* --- PROCEDURAL MESH GENERATORS (Skins & Items) --- */

    createSnakeHeadMesh(skinId) {
        const skin = Config.skinsHead.find(s => s.id === skinId) || Config.skinsHead[0];
        let geo;
        
        switch (skin.id) {
            case 'head-plasma': // Horned / Fire style shape
                geo = new THREE.ConeGeometry(0.5, 0.95, 4);
                break;
            case 'head-matrix': // Terminal shape (Hex prism)
                geo = new THREE.CylinderGeometry(0.48, 0.48, 0.95, 6);
                break;
            case 'head-gold': // Crown / Star shape
                geo = new THREE.OctahedronGeometry(0.55);
                break;
            case 'head-quantum': // Torus/Orb core hybrid
                geo = new THREE.TorusGeometry(0.35, 0.15, 8, 24);
                break;
            default: // standard cube
                geo = new THREE.BoxGeometry(0.9, 0.9, 0.9);
        }

        const mat = new THREE.MeshStandardMaterial({
            color: skin.color,
            emissive: skin.color,
            emissiveIntensity: 0.6,
            roughness: 0.1,
            metalness: 0.9
        });

        const headMesh = new THREE.Mesh(geo, mat);
        if (skin.id === 'head-plasma') {
            headMesh.rotation.x = Math.PI / 2; // point forward
        }
        
        if (Config.settings.graphics === 'high') {
            headMesh.castShadow = true;
        }

        // Add eyes to the snake head for character
        if (skin.id !== 'head-quantum') {
            const eyeGeo = new THREE.SphereGeometry(0.12, 8, 8);
            const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
            
            const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
            leftEye.position.set(-0.3, 0.2, 0.35);
            const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
            rightEye.position.set(0.3, 0.2, 0.35);
            
            headMesh.add(leftEye);
            headMesh.add(rightEye);
        }

        return headMesh;
    },

    createSnakeSegmentMesh(skinBodyId, segmentIndex, totalSegments) {
        const skin = Config.skinsBody.find(s => s.id === skinBodyId) || Config.skinsBody[0];
        
        // Scale segments down towards the tail
        const scale = 0.85 - (segmentIndex / totalSegments) * 0.45;
        const geo = new THREE.BoxGeometry(0.85 * scale, 0.85 * scale, 0.85 * scale);
        
        let mat;
        let color = 0x00d2ff;

        // Apply style rules
        if (skin.style === 'wireframe') {
            mat = new THREE.MeshBasicMaterial({
                color: 0x00f0ff,
                wireframe: true
            });
        } else if (skin.style === 'rainbow') {
            // Calculate rainbow shift based on segment position
            const hue = (segmentIndex / 15) % 1.0;
            const rCol = new THREE.Color().setHSL(hue, 1.0, 0.5);
            mat = new THREE.MeshStandardMaterial({
                color: rCol,
                emissive: rCol,
                emissiveIntensity: 0.4,
                roughness: 0.2,
                metalness: 0.7
            });
        } else if (skin.style === 'sparkle') {
            // Emissive bright purple
            mat = new THREE.MeshStandardMaterial({
                color: 0xff00ff,
                emissive: 0xbb00bb,
                emissiveIntensity: 0.8,
                roughness: 0.9,
                metalness: 0.1
            });
        } else {
            // Standard solid cyan gradient
            const colorScale = Math.max(0.2, 1.0 - (segmentIndex / totalSegments));
            color = new THREE.Color(0x00bbd4).multiplyScalar(colorScale);
            mat = new THREE.MeshStandardMaterial({
                color: color,
                emissive: color,
                emissiveIntensity: 0.2,
                roughness: 0.3,
                metalness: 0.7
            });
        }

        const mesh = new THREE.Mesh(geo, mat);
        if (Config.settings.graphics === 'high') {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
        }
        return mesh;
    },

    createFoodMesh(skinFoodId) {
        const skin = Config.skinsFood.find(s => s.id === skinFoodId) || Config.skinsFood[0];
        let geo;

        switch (skin.shape) {
            case 'cube':
                geo = new THREE.BoxGeometry(0.65, 0.65, 0.65);
                break;
            case 'torus':
                geo = new THREE.TorusGeometry(0.38, 0.12, 8, 16);
                break;
            case 'prism':
                geo = new THREE.OctahedronGeometry(0.5);
                break;
            default:
                geo = new THREE.SphereGeometry(0.42, 16, 16);
        }

        // Animated neon gold/magenta food
        const mat = new THREE.MeshStandardMaterial({
            color: 0xffaa00,
            emissive: 0xffaa00,
            emissiveIntensity: 1.0,
            roughness: 0.1,
            metalness: 0.9
        });

        const mesh = new THREE.Mesh(geo, mat);
        if (Config.settings.graphics === 'high') {
            mesh.castShadow = true;
        }
        return mesh;
    },

    createPowerupMesh(type) {
        let geo = new THREE.IcosahedronGeometry(0.4, 0);
        let color = 0xff0055; // default speed

        if (type === 'shield') {
            geo = new THREE.BoxGeometry(0.55, 0.55, 0.55);
            color = 0x39ff14;
        } else if (type === 'slow') {
            geo = new THREE.CylinderGeometry(0.3, 0.3, 0.6, 8);
            color = 0xffaa00;
        } else if (type === 'magnet') {
            geo = new THREE.TorusGeometry(0.32, 0.1, 6, 12);
            color = 0x9d00ff;
        }

        const mat = new THREE.MeshStandardMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 1.2,
            roughness: 0.1,
            metalness: 0.9
        });

        const mesh = new THREE.Mesh(geo, mat);
        if (Config.settings.graphics === 'high') {
            mesh.castShadow = true;
        }
        return mesh;
    },

    /* --- VISUAL PARTICLE EFFECTS ENGINE --- */

    spawnExplosion(position, color, count = 25) {
        const geo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
        const mat = new THREE.MeshBasicMaterial({
            color: color || 0x00f0ff,
            transparent: true,
            opacity: 1
        });

        for (let i = 0; i < count; i++) {
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.copy(position);
            
            // Random direction vectors
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 8.0,
                (Math.random() - 0.5) * 8.0,
                (Math.random() - 0.5) * 8.0
            );

            this.scene.add(mesh);
            
            this.particles.push({
                mesh: mesh,
                velocity: velocity,
                life: 1.0, // scale factor from 1.0 down to 0.0
                decay: 0.02 + Math.random() * 0.04
            });
        }
    },

    spawnTrailSpark(position, color) {
        if (this.particles.length > this.maxParticles) {
            // reuse oldest particle to save memory
            const old = this.particles.shift();
            this.scene.remove(old.mesh);
            old.mesh.geometry.dispose();
        }

        const geo = new THREE.SphereGeometry(0.06, 4, 4);
        const mat = new THREE.MeshBasicMaterial({
            color: color || 0x00f0ff,
            transparent: true,
            opacity: 0.8
        });

        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(position).add(new THREE.Vector3(
            (Math.random() - 0.5) * 0.4,
            (Math.random() - 0.5) * 0.4,
            (Math.random() - 0.5) * 0.4
        ));

        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.8,
            (Math.random() - 0.5) * 0.8,
            (Math.random() - 0.5) * 0.8
        );

        this.scene.add(mesh);
        
        this.particles.push({
            mesh: mesh,
            velocity: velocity,
            life: 0.8,
            decay: 0.05
        });
    },

    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            p.mesh.position.addScaledVector(p.velocity, deltaTime);
            p.life -= p.decay;
            
            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                p.mesh.geometry.dispose();
                this.particles.splice(i, 1);
            } else {
                p.mesh.material.opacity = p.life;
                p.mesh.scale.set(p.life, p.life, p.life);
            }
        }
    },

    /* --- MAIN CAMERA UPDATE AND LERP TICK LOOP --- */

    updateCameras(snakeHeadPos, snakeDir) {
        if (!snakeHeadPos) return;

        // Vector pointing opposite to movement dir for chasing
        const oppDir = snakeDir.clone().negate();
        
        // 1. Update Third Person Chase Camera
        const targetTPPos = snakeHeadPos.clone()
            .addScaledVector(oppDir, 4.5) // Distance behind
            .add(new THREE.Vector3(0, 2.5, 0)); // Height offset
            
        this.cameras.thirdPerson.position.lerp(targetTPPos, this.targetCameraLerpSpeed);
        this.cameras.thirdPerson.lookAt(snakeHeadPos.clone().addScaledVector(snakeDir, 2));

        // 2. Update First Person Cockpit Camera
        const targetFPPos = snakeHeadPos.clone().addScaledVector(snakeDir, 0.4); // slightly forward of center
        this.cameras.firstPerson.position.copy(targetFPPos);
        
        // Head orientation
        const lookTarget = snakeHeadPos.clone().addScaledVector(snakeDir, 5);
        this.cameras.firstPerson.lookAt(lookTarget);

        // Point Light tracks head
        this.lights.headLight.position.copy(snakeHeadPos);
    },

    onWindowResize() {
        if (!this.container || !this.renderer) return;

        const width = this.container.clientWidth || window.innerWidth || 800;
        const height = this.container.clientHeight || window.innerHeight || 600;

        this.renderer.setSize(width, height);
        
        Object.values(this.cameras).forEach(cam => {
            if (cam && cam.isPerspectiveCamera) {
                cam.aspect = width / height;
                cam.updateProjectionMatrix();
            }
        });
    },

    animate() {
        this.animFrameId = requestAnimationFrame(this.animate.bind(this));
        
        const delta = 0.016; // Approx 60FPS tick

        // Rotate Orbit controls if enabled
        if (Config.settings.cameraMode === 'free-look' && this.controls) {
            this.controls.update();
        }

        // Animate particles
        this.updateParticles(delta);

        // Perform camera track in game state
        if (this.snakeRef && this.gameStateRef && this.gameStateRef.playing) {
            const headPos = this.snakeRef.getHeadWorldPosition();
            const headDir = this.snakeRef.getDirectionVector();
            this.updateCameras(headPos, headDir);
            
            // Generate minor sparks from tail end
            if (Math.random() < 0.25 && this.snakeRef.segments.length > 0) {
                const tailMesh = this.snakeRef.segments[this.snakeRef.segments.length - 1].mesh;
                if (tailMesh) {
                    const col = LevelData.levels[this.gameStateRef.currentLevel].theme.particleColor;
                    this.spawnTrailSpark(tailMesh.position, col);
                }
            }
        }

        // Render scene
        if (this.scene && this.cameras.active) {
            this.renderer.render(this.scene, this.cameras.active);
        }
    }
};

window.ThreeSetup = ThreeSetup;
