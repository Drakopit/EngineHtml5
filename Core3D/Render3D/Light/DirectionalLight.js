import { Light, normalize3 } from "./Light.js";

/**
 * Sun-like directional light that can cast one shadow map.
 *
 * @param {Object} [options] - Light and shadow settings.
 * @param {number[]} [options.direction] - Direction in world space.
 * @param {boolean} [options.castShadow=false] - Whether to render shadows.
 * @param {number} [options.shadowMapSize=1024] - Shadow texture resolution.
 * @param {number} [options.shadowDistance=16] - Shadow camera coverage.
 */
export class DirectionalLight extends Light {
    constructor({
        direction = [-0.4, -1.0, -0.35],
        color = [1, 0.96, 0.86],
        intensity = 1.8,
        castShadow = false,
        shadowMapSize = 1024,
        shadowBias = 0.0012,
        shadowStrength = 0.55,
        shadowDistance = 16,
    } = {}) {
        super({ type: "directional", color, intensity });
        this.direction = normalize3(direction);
        this.castShadow = castShadow;
        this.shadowMapSize = shadowMapSize;
        this.shadowBias = shadowBias;
        this.shadowStrength = shadowStrength;
        this.shadowDistance = shadowDistance;
    }

    /**
     * Updates the normalized light direction.
     * @param {number[]} direction - New world-space direction.
     * @returns {DirectionalLight} This light.
     */
    SetDirection(direction) {
        this.direction = normalize3(direction);
        return this;
    }
}
