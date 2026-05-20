import { GameObject } from "../../../Core2D/Objects/GameObject.js";
import {
    BoundsComponent,
    HealthComponent,
    TransformComponent,
} from "../../../CoreCross/Component.js";
import { TopDownActorRendererComponent } from "../Components/TopDownActorRendererComponent.js";
import { WanderComponent } from "../Components/WanderComponent.js";

export class Slime extends GameObject {
    constructor({ x = 0, y = 0, roomId = "" } = {}) {
        super();
        this.name = "Slime";
        this.Tag = "Enemy";
        this.roomId = roomId;
        this.active = true;

        this.AddComponent(new TransformComponent({ x, y }));
        this.AddComponent(new BoundsComponent({
            width: 22,
            height: 16,
            offsetX: 4,
            offsetY: 12,
        }));
        this.AddComponent(new HealthComponent({ hp: 2, maxHp: 2 }));
        this.AddComponent(new WanderComponent({ speed: 34, changeEvery: 1.1 }));
        this.AddComponent(new TopDownActorRendererComponent({
            body: "#6bd34d",
            kind: "slime",
        }));
    }

    OnDeath() {
        this.active = false;
    }
}
