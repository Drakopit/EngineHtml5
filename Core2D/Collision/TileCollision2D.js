import { Collide2D } from "../Math/Collide2D.js";

export class TileCollision2D {
    static RectFromTile(tileX, tileY, tileSize) {
        return {
            x: tileX * tileSize,
            y: tileY * tileSize,
            width: tileSize,
            height: tileSize,
        };
    }

    static IntersectsTile(rect, tileX, tileY, tileSize) {
        return Collide2D.IntersectsRect(rect, this.RectFromTile(tileX, tileY, tileSize));
    }

    static QuerySolidTiles(rect, {
        tileSize,
        worldWidth = Infinity,
        worldHeight = Infinity,
        getTile,
        isSolid = tile => Boolean(tile) && tile.type !== "air",
        padding = 1,
    } = {}) {
        if (!tileSize || typeof getTile !== "function") return [];

        const minX = Math.max(0, Math.floor(rect.x / tileSize) - padding);
        const maxX = Math.min(worldWidth - 1, Math.floor((rect.x + rect.width) / tileSize) + padding);
        const minY = Math.max(0, Math.floor(rect.y / tileSize) - padding);
        const maxY = Math.min(worldHeight - 1, Math.floor((rect.y + rect.height) / tileSize) + padding);
        const tiles = [];

        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                const tile = getTile(x, y);
                if (!isSolid(tile, x, y)) continue;

                tiles.push({
                    x,
                    y,
                    tile,
                    rect: this.RectFromTile(x, y, tileSize),
                });
            }
        }

        return tiles;
    }

    static Move(rect, {
        delta = 1 / 60,
        tileSize,
        worldWidth = Infinity,
        worldHeight = Infinity,
        getTile,
        isSolid,
    } = {}) {
        const result = {
            left: false,
            right: false,
            top: false,
            bottom: false,
            grounded: false,
        };

        rect.x += (rect.vx ?? 0) * delta;
        this.ResolveAxis(rect, "x", { tileSize, worldWidth, worldHeight, getTile, isSolid, result });

        rect.y += (rect.vy ?? 0) * delta;
        rect.grounded = false;
        this.ResolveAxis(rect, "y", { tileSize, worldWidth, worldHeight, getTile, isSolid, result });
        rect.grounded = result.grounded;

        if (Number.isFinite(worldWidth)) {
            rect.x = Math.max(0, Math.min((worldWidth * tileSize) - rect.width, rect.x));
        }

        return result;
    }

    static ResolveAxis(rect, axis, options = {}) {
        const tiles = this.QuerySolidTiles(rect, options);
        const velocityKey = axis === "x" ? "vx" : "vy";
        const velocity = rect[velocityKey] ?? 0;
        if (velocity === 0) return;

        tiles.forEach(tile => {
            if (!Collide2D.IntersectsRect(rect, tile.rect)) return;

            if (axis === "x") {
                if (velocity > 0) {
                    rect.x = tile.rect.x - rect.width;
                    options.result.right = true;
                } else {
                    rect.x = tile.rect.x + tile.rect.width;
                    options.result.left = true;
                }

                rect.vx = 0;
                return;
            }

            if (velocity > 0) {
                rect.y = tile.rect.y - rect.height;
                rect.vy = 0;
                options.result.bottom = true;
                options.result.grounded = true;
            } else {
                rect.y = tile.rect.y + tile.rect.height;
                rect.vy = 0;
                options.result.top = true;
            }
        });
    }
}
