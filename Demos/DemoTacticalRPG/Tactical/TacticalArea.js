export const TACTICAL_AREA_SHAPES = Object.freeze({
    DIAMOND: "diamond",
    SQUARE: "square",
    CROSS: "cross",
    LINE: "line",
    CUSTOM: "custom",
});

export class TacticalArea {
    static Tiles(origin, {
        range = 1,
        shape = TACTICAL_AREA_SHAPES.DIAMOND,
        pattern = null,
        includeOrigin = false,
        grid = null,
    } = {}) {
        const offsets = this.Offsets(range, shape, pattern);
        const seen = new Set();
        const tiles = [];

        for (const offset of offsets) {
            const col = origin.col + offset.col;
            const row = origin.row + offset.row;
            const key = `${col},${row}`;
            if (seen.has(key)) continue;
            if (!includeOrigin && col === origin.col && row === origin.row) continue;
            if (grid && !grid.IsInside(col, row)) continue;

            seen.add(key);
            tiles.push({ col, row, offset });
        }

        return tiles;
    }

    static MoveArea(unit, grid, units = []) {
        const area = [{ col: unit.col, row: unit.row, cost: 0 }];

        for (let col = 0; col < grid.world.cols; col += 1) {
            for (let row = 0; row < grid.world.rows; row += 1) {
                if (col === unit.col && row === unit.row) continue;

                const path = grid.FindPath(unit, col, row, units);
                if (!path) continue;

                const cost = path.length - 1;
                if (cost <= unit.moveRange) area.push({ col, row, cost });
            }
        }

        return area;
    }

    static Offsets(range, shape = TACTICAL_AREA_SHAPES.DIAMOND, pattern = null) {
        if (shape === TACTICAL_AREA_SHAPES.CUSTOM && Array.isArray(pattern)) {
            return pattern.map(item => ({
                col: Number(item.col ?? item.x ?? 0),
                row: Number(item.row ?? item.y ?? 0),
            }));
        }

        const offsets = [];
        for (let col = -range; col <= range; col += 1) {
            for (let row = -range; row <= range; row += 1) {
                const distance = Math.abs(col) + Math.abs(row);
                const maxAxis = Math.max(Math.abs(col), Math.abs(row));
                const isOrigin = col === 0 && row === 0;

                if (isOrigin) continue;
                if (shape === TACTICAL_AREA_SHAPES.DIAMOND && distance <= range) offsets.push({ col, row });
                else if (shape === TACTICAL_AREA_SHAPES.SQUARE && maxAxis <= range) offsets.push({ col, row });
                else if (shape === TACTICAL_AREA_SHAPES.CROSS && (col === 0 || row === 0) && distance <= range) offsets.push({ col, row });
                else if (shape === TACTICAL_AREA_SHAPES.LINE && (col === 0 || row === 0) && distance === range) offsets.push({ col, row });
            }
        }

        return offsets;
    }

    static Contains(area, col, row) {
        return area.some(tile => tile.col === col && tile.row === row);
    }

    static Manhattan(a, b) {
        return Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
    }
}
