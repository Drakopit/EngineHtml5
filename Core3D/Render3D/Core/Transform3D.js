import { Mat4 } from "../../../CoreCross/Math/Mat4.js";

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
