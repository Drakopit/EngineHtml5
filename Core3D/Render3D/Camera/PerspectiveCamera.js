import { Mat4 } from "../../../CoreCross/Math/Mat4.js";

/**
 * Perspective camera holding view and projection matrices for Render3D.
 *
 * @param {Object} [options] - Projection and pose settings.
 * @param {number} [options.fov=60] - Vertical field of view in degrees.
 * @param {number} [options.aspect=1] - Viewport aspect ratio.
 * @param {number[]} [options.position] - Camera world position.
 * @param {number[]} [options.target] - Initial look-at target.
 */
export class PerspectiveCamera {
    constructor({
        fov = 60,
        aspect = 1,
        near = 0.1,
        far = 1000,
        position = [0, 4, 8],
        target = [0, 0, 0],
        up = [0, 1, 0],
    } = {}) {
        this.isCamera3D = true;
        this.fov = fov;
        this.aspect = aspect;
        this.near = near;
        this.far = far;
        this.position = [...position];
        this.target = [...target];
        this.up = [...up];
        this.viewMatrix = Mat4.create();
        this.projectionMatrix = Mat4.create();
        this.UpdateProjection(aspect);
        this.UpdateView();
    }

    /**
     * Sets world position and rebuilds the view matrix.
     * @param {number} x - World x coordinate.
     * @param {number} y - World y coordinate.
     * @param {number} z - World z coordinate.
     * @returns {PerspectiveCamera} This camera.
     */
    SetPosition(x, y, z) {
        this.position[0] = x;
        this.position[1] = y;
        this.position[2] = z;
        this.UpdateView();
        return this;
    }

    /**
     * Aims the camera at a world-space point.
     * @param {number[]} target - Three-component world position.
     * @returns {PerspectiveCamera} This camera.
     */
    LookAt(target) {
        this.target = [...target];
        this.UpdateView();
        return this;
    }

    UpdateProjection(aspect = this.aspect) {
        this.aspect = aspect || 1;
        Mat4.perspective(this.projectionMatrix, (this.fov * Math.PI) / 180, this.aspect, this.near, this.far);
        return this;
    }

    UpdateView() {
        Mat4.lookAt(this.viewMatrix, this.position, this.target, this.up);
        return this;
    }
}
