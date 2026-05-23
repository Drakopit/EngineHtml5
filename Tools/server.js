const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const REQUESTED_PORT = Number(process.env.PORT) || 8080;
const MAX_PORT_ATTEMPTS = 20;
const ROOT_DIR = path.join(__dirname, "..");
const DEFAULT_FILE = "Main.html";
const NETWORK_PATH = "/gameforge-network";
const WS_MAGIC = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
const ROOM_WORLD = Object.freeze({
    width: 90,
    height: 18,
    tileSize: 32,
});
const PROTOCOL_VERSION = 1;
const BINARY_MESSAGE = Object.freeze({
    PLAYER_STATE: 1,
    REMOTE_PLAYER_STATE: 2,
});
const PLAYER_FLAGS = Object.freeze({
    GROUNDED: 1 << 0,
    FACING_RIGHT: 1 << 1,
});
const FIXED_POINT = Object.freeze({
    POSITION_SCALE: 4,
    VELOCITY_SCALE: 8,
});
const PLAYER_SIZE = Object.freeze({
    width: 22,
    height: 42,
});
const PLAYER_COLORS = ["#5ec8ff", "#ffcf5e", "#9cff6d", "#ff7eab", "#c792ff", "#ff8a4c"];

const MIME_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".glsl": "text/plain; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".wav": "audio/wav",
    ".mp3": "audio/mpeg",
    ".mpeg": "audio/mpeg",
    ".glb": "model/gltf-binary",
    ".gltf": "model/gltf+json",
};

function ResolveRequestPath(requestUrl) {
    const url = new URL(requestUrl, `http://localhost:${REQUESTED_PORT}`);
    const pathname = decodeURIComponent(url.pathname);
    const requestedPath = pathname === "/" ? `/${DEFAULT_FILE}` : pathname;
    const filePath = path.resolve(ROOT_DIR, `.${requestedPath}`);
    const rootWithSeparator = ROOT_DIR.endsWith(path.sep) ? ROOT_DIR : `${ROOT_DIR}${path.sep}`;

    if (filePath !== ROOT_DIR && !filePath.startsWith(rootWithSeparator)) {
        return null;
    }

    return filePath;
}

