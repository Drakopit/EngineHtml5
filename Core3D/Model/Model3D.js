import { Transform3D } from "../Render3D/index.js";

export class Model3D {
    constructor(meshes = []) {
        this.meshes = meshes;
        this.transform = new Transform3D();
    }

    AddTo(scene) {
        this.meshes.forEach(mesh => scene.Add(mesh));
        this.ApplyTransform();
        return this;
    }

    SetPosition(x, y, z) {
        this.transform.SetPosition(x, y, z);
        this.ApplyTransform();
        return this;
    }

    SetRotation(x, y, z) {
        this.transform.SetRotation(x, y, z);
        this.ApplyTransform();
        return this;
    }

    SetScale(x, y = x, z = x) {
        this.transform.SetScale(x, y, z);
        this.ApplyTransform();
        return this;
    }

    ApplyTransform() {
        this.meshes.forEach(mesh => {
            mesh.transform.position = [...this.transform.position];
            mesh.transform.rotation = { ...this.transform.rotation };
            mesh.transform.scale = [...this.transform.scale];
        });
    }
}
