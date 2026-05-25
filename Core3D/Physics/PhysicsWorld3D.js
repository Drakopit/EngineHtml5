import { BoxCollider3D } from "./BoxCollider3D.js";
import { SphereCollider3D } from "./SphereCollider3D.js";

export class PhysicsWorld3D {
    constructor({ gravity = [0, -9.81, 0], bounds = null } = {}) {
        this.gravity = [...gravity];
        this.bounds = bounds;
        this.bodies = [];
    }

    AddBody({ object, rigidbody = null, collider = null, tag = "", enabled = true }) {
        const body = { object, rigidbody, collider, tag, enabled };
        this.bodies.push(body);
        return body;
    }

    RemoveBody(body) {
        this.bodies = this.bodies.filter(candidate => candidate !== body);
    }

    Step(dt) {
        const delta = Math.min(dt || 0.016, 0.05);
        const activeBodies = this.bodies.filter(body => body.enabled !== false);
        const dynamicBodies = activeBodies.filter(body => body.rigidbody && !body.rigidbody.isKinematic);
        const staticBodies = activeBodies.filter(body => !body.rigidbody || body.rigidbody.isKinematic);

        dynamicBodies.forEach(body => {
            body.rigidbody.grounded = false;
            body.rigidbody.groundBody = null;
            body.rigidbody.Integrate(body.object.transform ?? body.object, delta, this.gravity);
            this.#resolveBounds(body);
        });

        dynamicBodies.forEach(body => {
            staticBodies.forEach(staticBody => this.#resolvePair(body, staticBody));
        });
    }

    #resolveBounds(body) {
        if (!this.bounds || !(body.collider instanceof SphereCollider3D)) return;

        const transform = body.object.transform ?? body.object;
        const radius = body.collider.radius;
        transform.position[0] = clamp(transform.position[0], this.bounds.minX + radius, this.bounds.maxX - radius);
        transform.position[2] = clamp(transform.position[2], this.bounds.minZ + radius, this.bounds.maxZ - radius);
    }

    #resolvePair(dynamicBody, staticBody) {
        if (dynamicBody.collider instanceof SphereCollider3D && staticBody.collider instanceof BoxCollider3D) {
            this.#resolveSphereBox(dynamicBody, staticBody);
        }
    }

    #resolveSphereBox(sphereBody, boxBody) {
        const sphereTransform = sphereBody.object.transform ?? sphereBody.object;
        const boxTransform = boxBody.object.transform ?? boxBody.object;
        const center = sphereBody.collider.GetCenter(sphereTransform);
        const bounds = boxBody.collider.GetBounds(boxTransform);

        const closest = [
            clamp(center[0], bounds.min[0], bounds.max[0]),
            clamp(center[1], bounds.min[1], bounds.max[1]),
            clamp(center[2], bounds.min[2], bounds.max[2]),
        ];
        const dx = center[0] - closest[0];
        const dy = center[1] - closest[1];
        const dz = center[2] - closest[2];
        const distanceSq = dx * dx + dy * dy + dz * dz;
        const radius = sphereBody.collider.radius;

        if (distanceSq > radius * radius) return;

        const rb = sphereBody.rigidbody;
        const distance = Math.sqrt(distanceSq) || 0.0001;
        let nx = dx / distance;
        let ny = dy / distance;
        let nz = dz / distance;

        if (distanceSq < 0.000001) {
            const penetrationTop = Math.abs(center[1] - bounds.max[1]);
            const penetrationBottom = Math.abs(center[1] - bounds.min[1]);
            ny = penetrationTop <= penetrationBottom ? 1 : -1;
            nx = 0;
            nz = 0;
        }

        const penetration = radius - distance;
        sphereTransform.position[0] += nx * penetration;
        sphereTransform.position[1] += ny * penetration;
        sphereTransform.position[2] += nz * penetration;

        const velocityAlongNormal = rb.velocity[0] * nx + rb.velocity[1] * ny + rb.velocity[2] * nz;
        if (velocityAlongNormal < 0) {
            rb.velocity[0] -= (1 + rb.bounciness) * velocityAlongNormal * nx;
            rb.velocity[1] -= (1 + rb.bounciness) * velocityAlongNormal * ny;
            rb.velocity[2] -= (1 + rb.bounciness) * velocityAlongNormal * nz;
        }

        if (ny > 0.55) {
            rb.grounded = true;
            rb.groundBody = boxBody;
            rb.velocity[1] = Math.max(0, rb.velocity[1]);
        }
    }
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}
