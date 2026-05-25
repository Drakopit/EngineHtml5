import { Light } from "./Light.js";

/**
 * Omnidirectional local light attenuated by range.
 *
 * @param {Object} [options] - Light values.
 * @param {number[]} [options.position] - World-space position.
 * @param {number} [options.range=8] - Illumination range.
 */
export class PointLight extends Light {
    constructor({
        position = [0, 2, 0],
        color = [1, 0.85, 0.55],
        intensity = 1,
        range = 8,
    } = {}) {
        super({ type: "point", color, intensity });
        this.position = [...position];
        this.range = range;
    }
}
