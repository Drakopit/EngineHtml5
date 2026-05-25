import { Color } from "../Core/Color.js";
import { Light } from "./Light.js";

/**
 * Two-tone ambient illumination blended between sky and ground colors.
 *
 * @param {Object} [options] - Light values.
 * @param {number[]} [options.skyColor] - Upper hemisphere RGB color.
 * @param {number[]} [options.groundColor] - Lower hemisphere RGB color.
 * @param {number} [options.intensity=0.35] - Contribution strength.
 */
export class HemisphereLight extends Light {
    constructor({
        skyColor = [0.55, 0.72, 1.0],
        groundColor = [0.35, 0.28, 0.22],
        intensity = 0.35,
    } = {}) {
        super({ type: "hemisphere", color: skyColor, intensity });
        this.skyColor = Color.ToArray3(skyColor);
        this.groundColor = Color.ToArray3(groundColor);
    }
}
