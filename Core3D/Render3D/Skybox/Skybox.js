export class Skybox {
    constructor({ image = null, name = "Skybox" } = {}) {
        this.isSkybox3D = true;
        this.name = name;
        this.image = image;
    }

    static FromImage(image, options = {}) {
        return new Skybox({ ...options, image });
    }
}
