import { ROOM_HEIGHT, ROOM_WIDTH, TILE } from "./AdventureConstants.js";

const DOOR_SIZE = TILE * 3;
const DOOR_START_X = ROOM_WIDTH / 2 - DOOR_SIZE / 2;
const DOOR_END_X = ROOM_WIDTH / 2 + DOOR_SIZE / 2;
const DOOR_START_Y = ROOM_HEIGHT / 2 - DOOR_SIZE / 2;
const DOOR_END_Y = ROOM_HEIGHT / 2 + DOOR_SIZE / 2;

export const ROOMS = Object.freeze([
    {
        id: "meadow",
        name: "Meadow Gate",
        gridX: 0,
        gridY: 0,
        floor: "#496f35",
        floorAlt: "#3f642f",
        wall: "#2c3d28",
        exits: {
            right: { to: "ruins", min: DOOR_START_Y, max: DOOR_END_Y },
            down: { to: "river", min: DOOR_START_X, max: DOOR_END_X },
        },
        solids: [
            { x: 96, y: 104, width: 96, height: 32 },
            { x: 360, y: 288, width: 128, height: 32 },
            { x: 480, y: 88, width: 48, height: 96 },
        ],
        decorations: [
            { type: "bush", x: 76, y: 72 },
            { type: "bush", x: 116, y: 70 },
            { type: "bush", x: 512, y: 260 },
            { type: "sign", x: 280, y: 168, text: "Rooms slide like classic adventure games" },
        ],
        enemies: [
            { x: 424, y: 172 },
        ],
    },
    {
        id: "ruins",
        name: "Old Ruins",
        gridX: 1,
        gridY: 0,
        floor: "#5a6848",
        floorAlt: "#526142",
        wall: "#34372f",
        exits: {
            left: { to: "meadow", min: DOOR_START_Y, max: DOOR_END_Y },
            down: { to: "shrine", min: DOOR_START_X, max: DOOR_END_X },
        },
        solids: [
            { x: 104, y: 92, width: 96, height: 64 },
            { x: 288, y: 104, width: 64, height: 160 },
            { x: 416, y: 288, width: 112, height: 40 },
        ],
        decorations: [
            { type: "pillar", x: 104, y: 196 },
            { type: "pillar", x: 208, y: 196 },
            { type: "pillar", x: 504, y: 120 },
        ],
        enemies: [
            { x: 440, y: 208 },
            { x: 188, y: 328 },
        ],
    },
    {
        id: "river",
        name: "River Garden",
        gridX: 0,
        gridY: 1,
        floor: "#42683b",
        floorAlt: "#386034",
        wall: "#283d2d",
        exits: {
            up: { to: "meadow", min: DOOR_START_X, max: DOOR_END_X },
            right: { to: "shrine", min: DOOR_START_Y, max: DOOR_END_Y },
        },
        solids: [
            { x: 192, y: 96, width: 256, height: 64, water: true },
            { x: 96, y: 288, width: 96, height: 32 },
            { x: 408, y: 304, width: 96, height: 32 },
        ],
        decorations: [
            { type: "bridge", x: 288, y: 96, width: 64, height: 64 },
            { type: "bush", x: 80, y: 180 },
            { type: "bush", x: 520, y: 368 },
        ],
        enemies: [
            { x: 500, y: 232 },
        ],
    },
    {
        id: "shrine",
        name: "Wind Shrine",
        gridX: 1,
        gridY: 1,
        floor: "#59604c",
        floorAlt: "#4f5746",
        wall: "#2f332d",
        exits: {
            up: { to: "ruins", min: DOOR_START_X, max: DOOR_END_X },
            left: { to: "river", min: DOOR_START_Y, max: DOOR_END_Y },
        },
        solids: [
            { x: 240, y: 112, width: 160, height: 96 },
            { x: 96, y: 320, width: 120, height: 32 },
            { x: 424, y: 320, width: 120, height: 32 },
        ],
        decorations: [
            { type: "altar", x: 286, y: 136 },
            { type: "pillar", x: 176, y: 216 },
            { type: "pillar", x: 432, y: 216 },
        ],
        enemies: [
            { x: 330, y: 330 },
        ],
    },
]);

export function GetRoomById(roomId) {
    return ROOMS.find(room => room.id === roomId) ?? null;
}

export function BuildRoomWalls(room) {
    const wall = TILE;
    const walls = [];

    addHorizontalWall(walls, room, "up", 0, wall);
    addHorizontalWall(walls, room, "down", ROOM_HEIGHT - wall, wall);
    addVerticalWall(walls, room, "left", 0, wall);
    addVerticalWall(walls, room, "right", ROOM_WIDTH - wall, wall);

    return walls;
}

function addHorizontalWall(walls, room, direction, y, height) {
    const exit = room.exits?.[direction];
    if (!exit) {
        walls.push({ x: 0, y, width: ROOM_WIDTH, height });
        return;
    }

    walls.push({ x: 0, y, width: exit.min, height });
    walls.push({ x: exit.max, y, width: ROOM_WIDTH - exit.max, height });
}

function addVerticalWall(walls, room, direction, x, width) {
    const exit = room.exits?.[direction];
    if (!exit) {
        walls.push({ x, y: 0, width, height: ROOM_HEIGHT });
        return;
    }

    walls.push({ x, y: 0, width, height: exit.min });
    walls.push({ x, y: exit.max, width, height: ROOM_HEIGHT - exit.max });
}
