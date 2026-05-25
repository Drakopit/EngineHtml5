import { Level } from "../../CoreCross/Level/Level.js";
import { Draw } from "../../Core2D/Graphics/Draw.js";
import { ActionManager } from "../../CoreCross/Input/ActionManager.js";
import { AssetManager } from "../../CoreCross/Assets/AssetManager.js";
import { Screen } from "../../Core2D/Window/Screen.js";
import { AdvancedDemoProgress } from "./AdvancedDemoProgress.js";

const RESULT_SCREEN = Object.freeze({
    width: 640,
    height: 480,
    centerX: 320,
});

const RESULT_LAYOUT = Object.freeze({
    bandY: 88,
    bandHeight: 286,
    eyebrowY: 124,
    titleY: 174,
    subtitleY: 210,
    creditsTitleY: 238,
    creditsStartY: 265,
    creditsLineHeight: 23,
    continueX: 245,
    continueY: 398,
    continueWidth: 150,
    continueHeight: 38,
    continueTextY: 423,
    maxTextWidth: 560,
});

const SNOW_PARTICLES = Object.freeze([
    { x: 38, y: 58, size: 1.8, drift: 10, speed: 0.7 },
    { x: 94, y: 146, size: 1.2, drift: 7, speed: 1.1 },
    { x: 150, y: 34, size: 1.6, drift: 13, speed: 0.8 },
    { x: 216, y: 398, size: 1.4, drift: 8, speed: 1.0 },
    { x: 282, y: 74, size: 1.9, drift: 11, speed: 0.9 },
    { x: 348, y: 336, size: 1.3, drift: 9, speed: 1.2 },
    { x: 414, y: 118, size: 1.5, drift: 12, speed: 0.75 },
    { x: 492, y: 48, size: 1.7, drift: 8, speed: 0.95 },
    { x: 548, y: 286, size: 1.4, drift: 10, speed: 1.15 },
    { x: 606, y: 184, size: 1.8, drift: 6, speed: 0.85 },
]);

export class AdvancedDemoResultScreen extends Level {
    constructor(options) {
        super();
        this.caption = options.caption;
        this.TelaId = options.screenId;
        this.eyebrow = options.eyebrow;
        this.title = options.title;
        this.subtitle = options.subtitle;
        this.creditsTitle = options.creditsTitle ?? "";
        this.creditLines = options.creditLines ?? [];
        this.accentColor = options.accentColor ?? "#F4D26A";
        this.titleColor = options.titleColor ?? "#FFFFFF";
        this.overlayColor = options.overlayColor ?? "rgba(8, 11, 24, 0.58)";
        this.bandColor = options.bandColor ?? "rgba(8, 12, 24, 0.72)";
        this.elapsed = 0;
    }

    OnStart() {
        this.elapsed = 0;
        this.screen = new Screen(this.TelaId, RESULT_SCREEN.width, RESULT_SCREEN.height);
        this.draw = new Draw(this.screen);
        super.OnStart();
    }

    OnUpdate(dt) {
        this.elapsed += dt ?? 0.016;

        if (ActionManager.IsActionDown("ATTACK")) {
            AdvancedDemoProgress.GoToMenu(this);
        }
    }

    OnDrawn() {
        if (!this.screen) return;

        this.screen.Refresh();
        this.DrawBackdrop();
        this.DrawResultBand();
        this.DrawHeader();
        this.DrawCredits();
        this.DrawContinueButton();
    }

    DrawBackdrop() {
        const ctx = this.screen.Context;
        ctx.fillStyle = "#43406F";
        ctx.fillRect(0, 0, RESULT_SCREEN.width, RESULT_SCREEN.height);

        this.DrawBackgroundSprite("snow_sky", 0, 0, RESULT_SCREEN.width, RESULT_SCREEN.height, 1);
        this.DrawBackgroundSprite("snow_mountain_02", 0, 112, 374, 158, 0.78);
        this.DrawBackgroundSprite("snow_mountain_01", 60, 166, 638, 176, 0.92);
        this.DrawBackgroundSprite("snow_03", 0, 352, 640, 128, 0.8);

        ctx.fillStyle = this.overlayColor;
        ctx.fillRect(0, 0, RESULT_SCREEN.width, RESULT_SCREEN.height);
        this.DrawSnowParticles();
    }

