import { Draw } from "../../src/Core2D/Graphics/Draw.js";
import { Screen } from "../../src/Core2D/Window/Screen.js";
import { GameObject } from "../../src/Core2D/Objects/GameObject.js";
import {
    BoundsComponent,
    HealthComponent,
    TransformComponent,
} from "../../src/CoreCross/Component.js";
import { Level } from "../../src/CoreCross/Level/Level.js";
import {
    ADVENTURE_SCREEN,
    AabbIntersects,
    Clamp,
    DIRECTIONS,
    ROOM_HEIGHT,
    ROOM_WIDTH,
    RoomOrigin,
    TILE,
} from "./AdventureConstants.js";
import { BuildRoomWalls, GetRoomById, ROOMS } from "./AdventureRooms.js";
import { RoomCameraComponent } from "./Components/RoomCameraComponent.js";
import { AdventurePlayer } from "./Entities/AdventurePlayer.js";
import { Slime } from "./Entities/Slime.js";

export class AdventureDemoLevel extends Level {
    constructor() {
        super();
        this.caption = "GameForgeJS - Adventure Component Demo";
        this.TelaId = "Adventure2D";
        this.currentRoom = GetRoomById("meadow");
        this.pendingRoom = null;
        this.roomSolids = new Map();
        this.hitSparks = [];
    }

    OnStart() {
        this.screen = new Screen("Adventure2D", ADVENTURE_SCREEN.width, ADVENTURE_SCREEN.height);
        this.draw = new Draw(this.screen);
        this.rooms = ROOMS;
        this.rooms.forEach(room => {
            this.roomSolids.set(room.id, [
                ...BuildRoomWalls(room),
                ...(room.solids ?? []),
            ]);
        });

        const start = RoomOrigin(this.currentRoom);
        this.player = new AdventurePlayer({ x: start.x + 84, y: start.y + 224 });
        this.cameraRig = new GameObject();
        this.cameraRig.name = "CameraRig";
        this.cameraRig.AddComponent(new RoomCameraComponent({
            roomWidth: ROOM_WIDTH,
            roomHeight: ROOM_HEIGHT,
            duration: 0.72,
        }));
        this.camera.SetRoom(this.currentRoom);

        this.enemies = this._spawnEnemies();
        this.entities = [
            this.player,
            ...this.enemies,
            this.cameraRig,
        ];
        this.entities.forEach(entity => {
            entity.level = this;
        });

        super.OnStart();
    }

    get camera() {
        return this.cameraRig.GetComponent(RoomCameraComponent);
    }

    OnExit() {
        if (this.screen?.Canvas) this.screen.Canvas.remove();
    }

    _spawnEnemies() {
        return this.rooms.flatMap(room => {
            const origin = RoomOrigin(room);
            return (room.enemies ?? []).map(enemy => new Slime({
                roomId: room.id,
                x: origin.x + enemy.x,
                y: origin.y + enemy.y,
            }));
        });
    }

    OnUpdate(dt) {
        super.OnUpdate(dt);
        this._updateHitSparks(dt);
        this._handleRoomExit();
    }

    IsInputLocked() {
        return this.camera.IsTransitioning();
    }

    CanMove(owner, nextX, nextY, bounds) {
        const room = owner === this.player
            ? this.currentRoom
            : GetRoomById(owner.roomId);
        if (!room) return false;

        const box = {
            x: nextX + bounds.offsetX,
            y: nextY + bounds.offsetY,
            width: bounds.width,
            height: bounds.height,
        };
        const origin = RoomOrigin(room);
        const localCenter = {
            x: box.x + box.width / 2 - origin.x,
            y: box.y + box.height / 2 - origin.y,
        };

        const leaving = this._leavingDirection(box, origin);
        if (leaving) {
            return owner === this.player && this._canUseExit(room, leaving, localCenter);
        }

        for (const solid of this._worldSolids(room)) {
            if (AabbIntersects(box, solid)) return false;
        }

        return true;
    }

