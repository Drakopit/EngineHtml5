import { Collider3D } from "./Collider3D.js";

/**
 * Sphere collision volume typically paired with a moving player body.
 *
 * @param {Object} [options] - Collider settings.
 * @param {number} [options.radius=0.5] - Sphere radius.
 * @param {number[]} [options.offset] - Local center offset.
 */
export class SphereCollider3D extends Collider3D {
    constructor({ radius = 0.5, offset = [0, 0, 0], isTrigger = false } = {}) {
        super({ type: "sphere", offset, isTrigger });
        this.radius = radius;
    }
}
