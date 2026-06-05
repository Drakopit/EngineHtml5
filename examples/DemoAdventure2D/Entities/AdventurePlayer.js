import { GameObject } from "../../../src/Core2D/Objects/GameObject.js";
import {
    ActionInputComponent,
    BoundsComponent,
    HealthComponent,
    TransformComponent,
} from "../../../src/CoreCross/Component.js";
import { MeleeAttackComponent } from "../Components/MeleeAttackComponent.js";
import { TopDownActorRendererComponent } from "../Components/TopDownActorRendererComponent.js";
import { TopDownMovementComponent } from "../Components/TopDownMovementComponent.js";

export class AdventurePlayer extends GameObject {
    constructor({ x = 0, y = 0 } = {}) {
        super();
        this.name = "Adventure Hero";
        this.Tag = "Player";
        this.active = true;

        this.AddComponent(new TransformComponent({ x, y }));
        this.AddComponent(new BoundsComponent({
            width: 18,
            height: 18,
            offsetX: 7,
            offsetY: 14,
        }));
        this.AddComponent(new HealthComponent({ hp: 3, maxHp: 3, invulnerability: 0.35 }));
        this.AddComponent(new ActionInputComponent({
            actions: {
                left: "LEFT",
                right: "RIGHT",
                up: "UP",
                down: "DOWN",
                attack: "ATTACK",
            },
        }));
        this.AddComponent(new TopDownMovementComponent({ speed: 126, acceleration: 18 }));
        this.AddComponent(new MeleeAttackComponent({ damage: 1, range: 30 }));
        this.AddComponent(new TopDownActorRendererComponent({
            body: "#45a947",
            tunic: "#246f2d",
            kind: "hero",
        }));
    }
}
