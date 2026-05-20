export class TacticalMapRenderer {
    constructor({ level, grid, stage, assets }) {
        this.level = level;
        this.grid = grid;
        this.stage = stage;
        this.assets = assets;
    }

    DrawMap() {
        this.DrawTileset();
    }

    DrawTileset() {
        const draw = this.level.draw;
        const ctx = this.level.screen.Context;
        const tilemap = this.stage.tilemap ?? {};
        const image = this.Image(tilemap.sprite);
        const tiles = tilemap.tiles ?? {};

        for (let row = 0; row < this.grid.world.rows; row += 1) {
            for (let col = 0; col < this.grid.world.cols; col += 1) {
                const bounds = this.grid.TileBounds(col, row);
                const tileId = this.TileIdFor(col, row);
                const tile = tiles[tileId] ?? tilemap.blockedTile ?? { x: 64, y: 64, width: 64, height: 64 };

                if (image?.complete && image.naturalWidth) {
                    ctx.drawImage(
                        image,
                        tile.x ?? 0,
                        tile.y ?? 0,
                        tile.width ?? tilemap.tileWidth ?? this.grid.world.cell,
                        tile.height ?? tilemap.tileHeight ?? this.grid.world.cell,
                        bounds.x,
                        bounds.y,
                        bounds.width,
                        bounds.height
                    );
                } else {
                    draw.Style = draw.TYPES.FILLED;
                    draw.Color = this.grid.IsBlocked(col, row) ? "#20242C" : "#2C4A2C";
                    draw.DrawRect(bounds.x, bounds.y, bounds.width, bounds.height);
                }

                draw.Style = draw.TYPES.STROKED;
                draw.Color = this.grid.IsBlocked(col, row)
                    ? "rgba(12, 17, 25, 0.68)"
                    : "rgba(11, 19, 11, 0.28)";
                draw.DrawRect(bounds.x, bounds.y, bounds.width, bounds.height);
            }
        }

        draw.Style = draw.TYPES.FILLED;
    }

    TileIdFor(col, row) {
        const terrainRows = this.stage.tilemap?.terrainRows ?? this.stage.tilemap?.terrain ?? null;
        if (terrainRows?.[row]?.[col]) return terrainRows[row][col];
        if (this.grid.IsBlocked(col, row)) return this.stage.tilemap?.blockedTileId ?? "cliff_mid";

        const top = row === 0;
        const bottom = row === this.grid.world.rows - 1;
        const left = col === 0;
        const right = col === this.grid.world.cols - 1;

        if (top && left) return "grass_top_left";
        if (top && right) return "grass_top_right";
        if (bottom && left) return "grass_bottom_left";
        if (bottom && right) return "grass_bottom_right";
        if (top) return "grass_top";
        if (bottom) return "grass_bottom";
        if (left) return "grass_left";
        if (right) return "grass_right";
        return "grass_center";
    }

    DrawObjects(layer = "back") {
        const objects = [...(this.stage.objects ?? [])]
            .filter(object => object.visible !== false)
            .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));

        for (const object of objects) {
            const zIndex = object.zIndex ?? 0;
            if (layer === "back" && zIndex >= 20) continue;
            if (layer === "front" && zIndex < 20) continue;
            this.DrawObject(object);
        }
    }

    DrawObject(object) {
        const draw = this.level.draw;
        const image = this.Image(object.asset ?? object.sprite);
        if (image?.complete && image.naturalWidth) {
            const frame = object.frame ?? {
                x: 0,
                y: 0,
                width: image.naturalWidth,
                height: image.naturalHeight,
            };
            this.level.screen.Context.drawImage(
                image,
                frame.x ?? 0,
                frame.y ?? 0,
                frame.width ?? image.naturalWidth,
                frame.height ?? image.naturalHeight,
                object.x,
                object.y,
                object.width,
                object.height
            );
            return;
        }

        draw.Style = draw.TYPES.FILLED;
        draw.Color = "rgba(96, 165, 250, 0.2)";
        draw.DrawRect(object.x, object.y, object.width ?? 32, object.height ?? 32);
    }

    DrawAreas(moveArea, actionArea, actionColor) {
        this.DrawArea(moveArea, "rgba(62, 145, 255, 0.42)");
        this.DrawArea(actionArea, actionColor ?? "rgba(255, 72, 72, 0.42)");
    }

    DrawArea(area = [], color) {
        if (!area.length) return;

        const draw = this.level.draw;
        draw.Style = draw.TYPES.FILLED;
        draw.Color = color;
        for (const tile of area) {
            const bounds = this.grid.TileBounds(tile.col, tile.row);
            draw.DrawRect(bounds.x + 5, bounds.y + 5, bounds.width - 10, bounds.height - 10);
        }
    }

    DrawPath(path = []) {
        if (!path.length) return;

        const draw = this.level.draw;
        draw.Style = draw.TYPES.FILLED;
        draw.Color = "rgba(255, 226, 74, 0.75)";
        for (const step of path) {
            const bounds = this.grid.TileBounds(step.x, step.y);
            draw.DrawRect(bounds.x + 18, bounds.y + 18, bounds.width - 36, bounds.height - 36);
        }
    }

    DrawUnits(units = []) {
        units
            .filter(unit => unit?.IsAlive?.())
            .sort((a, b) => a.pixelY - b.pixelY)
            .forEach(unit => unit.OnDrawn());
    }

    DrawCursor(cursor) {
        const draw = this.level.draw;
        const bounds = this.grid.TileBounds(cursor.col, cursor.row);
        const cursorImage = this.Image("tactical_cursor");

        if (cursorImage?.complete && cursorImage.naturalWidth) {
            this.level.screen.Context.drawImage(
                cursorImage,
                bounds.x - 2,
                bounds.y - 2,
                bounds.width + 4,
                bounds.height + 4
            );
            return;
        }

        draw.Style = draw.TYPES.STROKED;
        draw.Color = "#FFD84A";
        draw.DrawRect(bounds.x + 2, bounds.y + 2, bounds.width - 4, bounds.height - 4);
        draw.DrawRect(bounds.x + 5, bounds.y + 5, bounds.width - 10, bounds.height - 10);
        draw.Style = draw.TYPES.FILLED;
    }

    DrawFloatTexts(floatTexts = []) {
        const draw = this.level.draw;
        const ctx = this.level.screen.Context;

        for (const text of floatTexts) {
            const p = this.grid.TileToPixel(text.col, text.row);
            const elapsed = text.duration - text.timer;
            const y = p.y - 30 - elapsed * 28;
            const alpha = Math.min(1, text.timer / text.duration);

            ctx.globalAlpha = alpha;
            draw.Color = text.color;
            draw.FontSize = "20px";
            draw.Font = "monospace";
            draw.SetTextAlign("center");
            draw.DrawText(`-${text.value}`, p.x, y);
            ctx.globalAlpha = 1;
        }
    }

    DrawActionMenu(options, selectedIndex) {
        const draw = this.level.draw;
        const mx = 462;
        const my = 76;
        const mw = 150;
        const mh = options.length * 30 + 18;

        draw.Style = draw.TYPES.FILLED;
        draw.Color = "rgba(0,0,0,0.86)";
        draw.DrawRect(mx, my, mw, mh);

        draw.Style = draw.TYPES.STROKED;
        draw.Color = "#D8D8D8";
        draw.DrawRect(mx, my, mw, mh);

        draw.Style = draw.TYPES.FILLED;
        draw.SetTextAlign("left");
        draw.Font = "monospace";

        for (let i = 0; i < options.length; i += 1) {
            const selected = i === selectedIndex;
            draw.Color = selected ? "#FFD84A" : "#E8E8E8";
            draw.FontSize = "14px";
            draw.DrawText(`${selected ? "> " : "  "}${options[i].label}`, mx + 12, my + 28 + i * 30);
        }
    }

    DrawHud({ message, battleModeLabel, fps, showActionHelp = true }) {
        const draw = this.level.draw;
        const world = this.grid.world;
        const barY = world.originY + world.rows * world.cell + 4;

        draw.Style = draw.TYPES.FILLED;
        draw.Color = "rgba(0,0,0,0.85)";
        draw.DrawRect(0, barY, 640, 480 - barY);

        draw.Color = "#FFFFFF";
        draw.FontSize = "14px";
        draw.Font = "monospace";
        draw.SetTextAlign("left");
        draw.DrawText(message, 10, barY + 22);

        if (showActionHelp) {
            draw.Color = "#888888";
            draw.FontSize = "11px";
            draw.DrawText(`Modo: ${battleModeLabel} | Setas: cursor | Z/A: confirmar | X/B: cancelar`, 10, barY + 42);
        }

        draw.Color = "#AAAAAA";
        draw.SetTextAlign("right");
        draw.DrawText(`FPS: ${fps}`, 630, barY + 22);
    }

    Image(name) {
        return name ? this.assets?.images?.[name] ?? null : null;
    }
}
