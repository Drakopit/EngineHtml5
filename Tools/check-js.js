const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT_DIR = path.resolve(__dirname, "..");
const IGNORED_DIRS = new Set([".git", ".idea", ".vs", "node_modules", "dist", "build"]);

function CollectJsFiles(directory, files = []) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            if (!IGNORED_DIRS.has(entry.name)) {
                CollectJsFiles(path.join(directory, entry.name), files);
            }
            continue;
        }

        if (entry.isFile() && entry.name.endsWith(".js")) {
            files.push(path.join(directory, entry.name));
        }
    }

    return files;
}

let hasError = false;
for (const file of CollectJsFiles(ROOT_DIR)) {
    const result = spawnSync(process.execPath, ["--check", file], {
        cwd: ROOT_DIR,
        stdio: "inherit",
    });

    if (result.status !== 0) {
        hasError = true;
    }
}

if (hasError) {
    process.exit(1);
}

console.log("All JavaScript files passed syntax check.");
