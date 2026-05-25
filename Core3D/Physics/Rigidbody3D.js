export class Rigidbody3D {
    constructor({
        mass = 1,
        velocity = [0, 0, 0],
        acceleration = [0, 0, 0],
        useGravity = true,
        isKinematic = false,
        damping = 0.96,
        bounciness = 0.0,
    } = {}) {
        this.mass = Math.max(0.0001, mass);
        this.velocity = [...velocity];
        this.acceleration = [...acceleration];
        this.useGravity = useGravity;
        this.isKinematic = isKinematic;
        this.damping = damping;
        this.bounciness = bounciness;
        this.grounded = false;
        this.groundBody = null;
    }

    AddForce(force) {
        this.acceleration[0] += (force[0] ?? 0) / this.mass;
        this.acceleration[1] += (force[1] ?? 0) / this.mass;
        this.acceleration[2] += (force[2] ?? 0) / this.mass;
    }

    Integrate(transform, dt, gravity) {
        if (this.isKinematic) return;

        const gx = this.useGravity ? gravity[0] : 0;
        const gy = this.useGravity ? gravity[1] : 0;
        const gz = this.useGravity ? gravity[2] : 0;

        this.velocity[0] += (this.acceleration[0] + gx) * dt;
        this.velocity[1] += (this.acceleration[1] + gy) * dt;
        this.velocity[2] += (this.acceleration[2] + gz) * dt;

        const drag = Math.pow(this.damping, dt * 60);
        this.velocity[0] *= drag;
        this.velocity[2] *= drag;

        transform.position[0] += this.velocity[0] * dt;
        transform.position[1] += this.velocity[1] * dt;
        transform.position[2] += this.velocity[2] * dt;

        this.acceleration[0] = 0;
        this.acceleration[1] = 0;
        this.acceleration[2] = 0;
    }
}
