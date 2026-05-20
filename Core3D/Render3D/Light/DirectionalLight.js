import { Light, normalize3 } from "./Light.js";

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

    SetDirection(direction) {
        this.direction = normalize3(direction);
        return this;
    }
}
