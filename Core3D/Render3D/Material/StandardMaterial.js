import { Color } from "../Core/Color.js";
import { Material } from "./Material.js";

/**
 * Lit PBR-style material with color, texture maps and shadow support.
 *
 * @param {Object} [options] - Surface settings.
 * @param {number[]|Color|string} [options.albedoColor] - Base RGBA color.
 * @param {Texture|null} [options.albedoMap=null] - Base color texture.
 * @param {Texture|null} [options.normalMap=null] - Tangent-space normal map.
 * @param {Texture|null} [options.heightMap=null] - Parallax height map.
 * @param {number} [options.roughness=0.72] - Surface roughness.
 * @param {number} [options.metallic=0] - Metallic factor.
 * @param {boolean} [options.receiveShadow=true] - Whether shadows affect this surface.
 */
export class StandardMaterial extends Material {
    constructor({
        name = "StandardMaterial",
        albedoColor = [1, 1, 1, 1],
        albedoMap = null,
        normalMap = null,
        roughnessMap = null,
        aoMap = null,
        ormMap = null,
        heightMap = null,
        emissiveMap = null,
        uvScale = [1, 1],
        normalScale = 1.0,
        heightScale = 0.0,
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
        this.ormMap = ormMap;
        this.heightMap = heightMap;
        this.emissiveMap = emissiveMap;
        this.uvScale = [...uvScale];
        this.normalScale = normalScale;
        this.heightScale = heightScale;
        this.roughness = roughness;
        this.metallic = metallic;
        this.emissiveColor = Color.ToArray3(emissiveColor, [0, 0, 0]);
        this.receiveShadow = receiveShadow;
    }
}
