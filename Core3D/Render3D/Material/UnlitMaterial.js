import { Color } from "../Core/Color.js";
import { Material } from "./Material.js";

/**
 * Material rendered without scene lighting, useful for markers and effects.
 *
 * @param {Object} [options] - Surface settings.
 * @param {number[]|Color|string} [options.color] - RGBA surface color.
 * @param {Texture|null} [options.albedoMap=null] - Optional display texture.
 * @param {boolean} [options.transparent=false] - Whether blending may be required.
 */
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
