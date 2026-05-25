const http = require("http");
const fs = require("fs");
const path = require("path");

const REQUESTED_PORT = Number(process.env.PORT) || 8080;
const MAX_PORT_ATTEMPTS = 20;
const ROOT_DIR = path.join(__dirname, "..");
const DEFAULT_FILE = "Main.html";

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

function SendHeaders(res, contentType) {
    res.setHeader("Content-Type", contentType);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function SendText(res, statusCode, message) {
    SendHeaders(res, "text/plain; charset=utf-8");
    res.writeHead(statusCode);
    res.end(message);
}

function CreateServer() {
    return http.createServer((req, res) => {
        if (req.method === "OPTIONS") {
            SendHeaders(res, "text/plain; charset=utf-8");
            res.writeHead(204);
            res.end();
            return;
        }

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
            SendHeaders(res, MIME_TYPES[extname] || "application/octet-stream");
            res.writeHead(200);
            if (req.method === "HEAD") {
                res.end();
                return;
            }
            res.end(content);
        });
    });
}

function StartServer(port, attemptsLeft = MAX_PORT_ATTEMPTS) {
    const server = CreateServer();

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
