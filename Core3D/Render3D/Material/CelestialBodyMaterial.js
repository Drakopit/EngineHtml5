import { Color } from "../Core/Color.js";
import { Material } from "./Material.js";

/**
 * Procedural lit material used for planets, stars and atmospheric bodies.
 *
 * @param {Object} [options] - Celestial surface controls.
 * @param {number[]} [options.baseColor] - Main RGB terrain color.
 * @param {number[]} [options.secondaryColor] - Secondary variation color.
 * @param {number[]} [options.atmosphereColor] - Rim lighting color.
 * @param {number} [options.cloudStrength=0.35] - Procedural cloud amount.
 * @param {number} [options.emissiveStrength=0] - Self-illumination factor.
 */
export class CelestialBodyMaterial extends Material {
    constructor({
        name = "CelestialBodyMaterial",
        baseColor = [0.25, 0.46, 1.0],
        secondaryColor = [0.95, 0.88, 0.55],
        atmosphereColor = [0.45, 0.74, 1.0],
        nightColor = [0.02, 0.025, 0.06],
        emissiveColor = [0, 0, 0],
        roughness = 0.62,
        seed = 1,
        cloudStrength = 0.35,
        atmosphereStrength = 0.55,
        emissiveStrength = 0,
        albedoMap = null,
        normalMap = null,
    } = {}) {
        super({ name, transparent: false });
        this.type = "celestial";
        this.baseColor = Color.ToArray3(baseColor);
        this.secondaryColor = Color.ToArray3(secondaryColor);
        this.atmosphereColor = Color.ToArray3(atmosphereColor);
        this.nightColor = Color.ToArray3(nightColor);
        this.emissiveColor = Color.ToArray3(emissiveColor);
        this.roughness = roughness;
        this.seed = seed;
        this.cloudStrength = cloudStrength;
        this.atmosphereStrength = atmosphereStrength;
        this.emissiveStrength = emissiveStrength;
        this.albedoMap = albedoMap;
        this.normalMap = normalMap;
    }
}
