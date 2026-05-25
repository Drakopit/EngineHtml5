/**
 * Base collision volume offset from a Render3D object's transform.
 *
 * @param {Object} [options] - Collider settings.
 * @param {string} [options.type="collider"] - Collision shape category.
 * @param {number[]} [options.offset] - Local center offset.
 * @param {boolean} [options.isTrigger=false] - Trigger-only marker for games.
 */
export class Collider3D {
    constructor({ type = "collider", offset = [0, 0, 0], isTrigger = false } = {}) {
        this.type = type;
        this.offset = [...offset];
        this.isTrigger = isTrigger;
    }

    /**
     * Computes the collision center in world coordinates.
     * @param {Transform3D} transform - Object transform.
     * @returns {number[]} World center position.
     */
    GetCenter(transform) {
        return [
            transform.position[0] + this.offset[0],
            transform.position[1] + this.offset[1],
            transform.position[2] + this.offset[2],
        ];
    }
}
