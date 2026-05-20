import { Base } from "../../CoreCross/Base.js";
import { Draw } from "../Graphics/Draw.js";

export class Particle extends Base {
    constructor(x, y) {
        super();
        this.x = x;  // X position
        this.y = y;  // Y position
    }

    OnStart() {
        // Initialize the particle
        this.size = Math.random() * 5 + 1;
        this.velocityX = (Math.random() - 0.5) * 4;
        this.velocityY = (Math.random() - 0.5) * 4;
        this.lifeSpan = 100;
        this.alpha = 1;

        // Draw class
        this.draw = new Draw();
    }

    OnUpdate() {
        // Move the particle
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.alpha -= 0.01;  // Fade the particle over time
        this.lifeSpan -= 1;  // Decrease the lifespan
    }

    OnDrawn() {
        this.draw.Color = `rgba(255, 255, 255, ${this.alpha})`;
        this.draw.Circle(this.x, this.y, this.size);
        this.draw.Color = 'white';
    }

    isAlive() {
        return this.lifeSpan > 0 && this.alpha > 0;  // Check if particle is still alive
    }
}