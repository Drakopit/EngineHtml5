import { Color } from "../Core/Color.js";
import { Light } from "./Light.js";

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
