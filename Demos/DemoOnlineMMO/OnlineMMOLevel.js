import { Config } from "../../CoreCross/Config.js";
import { ActionManager } from "../../CoreCross/Input/ActionManager.js";
import { Mouse } from "../../CoreCross/Input/Mouse.js";
import { Level } from "../../CoreCross/Level/Level.js";
import { NetworkClient } from "../../CoreNetwork/index.js";
import { Draw } from "../../Core2D/Graphics/Draw.js";
import { Screen } from "../../Core2D/Window/Screen.js";

const SCREEN = Object.freeze({ width: 800, height: 480 });
const PLAYER = Object.freeze({
    width: 22,
    height: 42,
    speed: 185,
    gravity: 1080,
    jump: -430,
});
const BLOCK_TYPES = Object.freeze(["dirt", "stone", "wood", "grass"]);
const BLOCK_COLORS = Object.freeze({
    grass: { top: "#4f9d51", base: "#6b4c2f", edge: "#2f6f38" },
    dirt: { top: "#8a6040", base: "#6b422b", edge: "#4b2d1d" },
    stone: { top: "#98a4aa", base: "#68747b", edge: "#4c565c" },
    wood: { top: "#b9824a", base: "#81522d", edge: "#5a351e" },
});
const PLAYER_COLORS = ["#5ec8ff", "#ffcf5e", "#9cff6d", "#ff7eab", "#c792ff", "#ff8a4c"];

export class OnlineMMOLevel extends Level {
    constructor() {
        super();
        this.caption = "GameForgeJS - Online MMO Demo";
        this.TelaId = "OnlineMMODemo";
        this.blocks = new Map();
        this.remotePlayers = new Map();
        this.world = { width: 90, height: 18, tileSize: 32 };
        this.cameraX = 0;
        this.cameraY = 0;
        this.sendTimer = 0;
        this.connectionStatus = "offline";
        this.selectedBlockIndex = 0;
    }

    OnStart() {
        this.screen = new Screen(this.TelaId, SCREEN.width, SCREEN.height);
        this.draw = new Draw(this.screen);
        this.mouse = Mouse.instance ?? new Mouse();
        this.localPlayer = this.CreateLocalPlayer();
        this.preventContextMenu = event => event.preventDefault();
        this.screen.Canvas.addEventListener("contextmenu", this.preventContextMenu);
        this.Connect();
        super.OnStart();
    }

    CreateLocalPlayer() {
        const colorIndex = Math.floor(Math.random() * PLAYER_COLORS.length);
        return {
            id: null,
            name: `Player ${Math.floor(Math.random() * 900 + 100)}`,
            x: 120 + Math.random() * 160,
            y: 240,
            vx: 0,
            vy: 0,
            width: PLAYER.width,
            height: PLAYER.height,
            grounded: false,
            facingRight: true,
            color: PLAYER_COLORS[colorIndex],
        };
    }

    Connect() {
        const params = new URLSearchParams(window.location.search);
        const room = params.get("room") || "meadow";
        const configuredUrl = Config.data?.network?.serverUrl;
        const url = configuredUrl && configuredUrl !== "auto"
            ? configuredUrl
            : `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/gameforge-network?room=${encodeURIComponent(room)}`;

        this.room = room;
        this.network = new NetworkClient({
            url,
            autoReconnect: Config.data?.network?.autoReconnect ?? true,
        });

        this.network.on("open", () => {
            this.connectionStatus = "online";
            this.SendPlayerUpdate(true);
        });
        this.network.on("close", () => {
            this.connectionStatus = "offline";
        });
        this.network.on("error", () => {
            this.connectionStatus = "offline";
        });
        this.network.on("room:welcome", message => this.HandleWelcome(message.payload));
        this.network.on("player:update", message => this.HandleRemotePlayer(message.payload));
        this.network.on("player:left", message => this.remotePlayers.delete(message.payload.id));
        this.network.on("world:block:set", message => this.ApplyBlock(message.payload));
        this.network.Connect();
    }

