import { Light, normalize3 } from "./Light.js";

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
