import { Transform3D } from "../Core/Transform3D.js";
import { StandardMaterial } from "../Material/StandardMaterial.js";

export class Mesh {
    constructor({
        name = "Mesh",
        geometry = null,
        material = new StandardMaterial(),
        transform = new Transform3D(),
        castShadow = true,
        receiveShadow = true,
        visible = true,
    } = {}) {
        this.name = name;
        this.geometry = geometry;
        this.material = material;
        this.transform = transform;
        this.castShadow = castShadow;
        this.receiveShadow = receiveShadow;
        this.visible = visible;
    }

    static FromGeometry(geometry, material = new StandardMaterial(), options = {}) {
        return new Mesh({ ...options, geometry, material });
    }
}