    HandleWelcome(payload) {
        this.localPlayer.id = payload.playerId;
        this.world = {
            width: payload.world?.width ?? this.world.width,
            height: payload.world?.height ?? this.world.height,
            tileSize: payload.world?.tileSize ?? this.world.tileSize,
        };
        this.blocks.clear();
        payload.world?.blocks?.forEach(block => this.ApplyBlock(block));
        payload.players?.forEach(player => this.HandleRemotePlayer(player));
        this.SendPlayerUpdate(true);
    }

    HandleRemotePlayer(player) {
        if (!player?.id || player.id === this.localPlayer.id) return;
        this.remotePlayers.set(player.id, {
            ...this.remotePlayers.get(player.id),
            ...player,
        });
    }

    OnUpdate(dt) {
        const delta = Math.min(dt || 1 / 60, 1 / 30);
        this.UpdateInput(delta);
        this.StepPlayer(this.localPlayer, delta);
        this.UpdateCamera();
        this.UpdateNetwork(delta);
    }

    UpdateInput(delta) {
        const player = this.localPlayer;
        player.vx = 0;

        if (ActionManager.IsAction("LEFT")) {
            player.vx = -PLAYER.speed;
            player.facingRight = false;
        }

        if (ActionManager.IsAction("RIGHT")) {
            player.vx = PLAYER.speed;
            player.facingRight = true;
        }

        if (ActionManager.IsActionDown("JUMP") && player.grounded) {
            player.vy = PLAYER.jump;
            player.grounded = false;
        }

        if (ActionManager.IsActionDown("NEXT_BLOCK")) {
            this.selectedBlockIndex = (this.selectedBlockIndex + 1) % BLOCK_TYPES.length;
        }

        this.HandleWorldEditing(delta);
    }

    HandleWorldEditing() {
        const tile = this.GetCursorTile();
        if (!tile) return;

        const mouseDown = this.mouse.buttonsDown ?? {};
        const wantsMine = ActionManager.IsActionDown("MINE") || mouseDown[0];
        const wantsPlace = ActionManager.IsActionDown("PLACE") || mouseDown[2];

        if (wantsMine) {
            this.SetBlock(tile.x, tile.y, "air", true);
            return;
        }

        if (wantsPlace && !this.IntersectsPlayer(tile.x, tile.y, this.localPlayer)) {
            this.SetBlock(tile.x, tile.y, BLOCK_TYPES[this.selectedBlockIndex], true);
        }
    }

    StepPlayer(player, delta) {
        player.vy += PLAYER.gravity * delta;
        player.x += player.vx * delta;
        this.ResolveHorizontal(player);

        player.y += player.vy * delta;
        player.grounded = false;
        this.ResolveVertical(player);

        const maxX = (this.world.width * this.world.tileSize) - player.width;
        player.x = Math.max(0, Math.min(maxX, player.x));
        if (player.y > this.screen.Height + 300) {
            player.x = 120;
            player.y = 120;
            player.vy = 0;
        }
    }

    ResolveHorizontal(player) {
        const solids = this.GetOverlappingBlocks(player);
        solids.forEach(block => {
            const rect = this.BlockRect(block);
            if (!this.IntersectsRect(player, rect)) return;

            if (player.vx > 0) player.x = rect.x - player.width;
            else if (player.vx < 0) player.x = rect.x + rect.width;
        });
    }

    ResolveVertical(player) {
        const solids = this.GetOverlappingBlocks(player);
        solids.forEach(block => {
            const rect = this.BlockRect(block);
            if (!this.IntersectsRect(player, rect)) return;

            if (player.vy > 0) {
                player.y = rect.y - player.height;
                player.vy = 0;
                player.grounded = true;
            } else if (player.vy < 0) {
                player.y = rect.y + rect.height;
                player.vy = 0;
            }
        });
    }

