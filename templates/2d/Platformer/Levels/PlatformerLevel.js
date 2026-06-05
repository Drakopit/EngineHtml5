import { Level } from "../../packages/core/index.js";
import { GameObject } from "../../packages/2d/index.js";

export class PlatformerLevel extends Level {
    constructor() {
        super();
        this.caption = "Platformer Example - Level 1";
    }

    OnStart() {
        super.OnStart();

        // In a real game you would load from manifests
        const player = new GameObject();
        player.name = "Player";
        player.position.SetValue(200, 400);

        this.AddEntity(player);
    }
}