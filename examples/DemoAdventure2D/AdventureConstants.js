export const ADVENTURE_SCREEN = Object.freeze({
    width: 640,
    height: 480,
});

export const TILE = 32;
export const ROOM_COLS = ADVENTURE_SCREEN.width / TILE;
export const ROOM_ROWS = ADVENTURE_SCREEN.height / TILE;
export const ROOM_WIDTH = ADVENTURE_SCREEN.width;
export const ROOM_HEIGHT = ADVENTURE_SCREEN.height;

export const DIRECTIONS = Object.freeze({
    UP: "up",
    DOWN: "down",
    LEFT: "left",
    RIGHT: "right",
});

export function RoomOrigin(room) {
    return {
        x: room.gridX * ROOM_WIDTH,
        y: room.gridY * ROOM_HEIGHT,
    };
}

export function Clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

export function AabbIntersects(a, b) {
    return a.x < b.x + b.width
        && a.x + a.width > b.x
        && a.y < b.y + b.height
        && a.y + a.height > b.y;
}
