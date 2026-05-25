/**
 * Returns walkable cardinal neighbors for a grid coordinate.
 * @param {number[][]} grid - Grid whose zero entries can be walked.
 * @param {Object} node - Current `{x, y}` coordinate.
 * @returns {Object[]} Adjacent walkable coordinates.
 */
export function getNeighbors(grid, node) {
	const directions = [
		[0, 1],
		[1, 0],
		[0, -1],
		[-1, 0],
	];

	const neighbors = [];

	for (let [dx, dy] of directions) {
		const x = node.x + dx;
		const y = node.y + dy;

		if (
			x >= 0 &&
			y >= 0 &&
			x < grid.length &&
			y < grid[0].length &&
			grid[x][y] === 0
		) {
			neighbors.push({ x, y });
		}
	}

	return neighbors;
}

/**
 * Encodes a coordinate for pathfinding maps.
 * @param {Object} node - Coordinate containing `x` and `y`.
 * @returns {string} Stable coordinate key.
 */
export function key(node) {
	return `${node.x},${node.y}`;
}

/**
 * Reconstructs a discovered route from predecessor entries.
 * @param {Object} cameFrom - Coordinate-keyed predecessor map.
 * @param {Object} current - Goal coordinate.
 * @returns {Object[]} Ordered route.
 */
export function reconstructPath(cameFrom, current) {
	const path = [current];
	while (cameFrom[key(current)]) {
		current = cameFrom[key(current)];
		path.push(current);
	}
	return path.reverse();
}
