import {
    BoundsComponent,
    Component,
    HealthComponent,
    TransformComponent,
} from "../../../src/CoreCross/Component.js";
import { MeleeAttackComponent } from "./MeleeAttackComponent.js";
import { TopDownMovementComponent } from "./TopDownMovementComponent.js";

export class TopDownActorRendererComponent extends Component {
    constructor({
        body = "#47a447",
        tunic = "#2d7a33",
        skin = "#f1c58e",
        outline = "#102018",
        kind = "hero",
    } = {}) {
        super();
        this.body = body;
        this.tunic = tunic;
        this.skin = skin;
        this.outline = outline;
        this.kind = kind;
        this.walkTime = 0;
    }

    OnUpdate(dt) {
        const movement = this.owner.GetComponent(TopDownMovementComponent);
        if (movement?.moving) this.walkTime += dt * 10;
    }

    OnDrawn() {
        const level = this.owner.level;
        const draw = level?.draw;
        const transform = this.owner.GetComponent(TransformComponent);
        const bounds = this.owner.GetComponent(BoundsComponent);
        if (!draw || !transform || !bounds || this.owner.active === false) return;

        if (this.kind === "slime") {
            this._drawSlime(draw, transform, bounds);
            return;
        }

        this._drawHero(draw, transform, bounds);
    }

    _drawHero(draw, transform, bounds) {
        const ctx = draw.screen.Context;
        const movement = this.owner.GetComponent(TopDownMovementComponent);
        const attack = this.owner.GetComponent(MeleeAttackComponent);
        const facing = movement?.facing ?? "down";
        const bob = movement?.moving ? Math.sin(this.walkTime) * 1.5 : 0;
        const x = Math.round(transform.x);
        const y = Math.round(transform.y + bob);

        draw.Style = draw.TYPES.FILLED;
        draw.Color = "rgba(0,0,0,0.25)";
        draw.DrawCircle(x + 16, y + 31, 13);

        draw.Color = this.outline;
        draw.DrawRect(x + 6, y + 8, 20, 25);

        draw.Color = this.tunic;
        draw.DrawRect(x + 8, y + 12, 16, 18);

        draw.Color = this.skin;
        draw.DrawRect(x + 9, y + 5, 14, 10);

        draw.Color = "#d7d2aa";
        draw.DrawRect(x + (facing === "left" ? 4 : facing === "right" ? 23 : 13), y + 16, 5, 12);

        draw.Color = "#274b24";
        draw.DrawRect(x + 7, y + 3, 18, 6);

        draw.Color = "#ffffff";
        if (facing === "left") draw.DrawRect(x + 9, y + 9, 3, 2);
        else if (facing === "right") draw.DrawRect(x + 20, y + 9, 3, 2);
        else {
            draw.DrawRect(x + 11, y + 9, 3, 2);
            draw.DrawRect(x + 19, y + 9, 3, 2);
        }

        if (attack?.IsActive()) {
            this._drawSword(ctx, draw, attack.GetAttackBox(), facing);
        }

        const hp = this.owner.GetComponent(HealthComponent);
        if (hp) this._drawHearts(draw, transform, hp);
    }

    _drawSword(ctx, draw, box, facing) {
        ctx.save();
        draw.Color = "rgba(245, 248, 255, 0.82)";

        if (facing === "left" || facing === "right") {
            draw.DrawRect(box.x, box.y + box.height / 2 - 3, box.width, 6);
        } else {
            draw.DrawRect(box.x + box.width / 2 - 3, box.y, 6, box.height);
        }

        draw.Color = "rgba(110, 180, 255, 0.35)";
        draw.DrawRect(box.x, box.y, box.width, box.height);
        ctx.restore();
    }

    _drawHearts(draw, transform, hp) {
        for (let i = 0; i < hp.maxHp; i++) {
            draw.Color = i < hp.hp ? "#d83a3a" : "#3c2323";
            draw.DrawRect(transform.x + i * 8, transform.y - 8, 6, 6);
        }
    }

    _drawSlime(draw, transform, bounds) {
        const health = this.owner.GetComponent(HealthComponent);
        const pulse = Math.sin(this.walkTime) * 1.5;
        const x = Math.round(transform.x);
        const y = Math.round(transform.y + pulse);

        draw.Style = draw.TYPES.FILLED;
        draw.Color = "rgba(0,0,0,0.22)";
        draw.DrawCircle(x + 14, y + 24, 13);

        draw.Color = health?.IsAlive?.() ? this.body : "#4b4b4b";
        draw.DrawRect(x + 3, y + 9, 24, 18);
        draw.DrawRect(x + 7, y + 5, 16, 10);

        draw.Color = "#e9fff2";
        draw.DrawRect(x + 8, y + 13, 3, 3);
        draw.DrawRect(x + 18, y + 13, 3, 3);
    }
}
