import { GameObject } from "../../../src/Core2D/Objects/GameObject.js";
import {
    BoundsComponent,
    HealthComponent,
    TransformComponent,
} from "../../../src/CoreCross/Component.js";
import { TacticalUnitRendererComponent } from "./TacticalUnitRendererComponent.js";

export class TacticalUnit extends GameObject {
    constructor({ col, row, grid, assets, config = {}, defaults = {} } = {}) {
        super();
        const stats = { ...(defaults.stats ?? {}), ...(config.stats ?? {}) };
        const bodySize = config.bodySize ?? defaults.bodySize ?? { width: 48, height: 56 };
        const pixel = grid.TileToPixel(col, row);

        this.id = config.id ?? defaults.id ?? this.id;
        this.name = config.name ?? defaults.name ?? this.id ?? "Unit";
        this.Tag = "TacticalUnit";
        this.grid = grid;
        this.col = col;
        this.row = row;
        this.startCol = col;
        this.startRow = row;
        this.attack = stats.attack ?? defaults.attack ?? config.attack ?? 8;
        this.defense = stats.defense ?? defaults.defense ?? config.defense ?? 2;
        this.moveRange = stats.moveRange ?? defaults.moveRange ?? config.moveRange ?? 3;
        this.attackRange = stats.attackRange ?? defaults.attackRange ?? config.attackRange ?? 1;
        this.team = config.team ?? defaults.team ?? "neutral";
        this.color = config.color ?? defaults.color ?? "#ffffff";
        this.asset = config.asset ?? defaults.asset ?? null;
        this.runAsset = config.runAsset ?? defaults.runAsset ?? this.asset;
        this.frame = config.frame ?? defaults.frame ?? null;
        this.runFrame = config.runFrame ?? defaults.runFrame ?? this.frame;
        this.scale = config.scale ?? defaults.scale ?? 1;
        this.isMoving = false;

        this.AddComponent(new TransformComponent({ x: pixel.x, y: pixel.y }));
        this.AddComponent(new BoundsComponent({
            width: bodySize.width,
            height: bodySize.height,
            offsetX: -bodySize.width / 2,
            offsetY: -bodySize.height / 2,
        }));
        this.health = this.AddComponent(new HealthComponent({
            hp: stats.hp ?? defaults.hp ?? config.hp ?? 20,
            maxHp: stats.maxHp ?? stats.hp ?? defaults.maxHp ?? defaults.hp ?? config.maxHp ?? config.hp ?? 20,
        }));
        this.renderer = this.AddComponent(new TacticalUnitRendererComponent({
            assets,
            color: this.color,
            scale: this.scale,
            animations: {
                idle: {
                    asset: this.asset,
                    frame: this.frame,
                    fps: config.idleFps ?? defaults.idleFps ?? 5,
                    scale: this.scale,
                },
                run: {
                    asset: this.runAsset,
                    frame: this.runFrame,
                    fps: config.runFps ?? defaults.runFps ?? 8,
                    scale: this.scale,
                },
            },
        }));
    }

    get hp() {
        return this.health.hp;
    }

    set hp(value) {
        this.health.hp = Math.max(0, value);
        this.health.alive = this.health.hp > 0;
    }

    get maxHp() {
        return this.health.maxHp;
    }

    get pixelX() {
        return this.GetComponent(TransformComponent).x;
    }

    set pixelX(value) {
        const transform = this.GetComponent(TransformComponent);
        transform.SetPosition(value, transform.y);
    }

    get pixelY() {
        return this.GetComponent(TransformComponent).y;
    }

    set pixelY(value) {
        const transform = this.GetComponent(TransformComponent);
        transform.SetPosition(transform.x, value);
    }

    SetRuntimeContext({ level, grid, assets }) {
        this.level = level;
        this.grid = grid;
        this.renderer?.SetRuntimeAssets(assets);
        return this;
    }

    SetMoving(moving) {
        this.isMoving = moving;
        this.renderer?.Play(moving ? "run" : "idle");
    }

    TakeDamage(attacker) {
        const roll = Math.floor(Math.random() * 4);
        const dmg = Math.max(1, (attacker?.attack ?? 0) - this.defense + roll);
        this.health.Damage(dmg, attacker);
        return dmg;
    }

    IsAlive() {
        return this.health.IsAlive();
    }

    IsAt(col, row) {
        return this.col === col && this.row === row;
    }

    DistanceTo(other) {
        return Math.abs(this.col - other.col) + Math.abs(this.row - other.row);
    }

    MoveTo(col, row) {
        this.col = col;
        this.row = row;
        const pixel = this.grid.TileToPixel(col, row);
        this.pixelX = pixel.x;
        this.pixelY = pixel.y;
    }

    MoveGridOnly(col, row) {
        this.col = col;
        this.row = row;
    }

    Reset() {
        this.health.Reset(this.maxHp);
        this.MoveTo(this.startCol, this.startRow);
        this.SetMoving(false);
        this.active = true;
    }
}
