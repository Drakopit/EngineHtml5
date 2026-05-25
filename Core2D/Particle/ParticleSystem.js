import { Base } from "../../CoreCross/Base.js";
import { Particle } from "./Particle.js";

/**
 * Collection that emits, updates and draws simple `Particle` instances.
 */
export class ParticleSystem extends Base {
    constructor() {
        super();
        this.particles = [];
    }

    Emit(x, y) {
        // Emit a particle from position (x, y)
        this.particles.push(new Particle(x, y));
    }

    OnUpdate() {
        // Update all particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].OnUpdate();
            // Remove dead particles
            if (!this.particles[i].isAlive()) {
                this.particles.splice(i, 1);
            }
        }
    }

    OnDrawn() {
        // Draw all particles
        for (let particle of this.particles) {
            particle.OnDrawn();
        }
    }
}