    GetOverlappingBlocks(rect) {
        const tile = this.world.tileSize;
        const minX = Math.floor(rect.x / tile) - 1;
        const maxX = Math.floor((rect.x + rect.width) / tile) + 1;
        const minY = Math.floor(rect.y / tile) - 1;
        const maxY = Math.floor((rect.y + rect.height) / tile) + 1;
        const blocks = [];

        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                const block = this.blocks.get(this.BlockKey(x, y));
                if (block && block.type !== "air") blocks.push(block);
            }
        }

        return blocks;
    }

    UpdateCamera() {
        const worldWidth = this.world.width * this.world.tileSize;
        const targetX = this.localPlayer.x - this.screen.Width * 0.42;
        this.cameraX += (targetX - this.cameraX) * 0.16;
        this.cameraX = Math.max(0, Math.min(worldWidth - this.screen.Width, this.cameraX));
    }

    UpdateNetwork(delta) {
        this.sendTimer -= delta;
        if (this.sendTimer > 0) return;

        const syncRate = Config.data?.network?.syncRate ?? 15;
        this.sendTimer = 1 / Math.max(1, syncRate);
        this.SendPlayerUpdate();
    }

    SendPlayerUpdate(force = false) {
        if (!this.network?.IsConnected) return;

        this.network.Send("player:update", {
            name: this.localPlayer.name,
            x: Math.round(this.localPlayer.x * 100) / 100,
            y: Math.round(this.localPlayer.y * 100) / 100,
            vx: Math.round(this.localPlayer.vx * 100) / 100,
            vy: Math.round(this.localPlayer.vy * 100) / 100,
            width: this.localPlayer.width,
            height: this.localPlayer.height,
            grounded: this.localPlayer.grounded,
            facingRight: this.localPlayer.facingRight,
            color: this.localPlayer.color,
            selectedBlock: BLOCK_TYPES[this.selectedBlockIndex],
            force,
        });
    }

    SetBlock(x, y, type, sync = false) {
        const block = { x, y, type };
        this.ApplyBlock(block);
        if (sync && this.network?.IsConnected) {
            this.network.Send("world:block:set", block);
        }
    }

    ApplyBlock(block) {
        if (!Number.isFinite(block?.x) || !Number.isFinite(block?.y)) return;

        const key = this.BlockKey(block.x, block.y);
        if (block.type === "air") {
            this.blocks.delete(key);
            return;
        }

        this.blocks.set(key, {
            x: block.x,
            y: block.y,
            type: BLOCK_TYPES.includes(block.type) ? block.type : "dirt",
        });
    }

    GetCursorTile() {
        if (!this.screen?.Canvas) return null;
        const position = this.mouse.getPositionRelative(this.screen.Canvas);
        const x = Math.floor((position.x + this.cameraX) / this.world.tileSize);
        const y = Math.floor((position.y + this.cameraY) / this.world.tileSize);

        if (x < 0 || y < 0 || x >= this.world.width || y >= this.world.height) return null;
        return { x, y };
    }

    OnDrawn() {
        const ctx = this.screen.Context;
        this.DrawSky(ctx);
        this.DrawBlocks(ctx);
        this.DrawPlayers(ctx);
        this.DrawCursor(ctx);
        this.DrawHud(ctx);
    }

    DrawSky(ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 0, this.screen.Height);
        gradient.addColorStop(0, "#102846");
        gradient.addColorStop(0.58, "#2d6e8d");
        gradient.addColorStop(1, "#13222c");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.screen.Width, this.screen.Height);

        ctx.fillStyle = "rgba(255, 240, 170, 0.9)";
        ctx.beginPath();
        ctx.arc(690, 74, 34, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#1a4c5d";
        for (let i = -1; i < 8; i++) {
            const x = i * 180 - (this.cameraX * 0.18 % 180);
            ctx.beginPath();
            ctx.moveTo(x, 300);
            ctx.lineTo(x + 92, 172);
            ctx.lineTo(x + 190, 300);
            ctx.closePath();
            ctx.fill();
        }
    }

    DrawBlocks(ctx) {
        const tile = this.world.tileSize;
        const startX = Math.max(0, Math.floor(this.cameraX / tile) - 1);
        const endX = Math.min(this.world.width, Math.ceil((this.cameraX + this.screen.Width) / tile) + 1);

        for (let y = 0; y < this.world.height; y++) {
            for (let x = startX; x < endX; x++) {
                const block = this.blocks.get(this.BlockKey(x, y));
                if (!block) continue;
                this.DrawBlock(ctx, block);
            }
        }
    }

    DrawBlock(ctx, block) {
        const tile = this.world.tileSize;
        const x = block.x * tile - this.cameraX;
        const y = block.y * tile - this.cameraY;
        const colors = BLOCK_COLORS[block.type] ?? BLOCK_COLORS.dirt;

        ctx.fillStyle = colors.base;
        ctx.fillRect(x, y, tile, tile);
        ctx.fillStyle = colors.top;
        ctx.fillRect(x, y, tile, 8);
        ctx.strokeStyle = colors.edge;
        ctx.strokeRect(x + 0.5, y + 0.5, tile - 1, tile - 1);
    }

    DrawPlayers(ctx) {
        [...this.remotePlayers.values()].forEach(player => this.DrawPlayer(ctx, player, false));
        this.DrawPlayer(ctx, this.localPlayer, true);
    }

    DrawPlayer(ctx, player, isLocal) {
        const x = player.x - this.cameraX;
        const y = player.y - this.cameraY;
        const width = player.width ?? PLAYER.width;
        const height = player.height ?? PLAYER.height;

        ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
        ctx.beginPath();
        ctx.ellipse(x + width / 2, y + height + 3, width * 0.58, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = player.color ?? "#5ec8ff";
        ctx.fillRect(x, y + 10, width, height - 10);
        ctx.fillStyle = isLocal ? "#fff7b7" : "#dce8ff";
        ctx.fillRect(x + 3, y, width - 6, 15);
        ctx.fillStyle = "#111827";
        ctx.fillRect(player.facingRight ? x + width - 7 : x + 4, y + 6, 3, 3);

        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.fillStyle = isLocal ? "#fff7b7" : "#dce8ff";
        ctx.fillText(player.name ?? "Player", x + width / 2, y - 8);
    }

    DrawCursor(ctx) {
        const tile = this.GetCursorTile();
        if (!tile) return;

        const size = this.world.tileSize;
        ctx.strokeStyle = "#fff7b7";
        ctx.lineWidth = 2;
        ctx.strokeRect(tile.x * size - this.cameraX + 1, tile.y * size - this.cameraY + 1, size - 2, size - 2);
        ctx.lineWidth = 1;
    }

    DrawHud(ctx) {
        const playerCount = this.remotePlayers.size + 1;
        const selectedBlock = BLOCK_TYPES[this.selectedBlockIndex];
        ctx.fillStyle = "rgba(6, 12, 22, 0.72)";
        ctx.fillRect(12, 12, 256, 58);
        ctx.fillStyle = this.connectionStatus === "online" ? "#9cff6d" : "#ff7e7e";
        ctx.font = "14px Arial";
        ctx.textAlign = "left";
        ctx.fillText(`Sala ${this.room} | ${this.connectionStatus}`, 24, 34);
        ctx.fillStyle = "#dce8ff";
        ctx.fillText(`Players ${playerCount} | Bloco ${selectedBlock}`, 24, 56);
    }

    BlockRect(block) {
        const tile = this.world.tileSize;
        return {
            x: block.x * tile,
            y: block.y * tile,
            width: tile,
            height: tile,
        };
    }

    IntersectsPlayer(tileX, tileY, player) {
        return this.IntersectsRect(player, this.BlockRect({ x: tileX, y: tileY }));
    }

    IntersectsRect(a, b) {
        return a.x < b.x + b.width
            && a.x + a.width > b.x
            && a.y < b.y + b.height
            && a.y + a.height > b.y;
    }

    BlockKey(x, y) {
        return `${x},${y}`;
    }

    OnExit() {
        this.network?.Disconnect();
        if (this.screen?.Canvas && this.preventContextMenu) {
            this.screen.Canvas.removeEventListener("contextmenu", this.preventContextMenu);
        }
        super.OnExit();
    }
}
