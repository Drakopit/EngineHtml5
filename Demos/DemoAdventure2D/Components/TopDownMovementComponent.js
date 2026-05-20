import {
    ActionInputComponent,
    BoundsComponent,
    Component,
    TransformComponent,
} from "../../../CoreCross/Component.js";

export class TopDownMovementComponent extends Component {
    constructor({ speed = 120, acceleration = 16 } = {}) {
        super();
        this.speed = speed;
        this.acceleration = acceleration;
        this.vx = 0;
        this.vy = 0;
        this.facing = "down";
        this.moving = false;
    }

    OnUpdate(dt) {
        const input = this.owner.GetComponent(ActionInputComponent);
        const transform = this.owner.GetComponent(TransformComponent);
        const bounds = this.owner.GetComponent(BoundsComponent);
        const level = this.owner.level;
        if (!input || !transform || !bounds || !level || level.IsInputLocked()) {
            this.vx = 0;
            this.vy = 0;
            this.moving = false;
            return;
        }

        const xAxis = Number(input.IsHeld("right")) - Number(input.IsHeld("left"));
        const yAxis = Number(input.IsHeld("down")) - Number(input.IsHeld("up"));
        const length = Math.hypot(xAxis, yAxis) || 1;
        const targetVx = (xAxis / length) * this.speed;
        const targetVy = (yAxis / length) * this.speed;

        this.vx = approach(this.vx, targetVx, this.acceleration * this.speed * dt);
        this.vy = approach(this.vy, targetVy, this.acceleration * this.speed * dt);
        this.moving = Math.abs(this.vx) > 1 || Math.abs(this.vy) > 1;

        if (Math.abs(xAxis) > Math.abs(yAxis)) {
            this.facing = xAxis > 0 ? "right" : xAxis < 0 ? "left" : this.facing;
        } else if (yAxis !== 0) {
            this.facing = yAxis > 0 ? "down" : "up";
        }

        this._moveAxis(transform, bounds, level, this.vx * dt, 0);
        this._moveAxis(transform, bounds, level, 0, this.vy * dt);
    }

    _moveAxis(transform, bounds, level, dx, dy) {
        if (dx === 0 && dy === 0) return;

        const nextX = transform.x + dx;
        const nextY = transform.y + dy;
        if (level.CanMove(this.owner, nextX, nextY, bounds)) {
            transform.SetPosition(nextX, nextY);
            return;
        }

        if (dx !== 0) this.vx = 0;
        if (dy !== 0) this.vy = 0;
    }
}

function approach(current, target, amount) {
    if (current < target) return Math.min(target, current + amount);
    if (current > target) return Math.max(target, current - amount);
    return target;
}
