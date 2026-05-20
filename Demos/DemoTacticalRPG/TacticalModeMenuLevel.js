import { Level } from "../../CoreCross/Level/Level.js";
import { Screen } from "../../Core2D/Window/Screen.js";
import { Draw } from "../../Core2D/Graphics/Draw.js";
import { ActionManager } from "../../CoreCross/Input/ActionManager.js";
import { BATTLE_MODES, BattleState } from "./BattleState.js";

const W = 640;
const H = 480;

export class TacticalModeMenuLevel extends Level {
    constructor() {
        super();
        this.caption = "Tactical RPG - Battle Mode";
        this.TelaId = "TacticalModeMenu";
        this.options = [
            {
                mode: BATTLE_MODES.FIRE_EMBLEM,
                title: "Fire Emblem",
                subtitle: "Arena curta; volta ao mapa apos a troca.",
            },
            {
                mode: BATTLE_MODES.FINAL_FANTASY_TACTICS,
                title: "Final Fantasy Tactics",
                subtitle: "Ataque e magia acontecem direto na grade.",
            },
        ];
        this.selected = 0;
    }

    OnStart() {
        this.screen = new Screen("TacticalModeMenu", W, H);
        this.draw = new Draw(this.screen);
        this.selected = BattleState.battleMode === BATTLE_MODES.FINAL_FANTASY_TACTICS ? 1 : 0;
        super.OnStart();
    }

    OnExit() {
        if (this.screen?.Canvas) this.screen.Canvas.remove();
    }

    OnUpdate(dt) {
        super.OnUpdate(dt);

        if (ActionManager.IsActionDown("UP")) {
            this.selected = (this.selected - 1 + this.options.length) % this.options.length;
        }

        if (ActionManager.IsActionDown("DOWN")) {
            this.selected = (this.selected + 1) % this.options.length;
        }

        if (ActionManager.IsActionDown("ATTACK")) {
            BattleState.SetBattleMode(this.options[this.selected].mode);
            this.Next = true;
        }
    }

    OnDrawn() {
        this.screen.Refresh();
        const ctx = this.screen.Context;

        const bg = ctx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, "#101820");
        bg.addColorStop(0.55, "#18251f");
        bg.addColorStop(1, "#0a0d12");
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);

        this.draw.Style = this.draw.TYPES.FILLED;
        this.draw.Color = "#FFFFFF";
        this.draw.Font = "monospace";
        this.draw.SetTextAlign("center");
        this.draw.FontSize = "26px";
        this.draw.DrawText("TACTICAL RPG", W / 2, 72);

        this.draw.FontSize = "13px";
        this.draw.Color = "#B8C7B0";
        this.draw.DrawText("Escolha como a batalha sera resolvida", W / 2, 100);

        for (let i = 0; i < this.options.length; i++) {
            this._drawOption(i);
        }

        this.draw.FontSize = "11px";
        this.draw.Color = "#889688";
        this.draw.DrawText("Setas: escolher | Z / A: confirmar", W / 2, H - 34);
    }

    _drawOption(index) {
        const option = this.options[index];
        const selected = index === this.selected;
        const x = 86;
        const y = 150 + index * 118;
        const w = W - 172;
        const h = 86;

        this.draw.Style = this.draw.TYPES.FILLED;
        this.draw.Color = selected ? "rgba(255, 216, 74, 0.18)" : "rgba(0, 0, 0, 0.45)";
        this.draw.DrawRect(x, y, w, h);

        this.draw.Style = this.draw.TYPES.STROKED;
        this.draw.Color = selected ? "#FFD84A" : "#425044";
        this.draw.DrawRect(x, y, w, h);

        this.draw.Style = this.draw.TYPES.FILLED;
        this.draw.SetTextAlign("left");
        this.draw.Font = "monospace";
        this.draw.FontSize = "18px";
        this.draw.Color = selected ? "#FFD84A" : "#FFFFFF";
        this.draw.DrawText(`${selected ? "> " : "  "}${option.title}`, x + 20, y + 32);

        this.draw.FontSize = "12px";
        this.draw.Color = "#CBD6C7";
        this.draw.DrawText(option.subtitle, x + 20, y + 58);
    }
}
