import { Light } from "./Light.js";

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
