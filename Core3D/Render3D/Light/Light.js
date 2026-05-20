import { Color } from "../Core/Color.js";

export class Light {
    constructor({ type = "light", color = Color.White(), intensity = 1 } = {}) {
        this.isLight3D = true;
        this.type = type;
        this.color = Color.ToArray3(color);
        this.intensity = intensity;
        this.enabled = true;
    }
}

export function normalize3(vector, fallback = [0, -1, 0]) {
    const x = vector?.[0] ?? fallback[0];
    const y = vector?.[1] ?? fallback[1];
    const z = vector?.[2] ?? fallback[2];
    const length = Math.hypot(x, y, z) || 1;
    return [x / length, y / length, z / length];
}
