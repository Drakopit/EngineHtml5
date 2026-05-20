export class DirectionalLight3D {
    constructor({
        direction = [-0.35, 0.85, 0.45],
        color = [1.0, 0.96, 0.86],
        intensity = 0.75,
        ambientStrength = 0.35,
    } = {}) {
        this.direction = this.#normalize(direction);
        this.color = color;
        this.intensity = intensity;
        this.ambientStrength = ambientStrength;
    }

    SetDirection(direction) {
        this.direction = this.#normalize(direction);
    }

    GetUniforms() {
        return {
            direction: this.direction,
            color: this.color,
            intensity: this.intensity,
            ambientStrength: this.ambientStrength,
        };
    }

    #normalize(vector) {
        const [x, y, z] = vector;
        const length = Math.hypot(x, y, z) || 1;
        return [x / length, y / length, z / length];
    }
}
