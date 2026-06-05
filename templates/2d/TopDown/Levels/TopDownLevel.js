import { Level } from "../../packages/core/index.js";
import { GameObject } from "../../packages/2d/index.js";

export class TopDownLevel extends Level {
    constructor() {
        super();
        this.caption = "Top-Down Example - Village";
    }

    OnStart() {
        super.OnStart();

        const player = new GameObject();
        player.name = "Player";
        player.position.SetValue(400, 300);

        this.AddEntity(player);
    }
}