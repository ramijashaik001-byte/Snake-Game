# Snake 3D: Cyber Grid

A high-performance, single-plane offline 3D Snake Game implemented using HTML5, CSS3, JavaScript, and Three.js (WebGL). The game runs completely offline without remote API keys, third-party network fetches, or CORS restrictions.

## Features

- **3D Graphics Engine**: High-fidelity WebGL graphics rendered with Three.js.
- **Planar 2D Gameplay**: The snake moves on a single flat grid plane (isometric top-down view).
- **Procedural Synthesizer**: Uses browser Web Audio API to synthesize bleeps, sweeps, noise-based crashes, and a looping synthwave backing track completely offline.
- **SafeStorage Fallback**: Bypasses browser strict sandboxing policies on `file://` protocols by dynamically falling back to an in-memory database when `localStorage` is blocked.
- **Unit Test Suite**: Full test coverage of coordinate translation, wall collision math, and gravity attraction resolvers using Jest.

---

## Installation & Setup

Ensure you have [Node.js](https://nodejs.org/) installed.

1. Clone or extract the directory.
2. Navigate to the project root folder.
3. Install dependencies:
   ```bash
   npm install
   ```

## Running the Application

### Method 1: Local HTTP Server (Recommended)
Launch the built-in Node.js server:
```bash
npm start
```
Then navigate to [http://localhost:8003](http://localhost:8003) in your web browser.

### Method 2: Double-click index.html
Open the `index.html` file directly in any modern browser. The game will run offline by utilizing the `SafeStorage` fallback.

### Method 3: Docker Container
Build and host the project inside a Docker container:
```bash
docker build -t snake-3d-cyber-grid .
docker run -p 8003:8003 snake-3d-cyber-grid
```

---

## Executing Tests

To run the unit tests and collect coverage reports:
```bash
npm test
```

---

## Directory Layout

```
.
├── index.html          # Simplified DOM frame
├── style.css           # Styling sheets and animations
├── server.js           # Static HTTP web server
├── Dockerfile          # Containerized build file
├── Makefile            # Build shortcuts
├── package.json        # Project manifest
├── jest.config.js      # Test configurations
├── js/
│   ├── three.min.js    # Local ThreeJS library
│   ├── OrbitControls.js# Local OrbitControls helper
│   ├── engine.js       # Synthesizer and storage wrapper
│   ├── level-data.js   # Grid configurations
│   ├── matrix-database.js # Procedural levels database (57,000+ LOC)
│   ├── three-setup.js  # Scene lighting & camera core
│   ├── game-logic.js   # Snake coordinate logic
│   ├── ui-manager.js   # Key handlers
│   └── main.js         # Loop orchestrator
└── tests/
    └── game.test.js    # Vector mechanics unit tests
```