function SendText(res, statusCode, message) {
    res.writeHead(statusCode, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(message);
}

function CreateServer() {
    return http.createServer((req, res) => {
        const filePath = ResolveRequestPath(req.url);
        if (!filePath) {
            SendText(res, 403, "Forbidden");
            return;
        }

        fs.readFile(filePath, (error, content) => {
            if (error) {
                SendText(res, error.code === "ENOENT" ? 404 : 500, error.code === "ENOENT" ? "File not found" : `Server error: ${error.code}`);
                return;
            }

            const extname = path.extname(filePath).toLowerCase();
            res.writeHead(200, { "Content-Type": MIME_TYPES[extname] || "application/octet-stream" });
            res.end(content);
        });
    });
}

const networkRooms = new Map();

function AttachNetworkServer(server) {
    server.on("upgrade", (req, socket) => {
        const url = new URL(req.url, `http://localhost:${REQUESTED_PORT}`);
        if (url.pathname !== NETWORK_PATH) {
            socket.destroy();
            return;
        }

        const key = req.headers["sec-websocket-key"];
        if (!key) {
            socket.destroy();
            return;
        }

        const accept = crypto
            .createHash("sha1")
            .update(`${key}${WS_MAGIC}`)
            .digest("base64");

        socket.write([
            "HTTP/1.1 101 Switching Protocols",
            "Upgrade: websocket",
            "Connection: Upgrade",
            `Sec-WebSocket-Accept: ${accept}`,
            "",
            "",
        ].join("\r\n"));

        JoinNetworkRoom(socket, url.searchParams.get("room") || "default");
    });
}

function JoinNetworkRoom(socket, roomId) {
    const room = GetNetworkRoom(roomId);
    const slot = room.nextSlot++;
    const client = {
        id: CreateId("player"),
        slot,
        roomId,
        socket,
        buffer: Buffer.alloc(0),
        profile: CreateDefaultProfile(slot),
        player: null,
    };
    client.profile.id = client.id;

    room.clients.set(client.id, client);
    socket.on("data", chunk => HandleSocketData(client, chunk));
    socket.on("close", () => LeaveNetworkRoom(client));
    socket.on("error", () => LeaveNetworkRoom(client));

    SendEnvelope(client, "room:welcome", {
        playerId: client.id,
        playerSlot: client.slot,
        roomId,
        player: client.profile,
        world: {
            ...ROOM_WORLD,
            blocks: [...room.blocks.values()],
        },
        players: [...room.clients.values()]
            .filter(item => item.id !== client.id)
            .map(item => ({
                ...item.profile,
                ...(item.player ?? {}),
            })),
    });

    Broadcast(room, "player:joined", client.profile, { except: client.id });
}

function LeaveNetworkRoom(client) {
    const room = networkRooms.get(client.roomId);
    if (!room || !room.clients.has(client.id)) return;

    room.clients.delete(client.id);
    Broadcast(room, "player:left", { id: client.id, slot: client.slot });

    if (room.clients.size === 0) {
        networkRooms.delete(client.roomId);
    }
}

function GetNetworkRoom(roomId) {
    if (!networkRooms.has(roomId)) {
        networkRooms.set(roomId, {
            id: roomId,
            nextSlot: 1,
            clients: new Map(),
            blocks: CreateInitialBlocks(),
        });
    }

    return networkRooms.get(roomId);
}

function CreateInitialBlocks() {
    const blocks = new Map();

    for (let x = 0; x < ROOM_WORLD.width; x++) {
        SetBlock(blocks, { x, y: 13, type: "grass" });
        for (let y = 14; y < ROOM_WORLD.height; y++) {
            SetBlock(blocks, { x, y, type: y < 16 ? "dirt" : "stone" });
        }
    }

    for (let x = 8; x < 14; x++) SetBlock(blocks, { x, y: 10, type: "wood" });
    for (let x = 24; x < 32; x++) SetBlock(blocks, { x, y: 9, type: "dirt" });
    for (let x = 44; x < 52; x++) SetBlock(blocks, { x, y: 8, type: "stone" });

    return blocks;
}

function CreateDefaultProfile(slot) {
    const colorIndex = (slot - 1) % PLAYER_COLORS.length;
    return {
        id: null,
        slot,
        name: `Player ${slot}`,
        colorIndex,
        color: PLAYER_COLORS[colorIndex],
        ...PLAYER_SIZE,
    };
}

function HandleSocketData(client, chunk) {
    client.buffer = Buffer.concat([client.buffer, chunk]);

    while (client.buffer.length > 0) {
        const frame = ReadFrame(client.buffer);
        if (!frame) return;

        client.buffer = client.buffer.subarray(frame.bytes);

        if (frame.opcode === 8) {
            client.socket.end();
            return;
        }

        if (frame.opcode === 9) {
            SendFrame(client.socket, frame.payload, 10);
            continue;
        }

        if (frame.opcode === 1) {
            HandleNetworkMessage(client, frame.payload.toString("utf8"));
            continue;
        }

        if (frame.opcode === 2) {
            HandleNetworkBinaryMessage(client, frame.payload);
        }
    }
}

function HandleNetworkMessage(client, rawMessage) {
    let message = null;

    try {
        message = JSON.parse(rawMessage);
    } catch {
        return;
    }

    const room = networkRooms.get(client.roomId);
    if (!room || !message?.type) return;

    if (message.type === "player:profile") {
        client.profile = NormalizeProfile(message.payload, client);
        if (client.player) {
            client.player = {
                ...client.player,
                ...client.profile,
            };
        }

        Broadcast(room, "player:profile", client.profile, { except: client.id });
        return;
    }

    if (message.type === "player:update") {
        client.player = {
            ...PLAYER_SIZE,
            ...client.profile,
            ...message.payload,
            id: client.id,
            slot: client.slot,
            updatedAt: Date.now(),
        };
        Broadcast(room, "player:update", client.player, { except: client.id });
        return;
    }

    if (message.type === "world:block:set") {
        const block = NormalizeBlock(message.payload);
        if (!block) return;

        if (block.type === "air") {
            room.blocks.delete(BlockKey(block.x, block.y));
        } else {
            SetBlock(room.blocks, block);
        }

        Broadcast(room, "world:block:set", block);
        return;
    }

    if (message.type === "chat:say") {
        Broadcast(room, "chat:say", {
            id: client.id,
            text: String(message.payload?.text ?? "").slice(0, 120),
        });
    }
}

function HandleNetworkBinaryMessage(client, payload) {
    const state = DecodeClientPlayerState(payload);
    if (!state) return;

    const room = networkRooms.get(client.roomId);
    if (!room) return;

    client.player = {
        ...PLAYER_SIZE,
        ...client.profile,
        ...state,
        id: client.id,
        slot: client.slot,
        updatedAt: Date.now(),
    };

    BroadcastBinary(room, EncodeRemotePlayerState(client.player), { except: client.id });
}

function NormalizeProfile(payload, client) {
    const fallback = client.profile ?? CreateDefaultProfile(client.slot);
    const colorIndex = ClampNumber(Math.trunc(Number(payload?.colorIndex ?? fallback.colorIndex)), 0, PLAYER_COLORS.length - 1);
    const name = String(payload?.name ?? fallback.name)
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 18) || fallback.name;

    return {
        ...fallback,
        id: client.id,
        slot: client.slot,
        name,
        colorIndex,
        color: PLAYER_COLORS[colorIndex],
        width: ClampNumber(Math.trunc(Number(payload?.width ?? fallback.width)), 8, 96),
        height: ClampNumber(Math.trunc(Number(payload?.height ?? fallback.height)), 8, 128),
    };
}

