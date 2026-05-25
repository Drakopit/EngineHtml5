import { Collider3D } from "./Collider3D.js";

/**
 * Axis-aligned box collision volume for platforms and solid scenery.
 *
 * @param {Object} [options] - Collider settings.
 * @param {number[]} [options.size] - Width, height and depth.
 * @param {number[]} [options.offset] - Local center offset.
 */
export class BoxCollider3D extends Collider3D {
    constructor({ size = [1, 1, 1], offset = [0, 0, 0], isTrigger = false } = {}) {
        super({ type: "box", offset, isTrigger });
        this.size = [...size];
    }

    /**
     * Computes axis-aligned minimum and maximum world corners.
     * @param {Transform3D} transform - Object transform.
     * @returns {Object} Bounds containing `min` and `max` arrays.
     */
    GetBounds(transform) {
        const center = this.GetCenter(transform);
        const half = [this.size[0] / 2, this.size[1] / 2, this.size[2] / 2];

        return {
            min: [center[0] - half[0], center[1] - half[1], center[2] - half[2]],
            max: [center[0] + half[0], center[1] + half[1], center[2] + half[2]],
        };
    }
}
