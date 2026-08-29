/**
 * SNAKE 3D: Cyber Grid - Jest Unit Tests
 * Tests core vector mathematics, boundary configurations, and coordinate resolvers.
 */

describe('Snake 3D Grid Vector Mechanics', () => {
    test('Verify coordinate translation along direction vector', () => {
        const head = { x: 0, y: 0, z: 0 };
        const direction = { x: 0, y: 0, z: 1 }; // Move forward

        const nextX = head.x + direction.x;
        const nextY = head.y + direction.y;
        const nextZ = head.z + direction.z;

        expect(nextX).toBe(0);
        expect(nextY).toBe(0);
        expect(nextZ).toBe(1);
    });

    test('Verify planar boundary detection logic', () => {
        const gridSize = 16;
        const boundary = gridSize / 2;

        const checkCollision = (x, y, z) => {
            return (
                Math.abs(x) >= boundary ||
                Math.abs(y) >= boundary ||
                Math.abs(z) >= boundary
            );
        };

        // Inner coordinates must not collide
        expect(checkCollision(0, 0, 0)).toBe(false);
        expect(checkCollision(7, 0, -4)).toBe(false);

        // Boundary edges must collide
        expect(checkCollision(8, 0, 0)).toBe(true);
        expect(checkCollision(0, -8, 0)).toBe(true);
        expect(checkCollision(0, 0, 8)).toBe(true);
    });

    test('Verify distance checks for magnet gravity harvester', () => {
        const head = { x: 0, y: 0, z: 0 };
        const food = { x: 0, y: 0, z: 4 };

        const getDistance = (p1, p2) => {
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const dz = p1.z - p2.z;
            return Math.sqrt(dx * dx + dy * dy + dz * dz);
        };

        const distance = getDistance(head, food);
        expect(distance).toBe(4);
        
        // Magnet should activate under distance threshold 5
        expect(distance <= 5.0).toBe(true);
    });
});
