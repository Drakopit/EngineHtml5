import { Config } from "../../src/CoreCross/Config.js";
import { ActionManager } from "../../src/CoreCross/Input/ActionManager.js";
import { Mouse } from "../../src/CoreCross/Input/Mouse.js";
import { Level } from "../../src/CoreCross/Level/Level.js";
import {
    ChatManager,
    GameNetwork,
    LocalNetworkAdapter,
    OnlineEntitySync,
    OnlinePlayerManager,
    WebSocketClientAdapter,
} from "../../src/CoreNetwork/index.js";
import { TileCollision2D } from "../../src/Core2D/Collision/TileCollision2D.js";
import { ChatWindow } from "../../src/Core2D/UI/ChatWindow.js";
import { Draw } from "../../src/Core2D/Graphics/Draw.js";
import { Screen } from "../../src/Core2D/Window/Screen.js";
import {
    BLOCK_COLORS,
    BLOCK_TYPES,
    BlockKey,
    CreateOnlineWorldBlocks,
    ONLINE_PLAYER,
    ONLINE_SCREEN,
    ONLINE_WORLD,
    PLAYER_COLORS,
} from "./data/OnlineWorldData.js";

const STORAGE_KEYS = Object.freeze({
    name: "gameforge.online.name",
    color: "gameforge.online.color",
});

export class OnlineMMOLevel extends Level {
    constructor() {
        super();
        this.caption = "GameForgeJS - Online MMO Demo";
        this.TelaId = "OnlineMMODemo";
        this.blocks = CreateOnlineWorldBlocks();
        this.world = ONLINE_WORLD;
        this.cameraX = 0;
        this.cameraY = 0;
        this.connectionStatus = "offline";
        this.selectedBlockIndex = 0;
        this.remotePlayers = [];
        this.receivedWorldSnapshot = false;
    }

    OnStart() {
        this.screen = new Screen(this.TelaId, ONLINE_SCREEN.width, ONLINE_SCREEN.height);
        this.draw = new Draw(this.screen);
        this.mouse = Mouse.instance ?? new Mouse();
        this.localPlayer = this.CreateLocalPlayer();
        this.chatWindow = new ChatWindow(this.screen, {
            x: 12,
            y: 292,
            width: 350,
            height: 176,
            title: "Online Chat",
        });
        this.preventContextMenu = event => event.preventDefault();
        this.screen.Canvas.addEventListener("contextmenu", this.preventContextMenu);
        this.StartOnlineSession();
        super.OnStart();
    }

    CreateLocalPlayer() {
        const colorIndex = this.ResolveColorIndex();
        return {
            name: this.ResolvePlayerName(),
            x: 120 + Math.random() * 160,
            y: 240,
            vx: 0,
            vy: 0,
            width: ONLINE_PLAYER.width,
            height: ONLINE_PLAYER.height,
            grounded: false,
            facingRight: true,
            colorIndex,
            color: PLAYER_COLORS[colorIndex],
        };
    }

    StartOnlineSession() {
        const params = new URLSearchParams(window.location.search);
        const roomId = params.get("room") || "meadow";
        const peer = {
            name: this.localPlayer.name,
            colorIndex: this.localPlayer.colorIndex,
        };
        const adapter = this.CreateNetworkAdapter(roomId, peer, params);

        this.roomId = roomId;
        this.network = new GameNetwork({ adapter, roomId, peer });
        this.onlinePlayers = new OnlinePlayerManager(this.network);
        this.entitySync = new OnlineEntitySync(this.network, {
            syncRate: Config.data?.network?.syncRate ?? 12,
            readState: () => this.ReadLocalPlayerState(),
        });
        this.chat = new ChatManager(this.network);

        this.chatWindow.onMessageSubmitted(text => this.SubmitChatMessage(text));
        this.chat.onMessageReceived(message => this.chatWindow.addMessage(message));
        this.network.onConnected(() => {
            this.connectionStatus = "online";
            this.chat.addSystemMessage(`Connected to ${this.TransportLabel()}.`);
            this.entitySync.send(true);
            this.network.send("worldSnapshotRequest");
        });
        this.network.on("disconnected", () => {
            this.connectionStatus = "offline";
        });
        this.network.onPeerJoined(() => this.entitySync.send(true));
        this.network.on("worldBlockSet", (peerId, block) => this.ApplyBlock(block));
        this.network.on("worldSnapshotRequest", peerId => {
            this.network.send("worldSnapshot", {
                targetId: peerId,
                blocks: [...this.blocks.values()],
            });
        });
        this.network.on("worldSnapshot", (peerId, snapshot) => this.ApplyWorldSnapshot(snapshot));
        this.network.connect();
    }

