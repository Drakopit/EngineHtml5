import { Color } from "../Core/Color.js";
import { Material } from "./Material.js";

export class UnlitMaterial extends Material {
    constructor({
        name = "UnlitMaterial",
        color = [1, 1, 1, 1],
        albedoMap = null,
        transparent = false,
    } = {}) {
        super({ name, transparent });
        this.type = "unlit";
        this.albedoColor = Color.ToArray4(color);
        this.albedoMap = albedoMap;
    }
}