function NormalizeBlock(payload) {
    const x = Math.trunc(Number(payload?.x));
    const y = Math.trunc(Number(payload?.y));
    const type = String(payload?.type ?? "dirt");

    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    if (x < 0 || y < 0 || x >= ROOM_WORLD.width || y >= ROOM_WORLD.height) return null;

    return {
        x,
        y,
        type: ["air", "grass", "dirt", "stone", "wood"].includes(type) ? type : "dirt",
    };
}

function SetBlock(blocks, block) {
    blocks.set(BlockKey(block.x, block.y), block);
}

function BlockKey(x, y) {
    return `${x},${y}`;
}

function Broadcast(room, type, payload, { except = null } = {}) {
    room.clients.forEach(client => {
        if (client.id !== except) SendEnvelope(client, type, payload);
    });
}

function BroadcastBinary(room, payload, { except = null } = {}) {
    room.clients.forEach(client => {
        if (client.id !== except) SendFrame(client.socket, payload, 2);
    });
}

function SendEnvelope(client, type, payload) {
    SendFrame(client.socket, Buffer.from(JSON.stringify({
        type,
        payload,
        meta: {
            id: CreateId("msg"),
            sentAt: Date.now(),
        },
    })));
}

function DecodeClientPlayerState(payload) {
    if (!Buffer.isBuffer(payload) || payload.length < 14) return null;
    if (payload[0] !== PROTOCOL_VERSION || payload[1] !== BINARY_MESSAGE.PLAYER_STATE) return null;

    const flags = payload.readUInt8(12);
    return {
        sequence: payload.readUInt16BE(2),
        x: payload.readInt16BE(4) / FIXED_POINT.POSITION_SCALE,
        y: payload.readInt16BE(6) / FIXED_POINT.POSITION_SCALE,
        vx: payload.readInt16BE(8) / FIXED_POINT.VELOCITY_SCALE,
        vy: payload.readInt16BE(10) / FIXED_POINT.VELOCITY_SCALE,
        grounded: (flags & PLAYER_FLAGS.GROUNDED) !== 0,
        facingRight: (flags & PLAYER_FLAGS.FACING_RIGHT) !== 0,
        colorIndex: ClampNumber(payload.readUInt8(13), 0, PLAYER_COLORS.length - 1),
    };
}

