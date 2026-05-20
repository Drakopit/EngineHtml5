import { GameObject } from "../Root/GameObject.js";
import { Vector2D } from "../Math/Vector2D.js";
import { Draw } from "../Graphic/Draw.js";
import { AssetManager } from "../Root/AssetManager.js";
import { JsonManifestComposer } from "../Root/JsonManifestComposer.js";

const DEFAULT_BLOCK = {
    solid: true,
    visible: true,
    material: "ground",
    sprite: null,
    pos_x: 0,
    pos_y: 0,
    tileWidth: 16,
    tileHeight: 16,
    renderMode: "tile",
    fallbackColor: "#555555",
    zIndex: 20,
};

export class Block extends GameObject {
    constructor(screen, x, y, width, height, options = {}) {
        super();
        const catalogConfig = this.ResolveCatalogConfig(options);
        this.config = {
            ...DEFAULT_BLOCK,
            ...catalogConfig,
            ...options,
            source: { ...catalogConfig.source, ...options.source },
            terrainTiles: { ...catalogConfig.terrainTiles, ...options.terrainTiles },
        };
        this.name = "Block";
        this.position = new Vector2D(x, y);
        this.previousPosition = new Vector2D(x, y);
        this.size = new Vector2D(width, height);
        this.solid = this.config.solid;
        this.visible = this.config.visible;
        this.material = this.config.material;
        this.zIndex = this.config.zIndex;
        this.draw = new Draw(screen);
        this.image = this.ResolveImage(this.config.sprite);
    }

    ResolveImage(spriteName) {
        if (!spriteName || !AssetManager.instance.HasImage(spriteName)) return null;
        return AssetManager.instance.GetImage(spriteName);
    }

    ResolveCatalogConfig(options) {
        return this.ResolveTerrainConfig(options) ?? this.ResolveTileConfig(options);
    }

    ResolveTerrainConfig(options) {
        const terrainName = options.terrain ?? options.tileSet;
        if (!terrainName) return null;

        const catalog = JsonManifestComposer.Compose("snow_pack");
        const atlases = Object.values(catalog?.atlases ?? {});

        for (const atlas of atlases) {
            const terrain = atlas.terrainSets?.[terrainName];
            if (!terrain) continue;

            return {
                sprite: terrain.sprite ?? atlas.sprite,
                tileWidth: terrain.tileWidth ?? atlas.tileWidth,
                tileHeight: terrain.tileHeight ?? atlas.tileHeight,
                renderMode: "terrain",
                terrainTiles: this.ResolveTerrainTiles(atlas, terrain),
            };
        }

        return null;
    }

    ResolveTerrainTiles(atlas, terrain) {
        const tileKeys = [
            "topLeft",
            "top",
            "topRight",
            "middleLeft",
            "middle",
            "middleRight",
            "bottomLeft",
            "bottom",
            "bottomRight",
        ];
        const result = {};

        tileKeys.forEach(key => {
            const tileName = terrain.tiles?.[key];
            result[key] = atlas.tiles?.[tileName] ?? atlas.tiles?.[terrain.tiles?.middle];
        });

        return result;
    }

    ResolveTileConfig(options) {
        if (!options.tile) return {};

        const catalog = JsonManifestComposer.Compose("snow_pack");
        const atlases = Object.values(catalog?.atlases ?? {});

        for (const atlas of atlases) {
            const tile = atlas.tiles?.[options.tile];
            if (!tile) continue;

            return {
                sprite: atlas.sprite,
                tileWidth: tile.width ?? atlas.tileWidth,
                tileHeight: tile.height ?? atlas.tileHeight,
                source: {
                    x: tile.x,
                    y: tile.y,
                    width: tile.width ?? atlas.tileWidth,
                    height: tile.height ?? atlas.tileHeight,
                },
            };
        }

        return {};
    }

    OnDrawn() {
        if (!this.visible) return;

        if (!this.image) {
            this.draw.Color = this.config.fallbackColor;
            this.draw.DrawRect(this.position.x, this.position.y, this.size.x, this.size.y);
            return;
        }

        if (this.config.renderMode === "terrain") {
            this.DrawTerrain();
            return;
        }

        if (this.config.renderMode === "stretch") {
            this.draw.DrawSpritePart(this.image, this.GetSource(), {
                x: this.position.x,
                y: this.position.y,
                width: this.size.x,
                height: this.size.y,
            });
            return;
        }

        this.DrawTiled();
    }

    DrawTerrain() {
        const tileWidth = this.config.tileWidth;
        const tileHeight = this.config.tileHeight;
        const columnCount = Math.max(1, Math.ceil(this.size.x / tileWidth));
        const rowCount = Math.max(1, Math.ceil(this.size.y / tileHeight));

        for (let row = 0; row < rowCount; row++) {
            for (let column = 0; column < columnCount; column++) {
                const source = this.GetTerrainSource(column, row, columnCount, rowCount);
                const x = this.position.x + (column * tileWidth);
                const y = this.position.y + (row * tileHeight);
                const width = Math.min(tileWidth, this.position.x + this.size.x - x);
                const height = Math.min(tileHeight, this.position.y + this.size.y - y);

                this.draw.DrawSpritePart(this.image, {
                    x: source.x,
                    y: source.y,
                    width,
                    height,
                }, {
                    x,
                    y,
                    width,
                    height,
                });
            }
        }
    }

    GetTerrainSource(column, row, columnCount, rowCount) {
        const isLeft = column === 0;
        const isRight = column === columnCount - 1;
        const isTop = row === 0;
        const isBottom = row === rowCount - 1;

        if (isTop && isLeft) return this.config.terrainTiles.topLeft;
        if (isTop && isRight) return this.config.terrainTiles.topRight;
        if (isTop) return this.config.terrainTiles.top;
        if (isBottom && isLeft) return this.config.terrainTiles.bottomLeft;
        if (isBottom && isRight) return this.config.terrainTiles.bottomRight;
        if (isBottom) return this.config.terrainTiles.bottom;
        if (isLeft) return this.config.terrainTiles.middleLeft;
        if (isRight) return this.config.terrainTiles.middleRight;
        return this.config.terrainTiles.middle;
    }

    DrawTiled() {
        const source = this.GetSource();
        const endX = this.position.x + this.size.x;
        const endY = this.position.y + this.size.y;

        for (let y = this.position.y; y < endY; y += source.height) {
            for (let x = this.position.x; x < endX; x += source.width) {
                const width = Math.min(source.width, endX - x);
                const height = Math.min(source.height, endY - y);
                this.draw.DrawSpritePart(this.image, {
                    x: source.x,
                    y: source.y,
                    width,
                    height,
                }, {
                    x,
                    y,
                    width,
                    height,
                });
            }
        }
    }

    GetSource() {
        const source = this.config.source ?? {};

        return {
            x: source.x ?? this.config.pos_x,
            y: source.y ?? this.config.pos_y,
            width: source.width ?? this.config.tileWidth,
            height: source.height ?? this.config.tileHeight,
        };
    }
}
