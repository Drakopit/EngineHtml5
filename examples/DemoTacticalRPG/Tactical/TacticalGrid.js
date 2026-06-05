import { aStar } from "../../../src/CoreCross/Pathfinding/AStar.js";

export const DEFAULT_TACTICAL_WORLD = Object.freeze({
    cols: 10,
    rows: 7,
    cell: 60,
    originX: 20,
    originY: 10,
});

export class TacticalGrid {
    constructor(stage = {}) {
        this.stage = stage;
        this.world = { ...DEFAULT_TACTICAL_WORLD, ...(stage.world ?? {}) };
        this.tilemap = stage.tilemap ?? {};
        this.blockedTiles = new Set(this.tilemap.blockedTiles ?? []);
    }

    TileKey(col, row) {
        return `${col},${row}`;
    }

    IsInside(col, row) {
        return col >= 0
            && row >= 0
            && col < this.world.cols
            && row < this.world.rows;
    }

    IsBlocked(col, row) {
        return this.blockedTiles.has(this.TileKey(col, row));
    }

    TileToPixel(col, row) {
        return {
            x: this.world.originX + col * this.world.cell + this.world.cell / 2,
            y: this.world.originY + row * this.world.cell + this.world.cell / 2,
        };
    }

    TileBounds(col, row) {
        return {
            x: this.world.originX + col * this.world.cell,
            y: this.world.originY + row * this.world.cell,
            width: this.world.cell,
            height: this.world.cell,
        };
    }

    BuildPathGrid(units = [], movingUnit = null) {
        const grid = Array.from(
            { length: this.world.cols },
            () => Array.from({ length: this.world.rows }, () => 0)
        );

        for (const key of this.blockedTiles) {
            const [col, row] = key.split(",").map(Number);
            if (this.IsInside(col, row)) grid[col][row] = 1;
        }

        for (const unit of units) {
            if (unit === movingUnit || !unit?.IsAlive?.()) continue;
            if (this.IsInside(unit.col, unit.row)) grid[unit.col][unit.row] = 1;
        }

        if (movingUnit && this.IsInside(movingUnit.col, movingUnit.row)) {
            grid[movingUnit.col][movingUnit.row] = 0;
        }

        return grid;
    }

    FindPath(unit, targetCol, targetRow, units = []) {
        if (!this.IsInside(targetCol, targetRow) || this.IsBlocked(targetCol, targetRow)) return null;

        const occupied = units.some(other => (
            other !== unit
            && other?.IsAlive?.()
            && other.col === targetCol
            && other.row === targetRow
        ));
        if (occupied) return null;

        return aStar(
            this.BuildPathGrid(units, unit),
            { x: unit.col, y: unit.row },
            { x: targetCol, y: targetRow }
        );
    }
}
