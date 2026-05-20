import { getNeighbors, key, reconstructPath } from './Structure.js';

/**
 * 🔵 4️⃣ A* (A-Star)
 * Usa heurística
 * Muito mais rápido para pathfinding
 * Ideal para jogos
 * 
 * @doc Function aStar
 * @param {*} grid 
 * @param {*} start 
 * @param {*} goal 
 * @returns 
 */

function heuristic(a, b) {
	return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); // Manhattan
}

export function aStar(grid, start, goal) {
	const openSet = [start];
	const cameFrom = {};
	const gScore = {};
	const fScore = {};

	gScore[key(start)] = 0;
	fScore[key(start)] = heuristic(start, goal);

	while (openSet.length) {
		openSet.sort((a, b) => fScore[key(a)] - fScore[key(b)]);
		const current = openSet.shift();

		if (current.x === goal.x && current.y === goal.y) {
			return reconstructPath(cameFrom, current);
		}

		for (let neighbor of getNeighbors(grid, current)) {
			const tentativeG = gScore[key(current)] + 1;

			if (
				gScore[key(neighbor)] === undefined ||
				tentativeG < gScore[key(neighbor)]
			) {
				cameFrom[key(neighbor)] = current;
				gScore[key(neighbor)] = tentativeG;
				fScore[key(neighbor)] =
					tentativeG + heuristic(neighbor, goal);

				if (!openSet.find(n => key(n) === key(neighbor))) {
					openSet.push(neighbor);
				}
			}
		}
	}

	return null;
}