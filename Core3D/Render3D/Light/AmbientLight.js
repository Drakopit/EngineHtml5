import { Light } from "./Light.js";

export class AmbientLight extends Light {
    constructor({ color = [1, 1, 1], intensity = 0.18 } = {}) {
        super({ type: "ambient", color, intensity });
    }
}