    ResolveMeleeAttack(attacker, attackBox, attackComponent) {
        for (const enemy of this.enemies) {
            if (enemy.active === false || attackComponent.HasHit(enemy)) continue;

            const bounds = enemy.GetComponent(BoundsComponent);
            const health = enemy.GetComponent(HealthComponent);
            if (!bounds || !health || !AabbIntersects(attackBox, bounds.GetAABB())) continue;

            const applied = health.Damage(attackComponent.damage, attacker);
            if (applied <= 0) continue;

            attackComponent.MarkHit(enemy);
            this._addHitSpark(bounds.GetAABB(), applied);
        }
    }

    _addHitSpark(box, value) {
        this.hitSparks.push({
            x: box.x + box.width / 2,
            y: box.y,
            value,
            timer: 0.65,
            duration: 0.65,
        });
    }

    _updateHitSparks(dt) {
        this.hitSparks.forEach(spark => {
            spark.timer -= dt;
            spark.y -= 18 * dt;
        });
        this.hitSparks = this.hitSparks.filter(spark => spark.timer > 0);
    }

    _handleRoomExit() {
        if (this.camera.IsTransitioning()) return;

        const bounds = this.player.GetComponent(BoundsComponent);
        const body = bounds.GetAABB();
        const origin = RoomOrigin(this.currentRoom);
        const center = {
            x: body.x + body.width / 2,
            y: body.y + body.height / 2,
        };

        let direction = null;
        if (center.x < origin.x) direction = DIRECTIONS.LEFT;
        else if (center.x > origin.x + ROOM_WIDTH) direction = DIRECTIONS.RIGHT;
        else if (center.y < origin.y) direction = DIRECTIONS.UP;
        else if (center.y > origin.y + ROOM_HEIGHT) direction = DIRECTIONS.DOWN;

        if (!direction) return;
        this._startRoomTransition(direction, body, center);
    }

    _startRoomTransition(direction, body, center) {
        const exit = this.currentRoom.exits?.[direction];
        const targetRoom = GetRoomById(exit?.to);
        if (!targetRoom) return;

        const origin = RoomOrigin(this.currentRoom);
        const local = {
            x: center.x - origin.x,
            y: center.y - origin.y,
        };

        this.pendingRoom = targetRoom;
        this._placePlayerAtEntry(targetRoom, direction, local, body);
        this.camera.StartTransition(targetRoom, room => {
            this.currentRoom = room;
            this.pendingRoom = null;
        });
    }

    _placePlayerAtEntry(targetRoom, direction, local, body) {
        const transform = this.player.GetComponent(TransformComponent);
        const bounds = this.player.GetComponent(BoundsComponent);
        const origin = RoomOrigin(targetRoom);
        const margin = TILE + 2;
        const minX = origin.x + TILE + 10;
        const maxX = origin.x + ROOM_WIDTH - TILE - body.width - 10;
        const minY = origin.y + TILE + 10;
        const maxY = origin.y + ROOM_HEIGHT - TILE - body.height - 10;

        if (direction === DIRECTIONS.RIGHT) {
            transform.SetPosition(origin.x + margin - bounds.offsetX, Clamp(origin.y + local.y - body.height / 2, minY, maxY) - bounds.offsetY);
        } else if (direction === DIRECTIONS.LEFT) {
            transform.SetPosition(origin.x + ROOM_WIDTH - margin - body.width - bounds.offsetX, Clamp(origin.y + local.y - body.height / 2, minY, maxY) - bounds.offsetY);
        } else if (direction === DIRECTIONS.DOWN) {
            transform.SetPosition(Clamp(origin.x + local.x - body.width / 2, minX, maxX) - bounds.offsetX, origin.y + margin - bounds.offsetY);
        } else if (direction === DIRECTIONS.UP) {
            transform.SetPosition(Clamp(origin.x + local.x - body.width / 2, minX, maxX) - bounds.offsetX, origin.y + ROOM_HEIGHT - margin - body.height - bounds.offsetY);
        }
    }

