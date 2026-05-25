import { Color } from "../Core/Color.js";

/**
 * Base class for lights stored by `Scene3D`.
 *
 * @param {Object} [options] - Light values.
 * @param {string} [options.type="light"] - Renderer light category.
 * @param {number[]|Color|string} [options.color] - RGB light color.
 * @param {number} [options.intensity=1] - Light energy.
 */
export class Light {
    constructor({ type = "light", color = Color.White(), intensity = 1 } = {}) {
        this.isLight3D = true;
        this.type = type;
        this.color = Color.ToArray3(color);
        this.intensity = intensity;
        this.enabled = true;
    }
}

/**
 * Normalizes a three-component direction vector.
 * @param {number[]} vector - Direction candidate.
 * @param {number[]} [fallback] - Value used when fields are missing.
 * @returns {number[]} Unit length direction.
 */
export function normalize3(vector, fallback = [0, -1, 0]) {
    const x = vector?.[0] ?? fallback[0];
    const y = vector?.[1] ?? fallback[1];
    const z = vector?.[2] ?? fallback[2];
    const length = Math.hypot(x, y, z) || 1;
    return [x / length, y / length, z / length];
}
