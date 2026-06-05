import { Level } from "../../packages/core/index.js";
import { GameObject } from "../../packages/2d/index.js";

export class MyFirstLevel extends Level {
    constructor() {
        super();
        this.caption = "My First Level";
    }

    OnStart() {
        super.OnStart();

        const player = new GameObject();
        player.name = "Player";
        player.position.SetValue(200, 300);

        this.AddEntity(player);
    }
}