    _leavingDirection(box, origin) {
        if (box.x < origin.x) return DIRECTIONS.LEFT;
        if (box.x + box.width > origin.x + ROOM_WIDTH) return DIRECTIONS.RIGHT;
        if (box.y < origin.y) return DIRECTIONS.UP;
        if (box.y + box.height > origin.y + ROOM_HEIGHT) return DIRECTIONS.DOWN;
        return null;
    }

    _canUseExit(room, direction, localCenter) {
        const exit = room.exits?.[direction];
        if (!exit || !GetRoomById(exit.to)) return false;

        const value = direction === DIRECTIONS.LEFT || direction === DIRECTIONS.RIGHT
            ? localCenter.y
            : localCenter.x;
        return value >= exit.min && value <= exit.max;
    }

    _worldSolids(room) {
        const origin = RoomOrigin(room);
        return (this.roomSolids.get(room.id) ?? []).map(solid => ({
            ...solid,
            x: origin.x + solid.x,
            y: origin.y + solid.y,
        }));
    }

    OnDrawn() {
        this.screen.Refresh();
        this.camera.Begin(this.screen);
        this.rooms.forEach(room => this._drawRoom(room));
        this._drawEntities();
        this._drawHitSparks();
        this.camera.End(this.screen);
    }

    _drawEntities() {
        this.entities
            .filter(entity => entity !== this.cameraRig && entity.active !== false)
            .sort((a, b) => entitySortY(a) - entitySortY(b))
            .forEach(entity => entity.OnDrawn());
    }

    _drawRoom(room) {
        const origin = RoomOrigin(room);
        const ctx = this.screen.Context;

        for (let row = 0; row < ROOM_HEIGHT / TILE; row++) {
            for (let col = 0; col < ROOM_WIDTH / TILE; col++) {
                this.draw.Color = (row + col) % 2 === 0 ? room.floor : room.floorAlt;
                this.draw.DrawRect(origin.x + col * TILE, origin.y + row * TILE, TILE, TILE);
            }
        }

        this._drawRoomDetails(room, origin, ctx);
        this._drawDecorations(room, origin);
        this._drawSolids(room, origin);
        this._drawDoorLight(room, origin);
    }

    _drawRoomDetails(room, origin, ctx) {
        ctx.save();
        ctx.globalAlpha = 0.18;
        this.draw.Color = "#d7f0c0";
        for (let i = 0; i < 26; i++) {
            const x = origin.x + 44 + (i * 83) % (ROOM_WIDTH - 88);
            const y = origin.y + 54 + (i * 47) % (ROOM_HEIGHT - 108);
            this.draw.DrawRect(x, y, 10, 3);
        }
        ctx.restore();
    }

    _drawSolids(room, origin) {
        for (const solid of this.roomSolids.get(room.id) ?? []) {
            this.draw.Color = solid.water ? "#305e7f" : room.wall;
            this.draw.DrawRect(origin.x + solid.x, origin.y + solid.y, solid.width, solid.height);

            this.draw.Color = solid.water ? "rgba(149, 213, 255, 0.28)" : "rgba(255,255,255,0.08)";
            this.draw.DrawRect(origin.x + solid.x + 4, origin.y + solid.y + 4, solid.width - 8, 4);
        }
    }

    _drawDecorations(room, origin) {
        for (const item of room.decorations ?? []) {
            if (item.type === "bush") this._drawBush(origin.x + item.x, origin.y + item.y);
            if (item.type === "pillar") this._drawPillar(origin.x + item.x, origin.y + item.y);
            if (item.type === "altar") this._drawAltar(origin.x + item.x, origin.y + item.y);
            if (item.type === "bridge") this._drawBridge(origin.x + item.x, origin.y + item.y, item.width, item.height);
            if (item.type === "sign") this._drawSign(origin.x + item.x, origin.y + item.y, item.text);
        }
    }

