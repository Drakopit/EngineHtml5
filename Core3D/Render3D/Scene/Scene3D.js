export class Scene3D {
    constructor({ backgroundColor = [0.03, 0.04, 0.07, 1] } = {}) {
        this.backgroundColor = [...backgroundColor];
        this.objects = [];
        this.lights = [];
        this.camera = null;
    }

    Add(item) {
        if (!item) return item;

        if (item.isCamera3D) {
            this.camera = item;
            return item;
        }

        if (item.isLight3D) {
            this.lights.push(item);
            return item;
        }

        this.objects.push(item);
        return item;
    }

    Remove(item) {
        this.objects = this.objects.filter(object => object !== item);
        this.lights = this.lights.filter(light => light !== item);
        if (this.camera === item) this.camera = null;
    }

    GetRenderableObjects() {
        return this.objects.filter(object => object?.visible !== false && object?.geometry);
    }

    GetLights(type = null) {
        return this.lights.filter(light => light.enabled !== false && (!type || light.type === type));
    }
}
