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

export function key(node) {
	return `${node.x},${node.y}`;
}

export function reconstructPath(cameFrom, current) {
	const path = [current];
	while (cameFrom[key(current)]) {
		current = cameFrom[key(current)];
		path.push(current);
	}
	return path.reverse();
}