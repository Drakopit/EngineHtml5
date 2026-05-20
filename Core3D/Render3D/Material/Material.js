export class Material {
    constructor({ name = "Material", transparent = false } = {}) {
        this.name = name;
        this.transparent = transparent;
        this.isMaterial3D = true;
    }
}
