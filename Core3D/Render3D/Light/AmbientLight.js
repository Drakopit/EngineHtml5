import { Light } from "./Light.js";

/**
 * Constant low-cost scene illumination without a direction.
 *
 * @param {Object} [options] - Light values.
 * @param {number[]} [options.color] - RGB light color.
 * @param {number} [options.intensity=0.18] - Ambient contribution.
 */
export class AmbientLight extends Light {
    constructor({ color = [1, 1, 1], intensity = 0.18 } = {}) {
        super({ type: "ambient", color, intensity });
    }
}
