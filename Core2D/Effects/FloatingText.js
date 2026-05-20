import { Draw } from "../Graphics/Draw.js";
import { Vector2D } from "../../CoreCross/Math/Vector2D.js";

const DEFAULT_FLOATING_TEXT = {
    velocityX: 0,
    velocityY: -55,
    gravityLift: 10,
    lifeTime: 0.75,
    color: "#FFD76A",
    outlineColor: "#1B0B05",
    font: "Arial",
    fontSize: 18,
    outlineWidth: 3,
    fallbackDelta: 0.016,
};

export class FloatingText {
    constructor(screen) {
        this.name = "FloatingText";
        this.zIndex = 80;
        this.draw = new Draw(screen);
        this.position = new Vector2D(0, 0);
        this.velocity = new Vector2D(DEFAULT_FLOATING_TEXT.velocityX, DEFAULT_FLOATING_TEXT.velocityY);
        this.active = false;
        this.text = "";
        this.age = 0;
        this.lifeTime = DEFAULT_FLOATING_TEXT.lifeTime;
        this.color = DEFAULT_FLOATING_TEXT.color;
        this.font = DEFAULT_FLOATING_TEXT.font;
        this.fontSize = DEFAULT_FLOATING_TEXT.fontSize;
    }

    Spawn(text, x, y, options = {}) {
        this.text = String(text);
        this.position = new Vector2D(x, y);
        this.velocity = new Vector2D(
            options.velocityX ?? DEFAULT_FLOATING_TEXT.velocityX,
            options.velocityY ?? DEFAULT_FLOATING_TEXT.velocityY
        );
        this.lifeTime = options.lifeTime ?? DEFAULT_FLOATING_TEXT.lifeTime;
        this.color = options.color ?? DEFAULT_FLOATING_TEXT.color;
        this.font = options.font ?? DEFAULT_FLOATING_TEXT.font;
        this.fontSize = options.fontSize ?? DEFAULT_FLOATING_TEXT.fontSize;
        this.age = 0;
        this.active = true;
    }

    OnUpdate(dt) {
        if (!this.active) return;

        const delta = dt ?? DEFAULT_FLOATING_TEXT.fallbackDelta;
        this.age += delta;
        this.position.x += this.velocity.x * delta;
        this.position.y += this.velocity.y * delta;
        this.velocity.y -= DEFAULT_FLOATING_TEXT.gravityLift * delta;

        if (this.age >= this.lifeTime) {
            this.active = false;
        }
    }

    OnDrawn() {
        if (!this.active) return;

        const alpha = Math.max(0, 1 - (this.age / this.lifeTime));
        const ctx = this.draw.screen.Context;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.lineWidth = DEFAULT_FLOATING_TEXT.outlineWidth;
        this.draw.Font = this.font;
        this.draw.FontSize = `${this.fontSize}px`;
        this.draw.SetTextAlign("center");
        this.draw.Style = this.draw.TYPES.STROKED;
        this.draw.Color = DEFAULT_FLOATING_TEXT.outlineColor;
        this.draw.DrawText(this.text, this.position.x, this.position.y);
        this.draw.Style = this.draw.TYPES.FILLED;
        this.draw.Color = this.color;
        this.draw.DrawText(this.text, this.position.x, this.position.y);
        ctx.restore();
    }
}
