export const COURSE_BOUNDS = Object.freeze({
    minX: -5.4,
    maxX: 5.4,
    minZ: -16.2,
    maxZ: 3.2,
});

export const PLAYER_START = Object.freeze([0, 0.12, 1.1]);

export const PLATFORMS = Object.freeze([
    {
        id: "start",
        position: [0, -0.45, 0],
        size: [6.4, 0.42, 5.0],
        color: [0.53, 0.88, 0.42, 1],
    },
    {
        id: "garden",
        position: [-2.05, 0.22, -3.55],
        size: [3.15, 0.4, 2.2],
        color: [0.46, 0.84, 0.38, 1],
        motion: { axis: "x", amplitude: 0.75, speed: 1.25, phase: 0.2 },
    },
    {
        id: "sunrise",
        position: [1.55, 0.88, -6.0],
        size: [3.25, 0.4, 2.15],
        color: [0.95, 0.7, 0.28, 1],
        motion: { axis: "z", amplitude: 0.55, speed: 1.5, phase: 1.1 },
    },
    {
        id: "cloudstep",
        position: [-1.6, 1.54, -8.55],
        size: [3.0, 0.4, 2.2],
        color: [0.35, 0.74, 0.92, 1],
        motion: { axis: "x", amplitude: 1.25, speed: 1.15, phase: 2.2 },
    },
    {
        id: "highbridge",
        position: [1.65, 2.2, -11.05],
        size: [3.2, 0.4, 2.25],
        color: [0.95, 0.48, 0.34, 1],
        motion: { axis: "x", amplitude: 0.9, speed: 1.4, phase: 3.3 },
        blink: { period: 4.2, solidDuration: 2.85, warningDuration: 0.6, phase: 0.5 },
    },
    {
        id: "summit",
        position: [0, 2.88, -13.9],
        size: [4.7, 0.48, 3.0],
        color: [0.47, 0.85, 0.46, 1],
    },
]);

export const COINS = Object.freeze([
    { platformId: "start", offset: [-1.25, 0.93, 0.25], value: 10 },
    { platformId: "start", offset: [1.25, 0.93, -0.65], value: 10 },
    { platformId: "garden", offset: [0, 0.91, 0], value: 10 },
    { platformId: "sunrise", offset: [0, 0.91, 0], value: 10 },
    { platformId: "cloudstep", offset: [0, 0.91, 0], value: 10 },
    { platformId: "highbridge", offset: [0, 0.91, 0], value: 10 },
    { platformId: "summit", offset: [-0.9, 0.95, 0.4], value: 10 },
]);

export const GOAL = Object.freeze({
    trigger: [1.25, 3.12, -14.25],
    pole: [1.42, 4.68, -14.3],
    flag: [0.94, 5.62, -14.3],
    radius: 0.92,
});
