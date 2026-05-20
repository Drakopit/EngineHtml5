import { Draw } from "../../Core2D/Graphics/Draw.js";
import { AssetManager } from "../../CoreCross/Assets/AssetManager.js";
import { Level } from "../../CoreCross/Level/Level.js";
import { Screen } from "../../Core2D/Window/Screen.js";
import { TacticalBattleManager } from "./Tactical/TacticalBattleManager.js";

const W = 640;
const H = 480;

export class TacticalMapLevel extends Level {
    constructor() {
        super();
        this.caption = "Tactical RPG - Tactical Map";
        this.TelaId = "TacticalMap";
    }

    OnStart() {
        this.screen = new Screen("TacticalMap", W, H);
        this.draw = new Draw(this.screen);
        this.assets = AssetManager.instance;
        this.battle = new TacticalBattleManager({
            level: this,
            assets: this.assets,
        });
        this.entities = this.battle.Entities;
        this.entities.forEach(entity => {
            entity.level = this;
        });
        super.OnStart();
    }

    OnExit() {
        if (this.screen?.Canvas) this.screen.Canvas.remove();
    }

    OnUpdate(dt) {
        super.OnUpdate(dt);
        const flow = this.battle.Update(dt);
        if (flow?.next) this.Next = true;
    }

    OnDrawn() {
        this.screen.Refresh();
        this.battle.Draw();
    }

    OnGUI() {
        this.battle.DrawHud(this.FPS);
    }
}
