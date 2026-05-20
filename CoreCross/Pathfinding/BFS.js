import { getNeighbors, key, reconstructPath } from './Structure.js';

/**
 * 🔵 1️⃣ BFS (Breadth-First Search)
 * Explora em largura
 * ✅ Garante menor caminho
 *  
 * @doc Function bfs
 * @param {*} grid 
 * @param {*} start 
 * @param {*} goal 
 * @returns 
 */

export function bfs(grid, start, goal) {
	const queue = [start];
	const visited = new Set();
	const cameFrom = {};

	visited.add(key(start));

	while (queue.length) {
		const current = queue.shift();

		if (current.x === goal.x && current.y === goal.y) {
			return reconstructPath(cameFrom, current);
		}

		for (let neighbor of getNeighbors(grid, current)) {
			if (!visited.has(key(neighbor))) {
				visited.add(key(neighbor));
				cameFrom[key(neighbor)] = current;
				queue.push(neighbor);
			}
		}
	}

	return null;
}