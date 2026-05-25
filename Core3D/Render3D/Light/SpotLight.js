import { Light, normalize3 } from "./Light.js";

/**
 * Cone-shaped local light defined by position, direction and angular falloff.
 *
 * @param {Object} [options] - Light values.
 * @param {number[]} [options.position] - World-space position.
 * @param {number[]} [options.direction] - World-space pointing direction.
 * @param {number} [options.innerAngle] - Fully lit cone angle in radians.
 * @param {number} [options.outerAngle] - Outer falloff cone angle in radians.
 */
export class SpotLight extends Light {
    constructor({
        position = [0, 4, 0],
        direction = [0, -1, 0],
        color = [1, 1, 1],
        intensity = 1,
        range = 12,
        innerAngle = Math.PI / 8,
        outerAngle = Math.PI / 5,
    } = {}) {
        super({ type: "spot", color, intensity });
        this.position = [...position];
        this.direction = normalize3(direction);
        this.range = range;
        this.innerAngle = innerAngle;
        this.outerAngle = Math.max(outerAngle, innerAngle + 0.001);
    }
}