    _drawDoorLight(room, origin) {
        this.draw.Color = "rgba(255, 232, 136, 0.28)";
        for (const [direction, exit] of Object.entries(room.exits ?? {})) {
            if (direction === DIRECTIONS.LEFT) this.draw.DrawRect(origin.x, origin.y + exit.min, TILE, exit.max - exit.min);
            if (direction === DIRECTIONS.RIGHT) this.draw.DrawRect(origin.x + ROOM_WIDTH - TILE, origin.y + exit.min, TILE, exit.max - exit.min);
            if (direction === DIRECTIONS.UP) this.draw.DrawRect(origin.x + exit.min, origin.y, exit.max - exit.min, TILE);
            if (direction === DIRECTIONS.DOWN) this.draw.DrawRect(origin.x + exit.min, origin.y + ROOM_HEIGHT - TILE, exit.max - exit.min, TILE);
        }
    }

    _drawBush(x, y) {
        this.draw.Color = "#1f5c2d";
        this.draw.DrawRect(x, y + 8, 36, 20);
        this.draw.Color = "#2f8943";
        this.draw.DrawRect(x + 4, y, 28, 18);
    }

    _drawPillar(x, y) {
        this.draw.Color = "#373933";
        this.draw.DrawRect(x, y, 34, 66);
        this.draw.Color = "#707568";
        this.draw.DrawRect(x + 5, y + 6, 24, 52);
    }

    _drawAltar(x, y) {
        this.draw.Color = "#2f302e";
        this.draw.DrawRect(x, y + 18, 68, 38);
        this.draw.Color = "#9fa78c";
        this.draw.DrawRect(x + 8, y + 8, 52, 30);
        this.draw.Color = "#f1dc7a";
        this.draw.DrawRect(x + 30, y, 8, 16);
    }

    _drawBridge(x, y, width, height) {
        this.draw.Color = "#7a5638";
        this.draw.DrawRect(x, y, width, height);
        this.draw.Color = "rgba(255,255,255,0.12)";
        for (let i = 0; i < height; i += 12) {
            this.draw.DrawRect(x, y + i, width, 3);
        }
    }

    _drawSign(x, y, text) {
        this.draw.Color = "#6a4b2e";
        this.draw.DrawRect(x + 18, y + 20, 8, 34);
        this.draw.Color = "#b88851";
        this.draw.DrawRect(x, y, 96, 28);
        this.draw.Color = "#271b12";
        this.draw.Font = "monospace";
        this.draw.FontSize = "8px";
        this.draw.SetTextAlign("left");
        this.draw.DrawText(text, x + 5, y + 17, 86);
    }

    _drawHitSparks() {
        this.hitSparks.forEach(spark => {
            const alpha = spark.timer / spark.duration;
            this.screen.Context.globalAlpha = alpha;
            this.draw.Color = "#ffe66d";
            this.draw.Font = "monospace";
            this.draw.FontSize = "16px";
            this.draw.SetTextAlign("center");
            this.draw.DrawText(`-${spark.value}`, spark.x, spark.y);
            this.screen.Context.globalAlpha = 1;
        });
    }

    OnGUI() {
        const room = this.pendingRoom ?? this.currentRoom;

        this.draw.Style = this.draw.TYPES.FILLED;
        this.draw.Color = "rgba(0,0,0,0.62)";
        this.draw.DrawRect(0, 0, ADVENTURE_SCREEN.width, 34);

        this.draw.Color = "#ffffff";
        this.draw.Font = "monospace";
        this.draw.FontSize = "13px";
        this.draw.SetTextAlign("left");
        this.draw.DrawText(room.name, 12, 22);

        this.draw.SetTextAlign("right");
        this.draw.Color = "#cbd8c2";
        this.draw.FontSize = "11px";
        this.draw.DrawText("Setas/WASD: mover | Z/Enter/X: espada | atravesse portas iluminadas", ADVENTURE_SCREEN.width - 12, 22);
    }
}

function entitySortY(entity) {
    const bounds = entity.GetComponent?.(BoundsComponent);
    if (bounds) {
        const box = bounds.GetAABB();
        return box.y + box.height;
    }

    const transform = entity.GetComponent?.(TransformComponent);
    return transform?.y ?? 0;
}
