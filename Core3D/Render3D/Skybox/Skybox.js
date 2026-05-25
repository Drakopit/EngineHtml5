/**
 * Background environment rendered from a cubemap cross image.
 *
 * @param {Object} [options] - Skybox definition.
 * @param {HTMLImageElement|null} [options.image=null] - Four-by-three cubemap cross image.
 * @param {string} [options.name="Skybox"] - Debug/display name.
 */
export class Skybox {
    constructor({ image = null, name = "Skybox" } = {}) {
        this.isSkybox3D = true;
        this.name = name;
        this.image = image;
    }

    /**
     * Wraps an already loaded cubemap cross image.
     * @param {HTMLImageElement} image - Loaded skybox image.
     * @param {Object} [options={}] - Additional skybox values.
     * @returns {Skybox} Created skybox.
     */
    static FromImage(image, options = {}) {
        return new Skybox({ ...options, image });
    }
}
