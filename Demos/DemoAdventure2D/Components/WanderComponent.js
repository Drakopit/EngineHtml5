import {
    BoundsComponent,
    Component,
    TransformComponent,
} from "../../../CoreCross/Component.js";

export class WanderComponent extends Component {
    constructor({ speed = 38, changeEvery = 1.2 } = {}) {
        super();
        this.speed = speed;
        this.changeEvery = changeEvery;
        this.timer = 0;
        this.dx = 0;
        this.dy = 0;
    }

    OnUpdate(dt) {
        if (this.owner.active === false || this.owner.level?.IsInputLocked()) return;

        this.timer -= dt;
        if (this.timer <= 0) {
            this.timer = this.changeEvery + Math.random() * 0.9;
            const angle = Math.floor(Math.random() * 4);
            this.dx = angle === 0 ? -1 : angle === 1 ? 1 : 0;
            this.dy = angle === 2 ? -1 : angle === 3 ? 1 : 0;
        }

        const transform = this.owner.GetComponent(TransformComponent);
        const bounds = this.owner.GetComponent(BoundsComponent);
        if (!transform || !bounds) return;

        const nextX = transform.x + this.dx * this.speed * dt;
        const nextY = transform.y + this.dy * this.speed * dt;
        if (this.owner.level.CanMove(this.owner, nextX, nextY, bounds)) {
            transform.SetPosition(nextX, nextY);
            return;
        }

        this.timer = 0;
    }
}
