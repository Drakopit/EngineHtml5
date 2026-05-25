import {
    BoundsComponent,
    Component,
    HealthComponent,
    TransformComponent,
} from "../../../CoreCross/Component.js";

export class TacticalUnitRendererComponent extends Component {
    constructor({
        assets = null,
        animations = {},
        defaultAnimation = "idle",
        scale = 1,
        color = "#ffffff",
    } = {}) {
        super();
        this.assets = assets;
        this.animations = animations;
        this.current = defaultAnimation;
        this.scale = scale;
        this.color = color;
        this.elapsed = 0;
        this.frameIndex = 0;
    }

    SetRuntimeAssets(assets) {
        this.assets = assets;
    }

    Play(name) {
        if (!this.animations[name] || this.current === name) return;
        this.current = name;
        this.elapsed = 0;
        this.frameIndex = 0;
    }

    OnUpdate(dt) {
        const animation = this._animation();
        if (!animation) return;

        const frames = Math.max(1, animation.frame?.frames ?? animation.frames ?? 1);
        const fps = animation.fps ?? 6;
        this.elapsed += dt;
        this.frameIndex = Math.floor(this.elapsed * fps);

        if (animation.loop !== false) {
            this.frameIndex %= frames;
        } else {
            this.frameIndex = Math.min(frames - 1, this.frameIndex);
        }
    }

    OnDrawn() {
        const level = this.owner?.level;
        const draw = level?.draw;
        const transform = this.owner?.GetComponent?.(TransformComponent);
        if (!draw || !transform || this.owner?.active === false) return;

        const animation = this._animation();
        const image = animation?.asset ? this.assets?.images?.[animation.asset] : null;
        if (image?.complete && image.naturalWidth) {
            this._drawSprite(draw, image, animation, transform);
            return;
        }

        this._drawFallback(draw, transform);
    }

    _animation() {
        return this.animations[this.current] ?? this.animations.idle ?? null;
    }

    _drawSprite(draw, image, animation, transform) {
        const ctx = draw.screen.Context;
        const frame = animation.frame ?? {};
        const frameWidth = frame.width ?? image.naturalWidth / (frame.frames ?? 1);
        const frameHeight = frame.height ?? image.naturalHeight;
        const sourceX = (frame.x ?? 0) + this.frameIndex * frameWidth;
        const sourceY = frame.y ?? 0;
        const scale = Number(animation.scale ?? this.scale ?? 1);
        const drawWidth = frameWidth * scale;
        const drawHeight = frameHeight * scale;
        const cell = this.owner?.grid?.world?.cell ?? 60;
        const drawX = transform.x - drawWidth / 2;
        const drawY = transform.y - drawHeight + cell * 0.48;

        draw.Style = draw.TYPES.FILLED;
        draw.Color = "rgba(0,0,0,0.28)";
        draw.DrawCircle(transform.x, transform.y + cell * 0.28, cell * 0.24);

        ctx.save();
        if (!this.owner?.IsAlive?.()) ctx.globalAlpha = 0.45;
        ctx.drawImage(
            image,
            sourceX,
            sourceY,
            frameWidth,
            frameHeight,
            drawX,
            drawY,
            drawWidth,
            drawHeight
        );
        ctx.restore();

        this._drawLabelAndHp(draw, transform, cell);
    }

    _drawFallback(draw, transform) {
        const bounds = this.owner.GetComponent(BoundsComponent);
        const box = bounds?.GetAABB?.() ?? { x: transform.x - 20, y: transform.y - 20, width: 40, height: 40 };

        draw.Style = draw.TYPES.FILLED;
        draw.Color = this.owner?.IsAlive?.() ? this.color : "#555555";
        draw.DrawRect(box.x, box.y, box.width, box.height);
        this._drawLabelAndHp(draw, transform, this.owner?.grid?.world?.cell ?? 60);
    }

    _drawLabelAndHp(draw, transform, cell) {
        draw.Style = draw.TYPES.FILLED;
        draw.Color = "#FFFFFF";
        draw.FontSize = "10px";
        draw.Font = "monospace";
        draw.SetTextAlign("center");
        draw.DrawText(this.owner.name, transform.x, transform.y - cell * 0.35);

        const health = this.owner.GetComponent(HealthComponent);
        if (!health) return;

        const barW = cell * 0.72;
        const barX = transform.x - barW / 2;
        const barY = transform.y + cell * 0.28;
        const pct = Math.max(0, health.hp / health.maxHp);

        draw.Color = "#111111";
        draw.DrawRect(barX, barY, barW, 5);

        draw.Color = pct > 0.5 ? "#44FF44" : pct > 0.25 ? "#FFAA00" : "#FF3333";
        draw.DrawRect(barX, barY, barW * pct, 5);
    }
}
