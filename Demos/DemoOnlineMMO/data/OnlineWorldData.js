export const ONLINE_SCREEN = Object.freeze({
    width: 800,
    height: 480,
});

export const ONLINE_WORLD = Object.freeze({
    width: 90,
    height: 18,
    tileSize: 32,
});

export const ONLINE_PLAYER = Object.freeze({
    width: 22,
    height: 42,
    speed: 185,
    gravity: 1080,
    jump: -430,
});

export const BLOCK_TYPES = Object.freeze(["dirt", "stone", "wood", "grass"]);

export const BLOCK_COLORS = Object.freeze({
    grass: { top: "#4f9d51", base: "#6b4c2f", edge: "#2f6f38" },
    dirt: { top: "#8a6040", base: "#6b422b", edge: "#4b2d1d" },
    stone: { top: "#98a4aa", base: "#68747b", edge: "#4c565c" },
    wood: { top: "#b9824a", base: "#81522d", edge: "#5a351e" },
});

export const PLAYER_COLORS = Object.freeze([
    "#5ec8ff",
    "#ffcf5e",
    "#9cff6d",
    "#ff7eab",
    "#c792ff",
    "#ff8a4c",
]);

export function BlockKey(x, y) {
    return `${x},${y}`;
}

export function CreateOnlineWorldBlocks() {
    const blocks = new Map();
    const set = (x, y, type) => blocks.set(BlockKey(x, y), { x, y, type });

    for (let x = 0; x < ONLINE_WORLD.width; x++) {
        set(x, 13, "grass");
        for (let y = 14; y < ONLINE_WORLD.height; y++) {
            set(x, y, y < 16 ? "dirt" : "stone");
        }
    }

    for (let x = 8; x < 14; x++) set(x, 10, "wood");
    for (let x = 24; x < 32; x++) set(x, 9, "dirt");
    for (let x = 44; x < 52; x++) set(x, 8, "stone");

    return blocks;
}
