import { getNeighbors, key, reconstructPath } from './Structure.js';

/**
 * 🔵 2️⃣ DFS (Depth-First Search)
 * Explora até o fundo
 * ❌ Não garante menor caminho
 * 
 * @doc Function dfs
 * @param {*} grid 
 * @param {*} start 
 * @param {*} goal 
 * @returns 
 */

export function dfs(grid, start, goal) {
	const stack = [start];
	const visited = new Set();
	const cameFrom = {};

	visited.add(key(start));

	while (stack.length) {
		const current = stack.pop();

		if (current.x === goal.x && current.y === goal.y) {
			return reconstructPath(cameFrom, current);
		}

		for (let neighbor of getNeighbors(grid, current)) {
			if (!visited.has(key(neighbor))) {
				visited.add(key(neighbor));
				cameFrom[key(neighbor)] = current;
				stack.push(neighbor);
			}
		}
	}

	return null;
}