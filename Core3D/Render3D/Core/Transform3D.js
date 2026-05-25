import { Mat4 } from "../../../CoreCross/Math/Mat4.js";

/**
 * Mutable 3D position, Euler rotation and scale used by Render3D meshes.
 *
 * @param {Object} [options] - Initial transform values.
 * @param {number[]} [options.position] - Three-component world position.
 * @param {Object|number[]} [options.rotation] - Euler rotation in radians.
 * @param {number[]} [options.scale] - Three-component scale.
 */
export class Transform3D {
    constructor({
        position = [0, 0, 0],
        rotation = { x: 0, y: 0, z: 0 },
        scale = [1, 1, 1],
    } = {}) {
        this.position = [...position];
        this.rotation = {
            x: rotation.x ?? rotation[0] ?? 0,
            y: rotation.y ?? rotation[1] ?? 0,
            z: rotation.z ?? rotation[2] ?? 0,
        };
        this.scale = [...scale];
    }

    /**
     * Updates the transform translation.
     * @param {number} x - World x coordinate.
     * @param {number} y - World y coordinate.
     * @param {number} z - World z coordinate.
     * @returns {Transform3D} This transform.
     */
    SetPosition(x, y, z) {
        this.position[0] = x;
        this.position[1] = y;
        this.position[2] = z;
        return this;
    }

    SetRotation(x, y, z) {
        this.rotation.x = x;
        this.rotation.y = y;
        this.rotation.z = z;
        return this;
    }

    SetScale(x, y = x, z = x) {
        this.scale[0] = x;
        this.scale[1] = y;
        this.scale[2] = z;
        return this;
    }

    /**
     * Produces a local model matrix.
     * @param {Float32Array} [out] - Optional output matrix.
     * @returns {Float32Array} Model matrix.
     */
    GetMatrix(out = Mat4.create()) {
        Mat4.identity(out);
        Mat4.translate(out, out, this.position);
        Mat4.rotateX(out, out, this.rotation.x);
        Mat4.rotateY(out, out, this.rotation.y);
        Mat4.rotateZ(out, out, this.rotation.z);
        Mat4.scale(out, out, this.scale);
        return out;
    }
}
