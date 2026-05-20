import { Color } from "../Core/Color.js";
import { Material } from "./Material.js";

export class StandardMaterial extends Material {
    constructor({
        name = "StandardMaterial",
        albedoColor = [1, 1, 1, 1],
        albedoMap = null,
        normalMap = null,
        roughnessMap = null,
        aoMap = null,
        emissiveMap = null,
        roughness = 0.72,
        metallic = 0.0,
        emissiveColor = [0, 0, 0],
        receiveShadow = true,
        transparent = false,
    } = {}) {
        super({ name, transparent });
        this.type = "standard";
        this.albedoColor = Color.ToArray4(albedoColor);
        this.albedoMap = albedoMap;
        this.normalMap = normalMap;
        this.roughnessMap = roughnessMap;
        this.aoMap = aoMap;
        this.emissiveMap = emissiveMap;
        this.roughness = roughness;
        this.metallic = metallic;
        this.emissiveColor = Color.ToArray3(emissiveColor, [0, 0, 0]);
        this.receiveShadow = receiveShadow;
    }
}
