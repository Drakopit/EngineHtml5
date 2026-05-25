/**
 * Container for renderable meshes, lights, one camera and one skybox.
 *
 * The renderer queries this lightweight collection each frame; gameplay remains
 * in levels and entities rather than in the scene container.
 *
 * @param {Object} [options] - Initial scene properties.
 * @param {number[]} [options.backgroundColor] - RGBA fallback clear color.
 */
export class Scene3D {
    constructor({ backgroundColor = [0.03, 0.04, 0.07, 1] } = {}) {
        this.backgroundColor = [...backgroundColor];
        this.objects = [];
        this.lights = [];
        this.camera = null;
        this.skybox = null;
    }

    /**
     * Registers a mesh, light, camera or skybox based on its Render3D marker.
     * @param {Object} item - Runtime scene item.
     * @returns {Object} The supplied item.
     */
    Add(item) {
        if (!item) return item;

        if (item.isCamera3D) {
            this.camera = item;
            return item;
        }

        if (item.isSkybox3D) {
            this.skybox = item;
            return item;
        }

        if (item.isLight3D) {
            this.lights.push(item);
            return item;
        }

        this.objects.push(item);
        return item;
    }

    /**
     * Removes an item from all applicable scene slots.
     * @param {Object} item - Previously added scene item.
     * @returns {void}
     */
    Remove(item) {
        this.objects = this.objects.filter(object => object !== item);
        this.lights = this.lights.filter(light => light !== item);
        if (this.camera === item) this.camera = null;
        if (this.skybox === item) this.skybox = null;
    }

    /**
     * Returns visible objects with drawable geometry.
     * @returns {Object[]} Mesh-like renderable objects.
     */
    GetRenderableObjects() {
        return this.objects.filter(object => object?.visible !== false && object?.geometry);
    }

    /**
     * Returns enabled lights, optionally filtered by type.
     * @param {string|null} [type=null] - Light type filter.
     * @returns {Object[]} Enabled lights.
     */
    GetLights(type = null) {
        return this.lights.filter(light => light.enabled !== false && (!type || light.type === type));
    }
}
