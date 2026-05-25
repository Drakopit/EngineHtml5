import { Level } from "../../CoreCross/Level/Level.js";
import { Draw } from "../../Core2D/Graphics/Draw.js";
import { ActionManager } from "../../CoreCross/Input/ActionManager.js";
import { AssetManager } from "../../CoreCross/Assets/AssetManager.js";
import { Screen } from "../../Core2D/Window/Screen.js";
import { ADVANCED_DEMO_FLOW, ADVANCED_DEMO_PHASES, AdvancedDemoProgress } from "./AdvancedDemoProgress.js";

export class AdvancedDemoPhaseSelector extends Level {
    constructor() {
        super();
        this.caption = "GameForgeJS - Advanced Demo: Selecao de Fases";
        this.TelaId = "AdvancedDemoPhaseSelector";
        this.selectedIndex = 0;
        this.progress = AdvancedDemoProgress.Load();
        this.feedback = "";
        this.feedbackTimer = 0;
    }

    OnStart() {
        this.screen = new Screen(this.TelaId, 640, 480);
        this.draw = new Draw(this.screen);
        this.progress = AdvancedDemoProgress.Load();
        this.selectedIndex = this.FindFirstUnlockedIndex();
        this.feedback = "";
        this.feedbackTimer = 0;
        super.OnStart();
    }

    FindFirstUnlockedIndex() {
        const index = ADVANCED_DEMO_PHASES.findIndex(phase => this.IsUnlocked(phase.id));
        return Math.max(0, index);
    }

    OnUpdate(dt) {
        if (ActionManager.IsActionDown("LEFT") || ActionManager.IsActionDown("UP")) {
            this.selectedIndex = (this.selectedIndex + ADVANCED_DEMO_PHASES.length - 1) % ADVANCED_DEMO_PHASES.length;
        }

        if (ActionManager.IsActionDown("RIGHT") || ActionManager.IsActionDown("DOWN")) {
            this.selectedIndex = (this.selectedIndex + 1) % ADVANCED_DEMO_PHASES.length;
        }

        if (ActionManager.IsActionDown("CANCEL")) {
            AdvancedDemoProgress.GoToMenu(this);
        }

        if (ActionManager.IsActionDown("ATTACK")) {
            this.TryStartSelectedPhase();
        }

        this.feedbackTimer = Math.max(0, this.feedbackTimer - (dt ?? 0.016));
    }

    TryStartSelectedPhase() {
        const phase = ADVANCED_DEMO_PHASES[this.selectedIndex];

        if (!this.IsUnlocked(phase.id)) {
            const required = AdvancedDemoProgress.GetPhase(phase.requires);
            this.feedback = required ? `Complete ${required.title}` : "Fase bloqueada";
            this.feedbackTimer = 1.1;
            return;
        }

        AdvancedDemoProgress.GoToIndex(this, phase.levelIndex);
    }

    IsUnlocked(phaseId) {
        return this.progress.unlocked.includes(phaseId);
    }

    IsCompleted(phaseId) {
        return this.progress.completed.includes(phaseId);
    }

    OnDrawn() {
        if (!this.screen) return;

        this.screen.Refresh();
        this.DrawBackdrop();
        this.DrawHeader();
        this.DrawPhasePath();
        this.DrawFeedback();
    }

    DrawBackdrop() {
        const ctx = this.screen.Context;
        ctx.fillStyle = "#57508D";
        ctx.fillRect(0, 0, this.screen.width, this.screen.height);

        this.DrawBackgroundSprite("snow_sky", 0, 0, 640, 480, 1);
        this.DrawBackgroundSprite("snow_mountain_02", 0, 118, 374, 158, 0.75);
        this.DrawBackgroundSprite("snow_mountain_01", 78, 172, 638, 176, 0.9);

        ctx.fillStyle = "rgba(8, 11, 24, 0.48)";
        ctx.fillRect(0, 0, this.screen.width, this.screen.height);
    }

    DrawBackgroundSprite(spriteName, x, y, width, height, alpha) {
        if (!AssetManager.instance.HasImage(spriteName)) return;

        const ctx = this.screen.Context;
        ctx.save();
        ctx.globalAlpha = alpha;
        this.draw.DrawSpriteStretched(AssetManager.instance.GetImage(spriteName), x, y, width, height);
        ctx.restore();
    }

    DrawHeader() {
        this.draw.SetTextAlign("center");
        this.draw.Font = "Arial";
        this.draw.FontSize = "14px";
        this.draw.Color = "#BDE6FF";
        this.draw.DrawText("SELECAO DE FASES", 320, 72);

        this.draw.FontSize = "30px";
        this.draw.Color = "#FFFFFF";
        this.draw.DrawText("Rota do Norte", 320, 110);
    }

    DrawPhasePath() {
        const ctx = this.screen.Context;
        const startX = 86;
        const y = 205;
        const cardWidth = 142;
        const cardHeight = 156;
        const gap = 42;

        ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(startX + cardWidth, y + cardHeight / 2);
        ctx.lineTo(startX + cardWidth + gap, y + cardHeight / 2);
        ctx.moveTo(startX + (cardWidth + gap) * 2 - gap, y + cardHeight / 2);
        ctx.lineTo(startX + (cardWidth + gap) * 2, y + cardHeight / 2);
        ctx.stroke();

        ADVANCED_DEMO_PHASES.forEach((phase, index) => {
            const x = startX + index * (cardWidth + gap);
            this.DrawPhaseCard(phase, index, x, y, cardWidth, cardHeight);
        });
    }

    DrawPhaseCard(phase, index, x, y, width, height) {
        const ctx = this.screen.Context;
        const selected = this.selectedIndex === index;
        const unlocked = this.IsUnlocked(phase.id);
        const completed = this.IsCompleted(phase.id);

        ctx.fillStyle = unlocked ? "rgba(13, 19, 36, 0.82)" : "rgba(14, 16, 24, 0.72)";
        ctx.strokeStyle = selected ? "#F4D26A" : completed ? "#7AE092" : "rgba(255, 255, 255, 0.25)";
        ctx.lineWidth = selected ? 3 : 2;
        this.RoundRect(ctx, x, y, width, height, 8);
        ctx.fill();
        ctx.stroke();

        this.draw.SetTextAlign("center");
        this.draw.Font = "Arial";
        this.draw.FontSize = "15px";
        this.draw.Color = unlocked ? "#FFFFFF" : "#8F98AB";
        this.draw.DrawText(phase.title, x + width / 2, y + 38);

        this.draw.FontSize = "12px";
        this.draw.Color = unlocked ? "#BFD6FF" : "#6F7787";
        this.draw.DrawText(phase.subtitle, x + width / 2, y + 62);

        const status = completed ? "CONCLUIDA" : unlocked ? "LIBERADA" : "BLOQUEADA";
        this.draw.FontSize = "12px";
        this.draw.Color = completed ? "#7AE092" : unlocked ? "#F4D26A" : "#B7BDCA";
        this.draw.DrawText(status, x + width / 2, y + 118);

        if (!unlocked && phase.requires) {
            const required = AdvancedDemoProgress.GetPhase(phase.requires);
            this.draw.FontSize = "10px";
            this.draw.Color = "#AEB7C8";
            this.draw.DrawText(required ? `Requer ${required.title}` : "Requer progresso", x + width / 2, y + 138);
        }
    }

    DrawFeedback() {
        if (this.feedbackTimer <= 0) return;

        this.draw.SetTextAlign("center");
        this.draw.Font = "Arial";
        this.draw.FontSize = "13px";
        this.draw.Color = "#F4D26A";
        this.draw.DrawText(this.feedback, 320, 420);
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