    DrawBackgroundSprite(spriteName, x, y, width, height, alpha) {
        if (!AssetManager.instance.HasImage(spriteName)) return;

        const ctx = this.screen.Context;
        ctx.save();
        ctx.globalAlpha = alpha;
        this.draw.DrawSpriteStretched(AssetManager.instance.GetImage(spriteName), x, y, width, height);
        ctx.restore();
    }

    DrawSnowParticles() {
        const ctx = this.screen.Context;
        ctx.save();
        ctx.fillStyle = "rgba(255, 255, 255, 0.72)";

        SNOW_PARTICLES.forEach((flake, index) => {
            const phase = this.elapsed * flake.speed + index;
            const x = flake.x + Math.sin(phase) * flake.drift;
            const y = (flake.y + this.elapsed * 18 * flake.speed) % RESULT_SCREEN.height;
            ctx.beginPath();
            ctx.arc(x, y, flake.size, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.restore();
    }

    DrawResultBand() {
        const ctx = this.screen.Context;
        ctx.fillStyle = this.bandColor;
        ctx.fillRect(0, RESULT_LAYOUT.bandY, RESULT_SCREEN.width, RESULT_LAYOUT.bandHeight);

        ctx.strokeStyle = this.accentColor;
        ctx.globalAlpha = 0.78;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, RESULT_LAYOUT.bandY);
        ctx.lineTo(RESULT_SCREEN.width, RESULT_LAYOUT.bandY);
        ctx.moveTo(0, RESULT_LAYOUT.bandY + RESULT_LAYOUT.bandHeight);
        ctx.lineTo(RESULT_SCREEN.width, RESULT_LAYOUT.bandY + RESULT_LAYOUT.bandHeight);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    DrawHeader() {
        this.draw.SetTextAlign("center");
        this.draw.Font = "Arial";
        this.draw.FontSize = "14px";
        this.draw.Color = this.accentColor;
        this.draw.DrawText(this.eyebrow, RESULT_SCREEN.centerX, RESULT_LAYOUT.eyebrowY);

        this.draw.FontSize = "42px";
        this.draw.Color = this.titleColor;
        this.draw.DrawText(this.title, RESULT_SCREEN.centerX, RESULT_LAYOUT.titleY, RESULT_LAYOUT.maxTextWidth);

        this.draw.FontSize = "15px";
        this.draw.Color = "#D8E8FF";
        this.draw.DrawText(this.subtitle, RESULT_SCREEN.centerX, RESULT_LAYOUT.subtitleY, RESULT_LAYOUT.maxTextWidth);
    }

    DrawCredits() {
        if (this.creditLines.length === 0) return;

        this.draw.SetTextAlign("center");
        this.draw.Font = "Arial";
        this.draw.FontSize = "13px";
        this.draw.Color = this.accentColor;
        this.draw.DrawText(this.creditsTitle, RESULT_SCREEN.centerX, RESULT_LAYOUT.creditsTitleY);

        this.creditLines.forEach((line, index) => {
            const y = RESULT_LAYOUT.creditsStartY + index * RESULT_LAYOUT.creditsLineHeight;
            this.draw.FontSize = "14px";
            this.draw.Color = index % 2 === 0 ? "#FFFFFF" : "#BFD6FF";
            this.draw.DrawText(line, RESULT_SCREEN.centerX, y, RESULT_LAYOUT.maxTextWidth);
        });
    }

    DrawContinueButton() {
        const ctx = this.screen.Context;
        const pulse = 0.55 + Math.sin(this.elapsed * 5) * 0.18;

        ctx.fillStyle = "rgba(255, 255, 255, 0.13)";
        ctx.strokeStyle = this.accentColor;
        ctx.globalAlpha = 0.82 + pulse * 0.18;
        ctx.lineWidth = 2;
        this.RoundRect(
            ctx,
            RESULT_LAYOUT.continueX,
            RESULT_LAYOUT.continueY,
            RESULT_LAYOUT.continueWidth,
            RESULT_LAYOUT.continueHeight,
            8
        );
        ctx.fill();
        ctx.stroke();
        ctx.globalAlpha = 1;

        this.draw.SetTextAlign("center");
        this.draw.Font = "Arial";
        this.draw.FontSize = "14px";
        this.draw.Color = "#FFFFFF";
        this.draw.DrawText("CONTINUAR", RESULT_SCREEN.centerX, RESULT_LAYOUT.continueTextY);
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
