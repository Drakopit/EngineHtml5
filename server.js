const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const REQUESTED_PORT = Number(process.env.PORT) || 8080;
const MAX_PORT_ATTEMPTS = 20;
const ROOT_DIR = __dirname;
const DEFAULT_FILE = "Main.html";
const NETWORK_PATH = "/gameforge-network";
const WS_MAGIC = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
const ROOM_WORLD = Object.freeze({
    width: 90,
    height: 18,
    tileSize: 32,
});

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
    const client = {
        id: CreateId("player"),
        roomId,
        socket,
        buffer: Buffer.alloc(0),
        player: null,
    };

    room.clients.set(client.id, client);
    socket.on("data", chunk => HandleSocketData(client, chunk));
    socket.on("close", () => LeaveNetworkRoom(client));
    socket.on("error", () => LeaveNetworkRoom(client));

    SendEnvelope(client, "room:welcome", {
        playerId: client.id,
        roomId,
        world: {
            ...ROOM_WORLD,
            blocks: [...room.blocks.values()],
        },
        players: [...room.clients.values()]
            .filter(item => item.player)
            .map(item => item.player),
    });

    Broadcast(room, "player:joined", { id: client.id }, { except: client.id });
}

function LeaveNetworkRoom(client) {
    const room = networkRooms.get(client.roomId);
    if (!room || !room.clients.has(client.id)) return;

    room.clients.delete(client.id);
    Broadcast(room, "player:left", { id: client.id });

    if (room.clients.size === 0) {
        networkRooms.delete(client.roomId);
    }
}

function GetNetworkRoom(roomId) {
    if (!networkRooms.has(roomId)) {
        networkRooms.set(roomId, {
            id: roomId,
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

        if (frame.opcode !== 1) continue;
        HandleNetworkMessage(client, frame.payload.toString("utf8"));
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

    if (message.type === "player:update") {
        client.player = {
            id: client.id,
            updatedAt: Date.now(),
            ...message.payload,
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
