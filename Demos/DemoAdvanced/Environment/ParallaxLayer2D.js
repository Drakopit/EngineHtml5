import { AssetManager } from "../../../CoreCross/Assets/AssetManager.js";

const DEFAULT_PARALLAX_LAYER = {
    x: 0,
    y: 0,
    scale: 1,
    scrollRatioX: 0,
    scrollRatioY: 0,
    repeatX: true,
    repeatY: false,
    opacity: 1,
    speedX: 0,
    speedY: 0,
};

export class ParallaxLayer2D {
    constructor(screen, config = {}) {
        this.screen = screen;
        this.config = { ...DEFAULT_PARALLAX_LAYER, ...config };
        this.image = AssetManager.instance.GetImage(this.config.sprite);
        this.offsetX = 0;
        this.offsetY = 0;
    }

    OnUpdate(dt) {
        const delta = dt ?? 0.016;
        this.offsetX += this.config.speedX * delta;
        this.offsetY += this.config.speedY * delta;
    }

    OnDrawn(camera) {
        if (!this.image || !this.screen?.Context) return;

        const ctx = this.screen.Context;
        const width = this.config.width ?? this.image.width * this.config.scale;
        const height = this.config.height ?? this.image.height * this.config.scale;
        const baseX = this.config.x - (camera.position.x * this.config.scrollRatioX) + this.offsetX;
        const baseY = this.config.y - (camera.position.y * this.config.scrollRatioY) + this.offsetY;

        ctx.save();
        ctx.globalAlpha = this.config.opacity;

        const startX = this.config.repeatX ? this.#repeatStart(baseX, width) : baseX;
        const startY = this.config.repeatY ? this.#repeatStart(baseY, height) : baseY;
        const endX = this.config.repeatX ? this.screen.width + width : startX + width;
        const endY = this.config.repeatY ? this.screen.height + height : startY + height;

        for (let y = startY; y < endY; y += height) {
            for (let x = startX; x < endX; x += width) {
                ctx.drawImage(this.image, x, y, width, height);
                if (!this.config.repeatX) break;
            }

            if (!this.config.repeatY) break;
        }

        ctx.restore();
    }

    #repeatStart(value, size) {
        const mod = value % size;
        return mod > 0 ? mod - size : mod;
    }
}
