const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const DEMOS_DIR = path.join(ROOT_DIR, "Demos");
const errors = [];

function readJson(file) {
    try {
        return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch (error) {
        errors.push(`${relative(file)}: invalid JSON (${error.message})`);
        return null;
    }
}

function relative(file) {
    return path.relative(ROOT_DIR, file).replace(/\\/g, "/");
}

function projectFile(projectDir, declaredPath) {
    const rootFile = path.join(ROOT_DIR, declaredPath);
    return fs.existsSync(rootFile) ? rootFile : path.join(projectDir, declaredPath);
}

function requireFile(file, label) {
    if (!fs.existsSync(file)) {
        errors.push(`${label}: missing file ${relative(file)}`);
        return false;
    }
    return true;
}

function pngSize(file, label) {
    if (!requireFile(file, label)) return null;
    const bytes = fs.readFileSync(file);
    if (bytes.length < 24 || bytes.toString("ascii", 1, 4) !== "PNG") {
        errors.push(`${label}: source rectangles require a PNG image (${relative(file)})`);
        return null;
    }
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

function validateRect(label, rect, size, frames = 1, frameStepX = rect?.width) {
    if (!rect || !size) return;
    const x = Number(rect.x ?? 0);
    const y = Number(rect.y ?? 0);
    const width = Number(rect.width);
    const height = Number(rect.height);
    const count = Math.max(1, Number(frames) || 1);
    const step = Number(frameStepX ?? width);
    if (![x, y, width, height, step].every(Number.isFinite) || x < 0 || y < 0 || width <= 0 || height <= 0) {
        errors.push(`${label}: invalid rectangle values`);
        return;
    }
    if (x + width + ((count - 1) * step) > size.width || y + height > size.height) {
        errors.push(`${label}: rectangle exceeds ${size.width}x${size.height} source image`);
    }
}

function equalRect(left, right) {
    return ["x", "y", "width", "height"].every(key => Number(left?.[key] ?? 0) === Number(right?.[key] ?? 0));
}

function fullImageRect(rect, size) {
    return equalRect(rect, { x: 0, y: 0, width: size.width, height: size.height });
}

function loadResources(projectDir, workspace) {
    const resourceFile = projectFile(projectDir, workspace.resources ?? "resources.json");
    if (!requireFile(resourceFile, `${relative(projectDir)} workspace`)) return null;
    const resources = readJson(resourceFile);
    if (!resources) return null;
    const images = new Map();
    const jsons = new Map();
    for (const image of resources.images ?? []) {
        if (!image?.name || !image?.path) continue;
        const file = projectFile(projectDir, image.path);
        requireFile(file, `${relative(resourceFile)} image '${image.name}'`);
        images.set(image.name, file);
    }
    for (const json of resources.jsons ?? []) {
        if (!json?.name || !json?.path) continue;
        const file = projectFile(projectDir, json.path);
        if (requireFile(file, `${relative(resourceFile)} JSON '${json.name}'`)) {
            const data = readJson(file);
            if (data) jsons.set(json.name, { file, data });
        }
    }
    return { file: resourceFile, data: resources, images, jsons };
}

function collectCatalog(resources) {
    const entries = new Map();
    for (const json of resources.jsons.values()) {
        for (const [atlasName, atlas] of Object.entries(json.data.atlases ?? {})) {
            const imageFile = resources.images.get(atlas.sprite);
            if (!imageFile) {
                errors.push(`${relative(json.file)} atlas '${atlasName}': unregistered image '${atlas.sprite}'`);
                continue;
            }
            const size = pngSize(imageFile, `${relative(json.file)} atlas '${atlasName}'`);
            for (const [name, rect] of Object.entries(atlas.tiles ?? {})) {
                validateRect(`${relative(json.file)} tile '${name}'`, rect, size);
            }
            for (const [name, rect] of Object.entries(atlas.sprites ?? {})) {
                validateRect(`${relative(json.file)} sprite '${name}'`, rect, size);
                entries.set(name, { kind: "sprite", atlasSprite: atlas.sprite, rect, size });
            }
            for (const [name, animation] of Object.entries(atlas.animations ?? {})) {
                validateRect(
                    `${relative(json.file)} animation '${name}'`,
                    animation.source,
                    size,
                    animation.frames,
                    animation.frameStepX,
                );
                entries.set(name, { kind: "animation", atlasSprite: atlas.sprite, rect: animation.source, size });
            }
            for (const [name, terrainSet] of Object.entries(atlas.terrainSets ?? {})) {
                entries.set(name, { kind: "terrain", atlasSprite: atlas.sprite, terrainSet });
            }
        }
    }
    return entries;
}

function imageFor(resources, name, label) {
    const file = resources.images.get(name);
    if (!file) {
        errors.push(`${label}: unregistered image '${name}'`);
        return null;
    }
    return pngSize(file, label);
}

function validateStage(file, stage, resources, catalog) {
    const label = relative(file);
    if (stage.tilemap?.sprite) {
        const size = imageFor(resources, stage.tilemap.sprite, `${label} tilemap`);
        for (const [name, rect] of Object.entries(stage.tilemap.tiles ?? {})) {
            validateRect(`${label} tile '${name}'`, rect, size);
        }
    }
    for (const layer of stage.parallax?.layers ?? []) {
        if (layer.sprite && !resources.images.has(layer.sprite)) {
            errors.push(`${label} parallax '${layer.id ?? layer.sprite}': unregistered image '${layer.sprite}'`);
        }
    }
    for (const platform of stage.platforms ?? []) {
        if (platform.terrain && !catalog.has(platform.terrain)) {
            errors.push(`${label} platform '${platform.id ?? "platform"}': unresolved terrain '${platform.terrain}'`);
        }
    }
    for (const object of stage.objects ?? []) {
        const objectLabel = `${label} object '${object.id ?? "object"}'`;
        const size = object.asset ? imageFor(resources, object.asset, objectLabel) : null;
        if (object.frame) validateRect(objectLabel, object.frame, size);
        if (!object.spriteRef && !object.animationRef) continue;
        const reference = object.spriteRef ?? object.animationRef;
        const catalogItem = catalog.get(reference);
        if (!catalogItem) {
            errors.push(`${objectLabel}: unresolved catalog reference '${reference}'`);
            continue;
        }
        if (object.asset && catalogItem.atlasSprite !== object.asset) {
            errors.push(`${objectLabel}: runtime asset '${object.asset}' differs from catalog image '${catalogItem.atlasSprite}'`);
        }
        if (object.frame && catalogItem.rect && !equalRect(object.frame, catalogItem.rect)) {
            errors.push(`${objectLabel}: runtime frame differs from catalog rectangle`);
        }
        if (!object.frame && object.asset && catalogItem.rect && size && !fullImageRect(catalogItem.rect, size)) {
            errors.push(`${objectLabel}: runtime draws the full image but Editor2D catalog crops it`);
        }
    }
}

function validateAnimatedActor(label, actor, resources) {
    for (const [assetKey, frameKey] of [["asset", "frame"], ["runAsset", "runFrame"]]) {
        if (!actor?.[assetKey] || !actor?.[frameKey]) continue;
        const size = imageFor(resources, actor[assetKey], `${label} ${frameKey}`);
        validateRect(`${label} ${frameKey}`, actor[frameKey], size, actor[frameKey].frames);
    }
}

function auditProject(projectDir, workspace) {
    const resources = loadResources(projectDir, workspace);
    if (!resources) return;
    const catalog = collectCatalog(resources);
    for (const level of workspace.levels2D ?? []) {
        const documents = level.documents ?? {};
        const stageFile = documents.stage ? projectFile(projectDir, documents.stage) : null;
        if (stageFile && requireFile(stageFile, `${relative(projectDir)} stage`)) {
            const stage = readJson(stageFile);
            if (stage) validateStage(stageFile, stage, resources, catalog);
        }
        const playerFile = documents.player ? projectFile(projectDir, documents.player) : null;
        if (playerFile && requireFile(playerFile, `${relative(projectDir)} player`)) {
            const player = readJson(playerFile)?.player;
            if (player) validateAnimatedActor(`${relative(playerFile)} player`, player, resources);
        }
        const enemiesFile = documents.enemies ? projectFile(projectDir, documents.enemies) : null;
        if (enemiesFile && requireFile(enemiesFile, `${relative(projectDir)} enemies`)) {
            const enemies = readJson(enemiesFile);
            for (const enemy of enemies?.enemies ?? []) {
                validateAnimatedActor(
                    `${relative(enemiesFile)} enemy '${enemy.id ?? "enemy"}'`,
                    { ...(enemies.enemyDefaults ?? {}), ...enemy },
                    resources,
                );
            }
        }
    }
}

for (const entry of fs.readdirSync(DEMOS_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const projectDir = path.join(DEMOS_DIR, entry.name);
    const workspaceFile = path.join(projectDir, "game.workspace.json");
    if (!fs.existsSync(workspaceFile)) continue;
    const workspace = readJson(workspaceFile);
    if ((workspace?.levels2D ?? []).length) auditProject(projectDir, workspace);
}

if (errors.length) {
    console.error("Editor asset audit failed:");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

console.log("Editor asset audit passed for declared 2D workspaces.");
