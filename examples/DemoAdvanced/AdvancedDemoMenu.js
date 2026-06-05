import { Level } from "../../src/CoreCross/Level/Level.js";
import { Draw } from "../../src/Core2D/Graphics/Draw.js";
import { ActionManager } from "../../src/CoreCross/Input/ActionManager.js";
import { AssetManager } from "../../src/CoreCross/Assets/AssetManager.js";
import { Screen } from "../../src/Core2D/Window/Screen.js";
import { AdvancedDemoProgress } from "./AdvancedDemoProgress.js";

const MENU_OPTIONS = [
    { label: "Iniciar campanha", action: "start" },
    { label: "Selecionar fase", action: "selector" },
    { label: "Resetar progresso", action: "reset" },
];

export class AdvancedDemoMenu extends Level {
    constructor() {
        super();
        this.caption = "GameForgeJS - Advanced Demo";
        this.TelaId = "AdvancedDemoMenu";
        this.currentSelected = 0;
        this.feedback = "";
        this.feedbackTimer = 0;
    }

    OnStart() {
        this.currentSelected = 0;
        this.feedback = "";
        this.feedbackTimer = 0;
        this.screen = new Screen(this.TelaId, 640, 480);
        this.draw = new Draw(this.screen);
        super.OnStart();
    }

    OnUpdate(dt) {
        if (ActionManager.IsActionDown("UP")) {
            this.currentSelected = (this.currentSelected + MENU_OPTIONS.length - 1) % MENU_OPTIONS.length;
        }

        if (ActionManager.IsActionDown("DOWN")) {
            this.currentSelected = (this.currentSelected + 1) % MENU_OPTIONS.length;
        }

        if (ActionManager.IsActionDown("ATTACK")) {
            this.ActivateCurrentOption();
        }

        this.feedbackTimer = Math.max(0, this.feedbackTimer - (dt ?? 0.016));
    }

    ActivateCurrentOption() {
        const option = MENU_OPTIONS[this.currentSelected];

        if (option.action === "reset") {
            AdvancedDemoProgress.Reset();
            this.feedback = "Progresso reiniciado";
            this.feedbackTimer = 1.2;
            return;
        }

        AdvancedDemoProgress.GoToPhaseSelector(this);
    }

    OnDrawn() {
        if (!this.screen) return;

        this.screen.Refresh();
        this.DrawBackdrop();
        this.DrawTitle();
        this.DrawOptions();
        this.DrawFooter();
    }

    DrawBackdrop() {
        const ctx = this.screen.Context;
        const sky = AssetManager.instance.HasImage("snow_sky")
            ? AssetManager.instance.GetImage("snow_sky")
            : null;

        ctx.fillStyle = "#57508D";
        ctx.fillRect(0, 0, this.screen.width, this.screen.height);

        if (sky) {
            this.draw.DrawSpriteStretched(sky, 0, 0, this.screen.width, this.screen.height);
        }

        this.DrawBackgroundSprite("snow_mountain_02", 0, 110, 374, 158, 0.85);
        this.DrawBackgroundSprite("snow_mountain_01", 60, 170, 638, 176, 0.95);

        ctx.fillStyle = "rgba(15, 18, 36, 0.45)";
        ctx.fillRect(0, 0, this.screen.width, this.screen.height);
    }

    DrawBackgroundSprite(spriteName, x, y, width, height, alpha = 1) {
        if (!AssetManager.instance.HasImage(spriteName)) return;

        const ctx = this.screen.Context;
        ctx.save();
        ctx.globalAlpha = alpha;
        this.draw.DrawSpriteStretched(AssetManager.instance.GetImage(spriteName), x, y, width, height);
        ctx.restore();
    }

    DrawTitle() {
        this.draw.SetTextAlign("center");
        this.draw.Font = "Arial";
        this.draw.FontSize = "18px";
        this.draw.Color = "#BDE6FF";
        this.draw.DrawText("GAMEFORGEJS", 320, 92);

        this.draw.FontSize = "38px";
        this.draw.Color = "#FFFFFF";
        this.draw.DrawText("ADVANCED DEMO", 320, 135);

        this.draw.FontSize = "16px";
        this.draw.Color = "#D8E8FF";
        this.draw.DrawText("Campanha Snow Pack", 320, 164);
    }

    DrawOptions() {
        const ctx = this.screen.Context;
        const startY = 230;
        const optionWidth = 270;
        const optionHeight = 42;
        const gap = 14;
        const x = (this.screen.width - optionWidth) / 2;

        MENU_OPTIONS.forEach((option, index) => {
            const y = startY + index * (optionHeight + gap);
            const selected = index === this.currentSelected;

            ctx.fillStyle = selected ? "rgba(255, 255, 255, 0.22)" : "rgba(10, 14, 28, 0.72)";
            ctx.strokeStyle = selected ? "#F4D26A" : "rgba(255, 255, 255, 0.22)";
            ctx.lineWidth = selected ? 3 : 2;
            this.RoundRect(ctx, x, y, optionWidth, optionHeight, 8);
            ctx.fill();
            ctx.stroke();

            this.draw.SetTextAlign("center");
            this.draw.Font = "Arial";
            this.draw.FontSize = "17px";
            this.draw.Color = selected ? "#FFFFFF" : "#C9D8F4";
            this.draw.DrawText(option.label, 320, y + 27);
        });
    }

    DrawFooter() {
        if (this.feedbackTimer <= 0) return;

        this.draw.SetTextAlign("center");
        this.draw.Font = "Arial";
        this.draw.FontSize = "13px";
        this.draw.Color = "#9FE8B2";
        this.draw.DrawText(this.feedback, 320, 426);
    }

    RoundRect(ctx, x, y, width, height, radius) {
        const r = Math.min(radius, width / 2, height / 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + width - r, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + r);
        ctx.lineTo(x + width, y + height - r);
        ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
        ctx.lineTo(x + r, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    OnExit() {
        if (this.screen?.Canvas) this.screen.Canvas.remove();
    }
}