function EncodeRemotePlayerState(player) {
    const payload = Buffer.alloc(16);
    payload.writeUInt8(PROTOCOL_VERSION, 0);
    payload.writeUInt8(BINARY_MESSAGE.REMOTE_PLAYER_STATE, 1);
    payload.writeUInt16BE(Math.trunc(ClampNumber(player.sequence ?? 0, 0, 0xffff)), 2);
    payload.writeUInt16BE(Math.trunc(ClampNumber(player.slot ?? 0, 0, 0xffff)), 4);
    WriteFixedInt16(payload, 6, player.x, FIXED_POINT.POSITION_SCALE);
    WriteFixedInt16(payload, 8, player.y, FIXED_POINT.POSITION_SCALE);
    WriteFixedInt16(payload, 10, player.vx, FIXED_POINT.VELOCITY_SCALE);
    WriteFixedInt16(payload, 12, player.vy, FIXED_POINT.VELOCITY_SCALE);
    payload.writeUInt8(EncodePlayerFlags(player), 14);
    payload.writeUInt8(Math.trunc(ClampNumber(player.colorIndex ?? 0, 0, PLAYER_COLORS.length - 1)), 15);
    return payload;
}

function WriteFixedInt16(buffer, offset, value, scale) {
    const numeric = Number.isFinite(Number(value)) ? Number(value) : 0;
    buffer.writeInt16BE(ClampNumber(Math.round(numeric * scale), -32768, 32767), offset);
}

function EncodePlayerFlags(player) {
    let flags = 0;
    if (player.grounded) flags |= PLAYER_FLAGS.GROUNDED;
    if (player.facingRight !== false) flags |= PLAYER_FLAGS.FACING_RIGHT;
    return flags;
}

function ClampNumber(value, min, max) {
    const numeric = Number.isFinite(Number(value)) ? Number(value) : min;
    return Math.max(min, Math.min(max, numeric));
}

function ReadFrame(buffer) {
    if (buffer.length < 2) return null;

    const first = buffer[0];
    const second = buffer[1];
    const opcode = first & 0x0f;
    const masked = (second & 0x80) !== 0;
    let length = second & 0x7f;
    let offset = 2;

    if (length === 126) {
        if (buffer.length < offset + 2) return null;
        length = buffer.readUInt16BE(offset);
        offset += 2;
    } else if (length === 127) {
        if (buffer.length < offset + 8) return null;
        const bigLength = buffer.readBigUInt64BE(offset);
        if (bigLength > BigInt(Number.MAX_SAFE_INTEGER)) return null;
        length = Number(bigLength);
        offset += 8;
    }

    const maskOffset = offset;
    if (masked) offset += 4;
    if (buffer.length < offset + length) return null;

    const payload = Buffer.from(buffer.subarray(offset, offset + length));
    if (masked) {
        const mask = buffer.subarray(maskOffset, maskOffset + 4);
        for (let index = 0; index < payload.length; index++) {
            payload[index] ^= mask[index % 4];
        }
    }

    return {
        opcode,
        payload,
        bytes: offset + length,
    };
}

function SendFrame(socket, payload, opcode = 1) {
    const length = payload.length;
    let header = null;

    if (length < 126) {
        header = Buffer.from([0x80 | opcode, length]);
    } else if (length <= 0xffff) {
        header = Buffer.alloc(4);
        header[0] = 0x80 | opcode;
        header[1] = 126;
        header.writeUInt16BE(length, 2);
    } else {
        header = Buffer.alloc(10);
        header[0] = 0x80 | opcode;
        header[1] = 127;
        header.writeBigUInt64BE(BigInt(length), 2);
    }

    socket.write(Buffer.concat([header, payload]));
}

function CreateId(prefix) {
    if (crypto.randomUUID) return `${prefix}_${crypto.randomUUID()}`;
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
}

function StartServer(port, attemptsLeft = MAX_PORT_ATTEMPTS) {
    const server = CreateServer();
    AttachNetworkServer(server);

    server.once("error", error => {
        if (error.code === "EADDRINUSE" && attemptsLeft > 0) {
            StartServer(port + 1, attemptsLeft - 1);
            return;
        }

        console.error(`GameForgeJS dev server failed: ${error.message}`);
        process.exit(1);
    });

    server.listen(port, () => {
        console.log(`GameForgeJS dev server running at http://localhost:${port}`);
        if (port !== REQUESTED_PORT) {
            console.log(`Port ${REQUESTED_PORT} was busy, so the next available port was used.`);
        }
    });
}

StartServer(REQUESTED_PORT);
