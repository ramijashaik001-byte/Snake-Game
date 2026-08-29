/**
 * SNAKE 3D: Hyperdimensional - Level & Sector Configurations
 * Houses spatial grids, boundary dimensions, obstacle coordinates, colors, and game milestones.
 */

const LevelData = {
    // Helper to generate a hollow box or solid pillars of obstacles
    // All coordinates are integers mapped to grid space [-size/2, size/2]
    levels: {
        1: {
            id: 1,
            name: "Cyber Grid",
            description: "Sector 1: Baseline system simulation. Empty container to initialize matrix synchrony.",
            gridSize: 16,
            tickSpeed: 130, // speed in ms
            targetScore: 1000,
            theme: {
                clearColor: 0x05050a,
                fogColor: 0x05050a,
                fogNear: 20,
                fogFar: 60,
                gridColor: 0x00f0ff,
                wallColor: 0x002244,
                wallEmissive: 0x001122,
                ambientLight: 0x223344,
                spotLight: 0xffffff,
                particleColor: 0x00f0ff
            },
            obstacles: [] // Empty level for training
        },
        2: {
            id: 2,
            name: "Obsidian Pillars",
            description: "Sector 2: Volatile lava corridors. Thermal columns rise from the substrate, blocking linear vectors.",
            gridSize: 18,
            tickSpeed: 110,
            targetScore: 2000,
            theme: {
                clearColor: 0x080202,
                fogColor: 0x080202,
                fogNear: 15,
                fogFar: 50,
                gridColor: 0xff3300,
                wallColor: 0x330800,
                wallEmissive: 0x110200,
                ambientLight: 0x442211,
                spotLight: 0xffaa00,
                particleColor: 0xff5500
            },
            // Generate columns of obstacles (vertical pillars)
            // Obstacles represented as {x, y, z} coordinates in the grid.
            // Grid runs from -gridSize/2 to gridSize/2 (integers)
            obstacles: (function() {
                const obs = [];
                // 4 pillars at corners of inner box
                const size = 18;
                const offset = 4;
                const minH = -Math.floor(size/2) + 1;
                const maxH = Math.floor(size/2) - 1;
                
                const pillarPositions = [
                    { x: -offset, z: -offset },
                    { x: -offset, z: offset },
                    { x: offset, z: -offset },
                    { x: offset, z: offset }
                ];
                
                pillarPositions.forEach(pos => {
                    for (let y = minH; y <= maxH; y++) {
                        // Skip the middle block to allow cross-through
                        if (y !== 0 && y !== 1 && y !== -1) {
                            obs.push({ x: pos.x, y: y, z: pos.z });
                        }
                    }
                });
                return obs;
            })()
        },
        3: {
            id: 3,
            name: "Glacier Fortress",
            description: "Sector 3: Deep sub-zero storage array. Corner blocks and perimeter walls contract operational volume.",
            gridSize: 20,
            tickSpeed: 95,
            targetScore: 3000,
            theme: {
                clearColor: 0x02080a,
                fogColor: 0x02080a,
                fogNear: 25,
                fogFar: 70,
                gridColor: 0x00ffaa,
                wallColor: 0x003322,
                wallEmissive: 0x001108,
                ambientLight: 0x113333,
                spotLight: 0x88ffff,
                particleColor: 0x00ffaa
            },
            obstacles: (function() {
                const obs = [];
                const size = 20;
                const half = Math.floor(size / 2) - 1;
                
                // Add large blocks in all 8 corners of the 3D grid
                const corners = [-half, half];
                
                corners.forEach(cx => {
                    corners.forEach(cy => {
                        corners.forEach(cz => {
                            // Sub-cubes of size 2x2x2 in corners
                            for (let dx = 0; dx <= 1; dx++) {
                                for (let dy = 0; dy <= 1; dy++) {
                                    for (let dz = 0; dz <= 1; dz++) {
                                        const ox = cx + (cx > 0 ? -dx : dx);
                                        const oy = cy + (cy > 0 ? -dy : dy);
                                        const oz = cz + (cz > 0 ? -dz : dz);
                                        obs.push({ x: ox, y: oy, z: oz });
                                    }
                                }
                            }
                        });
                    });
                });
                
                return obs;
            })()
        },
        4: {
            id: 4,
            name: "Acid Core",
            description: "Sector 4: Toxic sludge pump. An array of floating core reactors blocks central coordinate pathways.",
            gridSize: 16,
            tickSpeed: 80,
            targetScore: 4000,
            theme: {
                clearColor: 0x040602,
                fogColor: 0x040602,
                fogNear: 15,
                fogFar: 50,
                gridColor: 0xccff00,
                wallColor: 0x223300,
                wallEmissive: 0x0d1400,
                ambientLight: 0x222a11,
                spotLight: 0xdfff80,
                particleColor: 0xccff00
            },
            obstacles: (function() {
                const obs = [];
                const size = 16;
                const half = Math.floor(size / 2);
                
                // Cross barrier pattern in the center plane (y = 0)
                for (let i = -3; i <= 3; i++) {
                    if (i !== 0) {
                        obs.push({ x: i, y: 0, z: 0 }); // X-axis line
                        obs.push({ x: 0, y: 0, z: i }); // Z-axis line
                    }
                }
                
                // Double floating shields above and below
                obs.push({ x: 0, y: 4, z: 0 });
                obs.push({ x: 1, y: 4, z: 0 });
                obs.push({ x: -1, y: 4, z: 0 });
                obs.push({ x: 0, y: 4, z: 1 });
                obs.push({ x: 0, y: 4, z: -1 });

                obs.push({ x: 0, y: -4, z: 0 });
                obs.push({ x: 1, y: -4, z: 0 });
                obs.push({ x: -1, y: -4, z: 0 });
                obs.push({ x: 0, y: -4, z: 1 });
                obs.push({ x: 0, y: -4, z: -1 });
                
                return obs;
            })()
        },
        5: {
            id: 5,
            name: "Hypercube Singularity",
            description: "Sector 5: Maximum security vector database. Moving around an unstable quantum singularity cage.",
            gridSize: 18,
            tickSpeed: 70,
            targetScore: 5000,
            theme: {
                clearColor: 0x060208,
                fogColor: 0x060208,
                fogNear: 20,
                fogFar: 55,
                gridColor: 0x9d00ff,
                wallColor: 0x2a0044,
                wallEmissive: 0x110022,
                ambientLight: 0x221133,
                spotLight: 0xdf80ff,
                particleColor: 0x9d00ff
            },
            obstacles: (function() {
                const obs = [];
                const size = 18;
                const half = Math.floor(size / 2);
                
                // Construct a cage around the center (from -3 to +3 coordinates)
                // We add corner points of the central cage box
                const offsets = [-3, 3];
                for (let x = -3; x <= 3; x++) {
                    for (let y = -3; y <= 3; y++) {
                        for (let z = -3; z <= 3; z++) {
                            // Check if coordinate is on the boundary edges of the 6x6x6 central zone
                            const onX = x === -3 || x === 3;
                            const onY = y === -3 || y === 3;
                            const onZ = z === -3 || z === 3;
                            
                            // If it's on at least two boundary planes, it forms a wireframe outline cage
                            if ((onX && onY) || (onY && onZ) || (onX && onZ)) {
                                obs.push({ x, y, z });
                            }
                        }
                    }
                }
                
                // Add the exact center singularity blocker
                obs.push({ x: 0, y: 0, z: 0 });
                
                return obs;
            })()
        }
    },

    // Check if coordinates overlap with an obstacle
    isObstacle(levelId, x, y, z) {
        const level = this.levels[levelId];
        if (!level || !level.obstacles) return false;
        
        return level.obstacles.some(obs => obs.x === x && obs.y === y && obs.z === z);
    }
};

// Bind to window
window.LevelData = LevelData;

// Merge massive procedural levels from MatrixDatabase if loaded
try {
    if (window.MatrixDatabase) {
        Object.keys(window.MatrixDatabase).forEach(key => {
            LevelData.levels[key] = window.MatrixDatabase[key]();
        });
    }
} catch (e) {
    console.error("Matrix database levels merge failed:", e);
}