    CreateNetworkAdapter(roomId, peer, params) {
        const configuredServer = params.get("server") || Config.data?.network?.serverUrl;
        if (configuredServer && configuredServer !== "local" && configuredServer !== "auto") {
            return new WebSocketClientAdapter({
                url: configuredServer,
                roomId,
                peer,
                autoReconnect: Config.data?.network?.autoReconnect ?? true,
            });
        }

        return new LocalNetworkAdapter({ roomId, peer });
    }

    ReadLocalPlayerState() {
        return {
            x: Math.round(this.localPlayer.x * 10) / 10,
            y: Math.round(this.localPlayer.y * 10) / 10,
            vx: Math.round(this.localPlayer.vx),
            vy: Math.round(this.localPlayer.vy),
            grounded: this.localPlayer.grounded,
            facingRight: this.localPlayer.facingRight,
            colorIndex: this.localPlayer.colorIndex,
        };
    }

    OnUpdate(dt) {
        const delta = Math.min(dt || 1 / 60, 1 / 30);
        this.chatWindow.OnUpdate();
        this.UpdateInput(delta);
        this.StepPlayer(this.localPlayer, delta);
        this.onlinePlayers.update(delta);
        this.remotePlayers = this.onlinePlayers.getPlayers();
        this.UpdateCamera();
        this.entitySync.update(delta);
    }

    UpdateInput() {
        const player = this.localPlayer;
        player.vx = 0;
        if (this.chatWindow.IsTyping) return;

        if (ActionManager.IsAction("LEFT")) {
            player.vx = -ONLINE_PLAYER.speed;
            player.facingRight = false;
        }
        if (ActionManager.IsAction("RIGHT")) {
            player.vx = ONLINE_PLAYER.speed;
            player.facingRight = true;
        }
        if (ActionManager.IsActionDown("JUMP") && player.grounded) {
            player.vy = ONLINE_PLAYER.jump;
            player.grounded = false;
        }
        if (ActionManager.IsActionDown("NEXT_BLOCK")) {
            this.selectedBlockIndex = (this.selectedBlockIndex + 1) % BLOCK_TYPES.length;
        }

        this.HandleWorldEditing();
    }

    HandleWorldEditing() {
        if (this.chatWindow.IsPointerOver()) return;
        const tile = this.GetCursorTile();
        if (!tile) return;

        const mouseDown = this.mouse.buttonsDown ?? {};
        const wantsMine = ActionManager.IsActionDown("MINE") || mouseDown[0];
        const wantsPlace = ActionManager.IsActionDown("PLACE") || mouseDown[2];

        if (wantsMine) {
            this.SetBlock(tile.x, tile.y, "air", true);
            return;
        }
        if (wantsPlace && !TileCollision2D.IntersectsTile(this.localPlayer, tile.x, tile.y, this.world.tileSize)) {
            this.SetBlock(tile.x, tile.y, BLOCK_TYPES[this.selectedBlockIndex], true);
        }
    }

    StepPlayer(player, delta) {
        player.vy += ONLINE_PLAYER.gravity * delta;
        TileCollision2D.Move(player, {
            delta,
            tileSize: this.world.tileSize,
            worldWidth: this.world.width,
            worldHeight: this.world.height,
            getTile: (x, y) => this.GetBlock(x, y),
            isSolid: block => Boolean(block) && block.type !== "air",
        });

        if (player.y > (this.world.height * this.world.tileSize) + 300) {
            player.x = 120;
            player.y = 120;
            player.vx = 0;
            player.vy = 0;
        }
    }

    SubmitChatMessage(text) {
        if (text.toLowerCase().startsWith("/name ")) {
            const name = this.NormalizeName(text.slice(6));
            this.localPlayer.name = name;
            this.WriteStorage(STORAGE_KEYS.name, name);
            this.network.setPeerProfile({ name });
            this.chat.addSystemMessage(`You are now ${name}.`);
            return;
        }

        this.chat.sendMessage(text);
    }

    SetBlock(x, y, type, sync = false) {
        const block = { x, y, type };
        if ((this.GetBlock(x, y)?.type ?? "air") === type) return;
        this.ApplyBlock(block);
        if (sync) this.network.send("worldBlockSet", block);
    }

