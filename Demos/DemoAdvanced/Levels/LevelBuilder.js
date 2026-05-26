import { AssetManager } from "../../../CoreCross/Assets/AssetManager.js";
import { Block } from "../Block.js";
import { Enemy } from "../Enemy.js";
import { StageObject } from "../Environment/StageObject.js";

export class LevelBuilder {
    constructor(level) {
        this.level = level;

        if (!this.level.blocks) this.level.blocks = [];
        if (!this.level.enemies) this.level.enemies = [];
    }

    SetBackground(imageName) {
        this.level.bgImage = AssetManager.instance.GetImage(imageName);
        return this;
    }

    AddPlatform(x, y, width, height) {
        const platform = typeof x === "object"
            ? x
            : { x, y, width, height };

        const block = new Block(
            this.level.screen,
            platform.x,
            platform.y,
            platform.width,
            platform.height,
            platform
        );

        block.id = platform.id ?? block.id;
        if (block.solid) {
            this.level.blocks.push(block);
        }
        this.level.AddEntity(block);
        return this;
    }

    AddPlatforms(platforms = []) {
        platforms.forEach(platform => this.AddPlatform(platform));
        return this;
    }

    AddEnemy(x, y, config = {}) {
        const spawn = typeof x === "object"
            ? x
            : { x, y };
        const {
            id: _id,
            x: _x,
            y: _y,
            col: _col,
            row: _row,
            config: nestedConfig,
            overrides,
            ...inlineConfig
        } = spawn;
        const enemyConfig = this.MergeConfig(
            this.MergeConfig(config, inlineConfig),
            nestedConfig ?? overrides ?? {},
        );

        const enemy = new Enemy(this.level.screen, this.level.player, spawn, enemyConfig);
        enemy.id = spawn.id ?? enemy.id;
        this.level.enemies.push(enemy);
        this.level.AddEntity(enemy);
        return this;
    }

    AddEnemies(enemies = [], config = {}) {
        enemies.forEach(enemy => this.AddEnemy(enemy, undefined, config));
        return this;
    }

    AddObject(config = {}) {
        const object = new StageObject(this.level.screen, config);

        if (object.solid) {
            this.level.blocks.push(object);
        }

        this.level.AddEntity(object);
        return this;
    }

    AddObjects(objects = []) {
        objects.forEach(object => this.AddObject(object));
        return this;
    }

    Build() {
        return this.level;
    }

    MergeConfig(base = {}, override = {}) {
        const result = { ...base };

        Object.entries(override).forEach(([key, value]) => {
            const baseValue = result[key];
            if (this.IsPlainObject(baseValue) && this.IsPlainObject(value)) {
                result[key] = this.MergeConfig(baseValue, value);
                return;
            }

            result[key] = value;
        });

        return result;
    }

    IsPlainObject(value) {
        return Boolean(value) && typeof value === "object" && !Array.isArray(value);
    }
}
