/**
 * Small dynamic-body state component integrated by `PhysicsWorld3D`.
 *
 * @param {Object} [options] - Body settings.
 * @param {number} [options.mass=1] - Body mass used for forces.
 * @param {number[]} [options.velocity] - Initial velocity.
 * @param {boolean} [options.useGravity=true] - Whether gravity affects this body.
 * @param {boolean} [options.isKinematic=false] - Whether game code controls motion.
 * @param {number} [options.damping=0.96] - Horizontal velocity retention.
 */
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

    /**
     * Accumulates a force until the next integration step.
     * @param {number[]} force - XYZ force.
     * @returns {void}
     */
    AddForce(force) {
        this.acceleration[0] += (force[0] ?? 0) / this.mass;
        this.acceleration[1] += (force[1] ?? 0) / this.mass;
        this.acceleration[2] += (force[2] ?? 0) / this.mass;
    }

    /**
     * Advances velocity and position for one simulation step.
     * @param {Transform3D} transform - Mutated object transform.
     * @param {number} dt - Delta time in seconds.
     * @param {number[]} gravity - World gravity vector.
     * @returns {void}
     */
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