    ApplyBlock(block) {
        if (!Number.isInteger(block?.x) || !Number.isInteger(block?.y)) return;
        if (block.x < 0 || block.y < 0 || block.x >= this.world.width || block.y >= this.world.height) return;

        const key = BlockKey(block.x, block.y);
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

    ApplyWorldSnapshot(snapshot) {
        if (this.receivedWorldSnapshot || snapshot?.targetId !== this.network.peer.id || !Array.isArray(snapshot.blocks)) return;
        this.receivedWorldSnapshot = true;
        this.blocks.clear();
        snapshot.blocks.forEach(block => this.ApplyBlock(block));
    }

    GetBlock(x, y) {
        return this.blocks.get(BlockKey(x, y));
    }

    UpdateCamera() {
        const worldWidth = this.world.width * this.world.tileSize;
        const targetX = this.localPlayer.x - this.screen.Width * 0.42;
        this.cameraX += (targetX - this.cameraX) * 0.16;
        this.cameraX = Math.max(0, Math.min(worldWidth - this.screen.Width, this.cameraX));
    }

    GetCursorTile() {
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
        this.chatWindow.OnDrawn();
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
        const size = this.world.tileSize;
        const startX = Math.max(0, Math.floor(this.cameraX / size) - 1);
        const endX = Math.min(this.world.width, Math.ceil((this.cameraX + this.screen.Width) / size) + 1);
        for (let y = 0; y < this.world.height; y++) {
            for (let x = startX; x < endX; x++) {
                const block = this.GetBlock(x, y);
                if (!block) continue;
                const colors = BLOCK_COLORS[block.type] ?? BLOCK_COLORS.dirt;
                const drawX = block.x * size - this.cameraX;
                const drawY = block.y * size - this.cameraY;
                ctx.fillStyle = colors.base;
                ctx.fillRect(drawX, drawY, size, size);
                ctx.fillStyle = colors.top;
                ctx.fillRect(drawX, drawY, size, 8);
                ctx.strokeStyle = colors.edge;
                ctx.strokeRect(drawX + 0.5, drawY + 0.5, size - 1, size - 1);
            }
        }
    }

    DrawPlayers(ctx) {
        this.remotePlayers.forEach(player => this.DrawPlayer(ctx, player, false));
        this.DrawPlayer(ctx, this.localPlayer, true);
    }

    DrawPlayer(ctx, player, isLocal) {
        const x = player.x - this.cameraX;
        const y = player.y - this.cameraY;
        const width = player.width ?? ONLINE_PLAYER.width;
        const height = player.height ?? ONLINE_PLAYER.height;
        ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
        ctx.beginPath();
        ctx.ellipse(x + width / 2, y + height + 3, width * 0.58, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = player.color ?? PLAYER_COLORS[player.colorIndex] ?? PLAYER_COLORS[0];
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
        if (this.chatWindow.IsPointerOver()) return;
        const tile = this.GetCursorTile();
        if (!tile) return;
        const size = this.world.tileSize;
        ctx.strokeStyle = "#fff7b7";
        ctx.lineWidth = 2;
        ctx.strokeRect(tile.x * size - this.cameraX + 1, tile.y * size - this.cameraY + 1, size - 2, size - 2);
        ctx.lineWidth = 1;
    }

    DrawHud(ctx) {
        ctx.fillStyle = "rgba(6, 12, 22, 0.72)";
        ctx.fillRect(12, 12, 318, 58);
        ctx.fillStyle = this.connectionStatus === "online" ? "#9cff6d" : "#ff7e7e";
        ctx.font = "14px Arial";
        ctx.textAlign = "left";
        ctx.fillText(`${this.localPlayer.name} | Sala ${this.roomId} | ${this.connectionStatus}`, 24, 34);
        ctx.fillStyle = "#dce8ff";
        ctx.fillText(`Players ${this.remotePlayers.length + 1} | Bloco ${BLOCK_TYPES[this.selectedBlockIndex]}`, 24, 56);
    }

    TransportLabel() {
        return this.network.adapter instanceof LocalNetworkAdapter ? "local room" : "external relay";
    }

    ResolvePlayerName() {
        const params = new URLSearchParams(window.location.search);
        const name = params.get("name")
            || this.ReadStorage(STORAGE_KEYS.name)
            || `Player ${Math.floor(Math.random() * 900 + 100)}`;
        const normalized = this.NormalizeName(name);
        this.WriteStorage(STORAGE_KEYS.name, normalized);
        return normalized;
    }

    ResolveColorIndex() {
        const value = new URLSearchParams(window.location.search).get("color") || this.ReadStorage(STORAGE_KEYS.color);
        const parsed = value === "" ? NaN : Number(value);
        const index = Number.isFinite(parsed) ? parsed : Math.floor(Math.random() * PLAYER_COLORS.length);
        const normalized = Math.max(0, Math.min(PLAYER_COLORS.length - 1, Math.trunc(index)));
        this.WriteStorage(STORAGE_KEYS.color, String(normalized));
        return normalized;
    }

    NormalizeName(name) {
        return String(name || "Player").replace(/\s+/g, " ").trim().slice(0, 18) || "Player";
    }

    ReadStorage(key) {
        try {
            return window.localStorage?.getItem(key) ?? "";
        } catch {
            return "";
        }
    }

    WriteStorage(key, value) {
        try {
            window.localStorage?.setItem(key, value);
        } catch {
            // Storage may be unavailable in private previews.
        }
    }

    OnExit() {
        this.chat?.dispose();
        this.chatWindow?.Dispose();
        this.onlinePlayers?.dispose();
        this.network?.disconnect();
        if (this.screen?.Canvas && this.preventContextMenu) {
            this.screen.Canvas.removeEventListener("contextmenu", this.preventContextMenu);
        }
        super.OnExit();
    }
}
