import {
    ActionInputComponent,
    BoundsComponent,
    Component,
    TransformComponent,
} from "../../../CoreCross/Component.js";
import { TopDownMovementComponent } from "./TopDownMovementComponent.js";

export class MeleeAttackComponent extends Component {
    constructor({
        damage = 1,
        range = 28,
        duration = 0.18,
        cooldown = 0.32,
    } = {}) {
        super();
        this.damage = damage;
        this.range = range;
        this.duration = duration;
        this.cooldown = cooldown;
        this.timer = 0;
        this.cooldownTimer = 0;
        this.hitIds = new Set();
    }

    OnUpdate(dt) {
        const input = this.owner.GetComponent(ActionInputComponent);
        if (!input) return;

        this.timer = Math.max(0, this.timer - dt);
        this.cooldownTimer = Math.max(0, this.cooldownTimer - dt);

        if (this.timer > 0) {
            this.owner.level?.ResolveMeleeAttack(this.owner, this.GetAttackBox(), this);
            return;
        }

        if (this.cooldownTimer <= 0 && input.IsDown("attack") && !this.owner.level?.IsInputLocked()) {
            this.StartAttack();
        }
    }

    StartAttack() {
        this.timer = this.duration;
        this.cooldownTimer = this.cooldown;
        this.hitIds.clear();
        this.owner.level?.ResolveMeleeAttack(this.owner, this.GetAttackBox(), this);
    }

    IsActive() {
        return this.timer > 0;
    }

    GetAttackBox() {
        const transform = this.owner.GetComponent(TransformComponent);
        const bounds = this.owner.GetComponent(BoundsComponent);
        const movement = this.owner.GetComponent(TopDownMovementComponent);
        const facing = movement?.facing ?? "down";
        const body = bounds.GetAABB();
        const thickness = Math.max(body.width, body.height);

        if (facing === "left") {
            return {
                x: body.x - this.range,
                y: body.y - 4,
                width: this.range,
                height: thickness + 8,
            };
        }

        if (facing === "right") {
            return {
                x: body.x + body.width,
                y: body.y - 4,
                width: this.range,
                height: thickness + 8,
            };
        }

        if (facing === "up") {
            return {
                x: body.x - 4,
                y: body.y - this.range,
                width: thickness + 8,
                height: this.range,
            };
        }

        return {
            x: body.x - 4,
            y: body.y + body.height,
            width: thickness + 8,
            height: this.range,
        };
    }

    HasHit(target) {
        return this.hitIds.has(target.id);
    }

    MarkHit(target) {
        this.hitIds.add(target.id);
    }
}
