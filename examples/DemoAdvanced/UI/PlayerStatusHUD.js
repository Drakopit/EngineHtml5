import { AssetManager } from "../../../src/CoreCross/Assets/AssetManager.js";

const DEFAULT_HUD_OPTIONS = {
    x: 16,
    y: 16,
    width: 298,
    height: 92,
};

const HUD_TIMING = {
    fallbackDelta: 0.016,
    damageFlashDuration: 0.22,
    hpEaseSpeed: 10,
};

const PANEL_STYLE = {
    radius: 6,
    fill: "rgba(13, 18, 28, 0.88)",
    stroke: "rgba(233, 221, 165, 0.42)",
    flashStroke: "rgba(255, 72, 72, ALPHA)",
    flashAlphaMax: 0.32,
    flashAlphaScale: 1.4,
    flashAlphaBase: 0.45,
    lineWidth: 2,
    sheenFill: "rgba(255, 255, 255, 0.06)",
    sheenInset: 1,
    sheenHeight: 18,
};

const PORTRAIT_STYLE = {
    x: 12,
    y: 14,
    size: 62,
    radius: 4,
    fill: "#141825",
    stroke: "#D9C56F",
    lineWidth: 2,
    sourceFrameCount: 7,
    clipInset: 3,
    drawInsetX: 6,
    drawOffsetY: -1,
    drawTrimX: 12,
    drawExtraHeight: 10,
};

const TEXT_STYLE = {
    x: 86,
    nameY: 29,
    actionYOffset: 15,
    nameColor: "#F8F3DA",
    actionColor: "rgba(221, 231, 255, 0.68)",
    nameFont: "700 16px Arial",
    actionFont: "11px Arial",
};

const HEALTH_STYLE = {
    x: 86,
    y: 50,
    width: 190,
    height: 13,
    minMaxHP: 1,
    fill: "#2B1013",
    delayFill: "#C78932",
    stroke: "rgba(0, 0, 0, 0.72)",
    lineWidth: 2,
    textColor: "#FFFFFF",
    textFont: "700 11px Arial",
    textYOffset: 10,
};

const STATS_STYLE = {
    x: 86,
    y: 70,
    spacing: 66,
    attackColor: "#EACD75",
    defenseColor: "#9FC8FF",
};

const COMBO_STYLE = {
    rightOffset: 76,
    y: 73,
    segmentCountFallback: 3,
    segmentSpacing: 18,
    segmentWidth: 11,
    segmentHeight: 11,
    activeColor: "#F16D45",
    idleColor: "rgba(255, 255, 255, 0.18)",
};

const CHIP_STYLE = {
    width: 58,
    height: 15,
    radius: 3,
    fill: "rgba(255, 255, 255, 0.08)",
    font: "700 10px Arial",
    textX: 6,
    textY: 11,
};

const HEALTH_COLORS = {
    highThreshold: 0.55,
    midThreshold: 0.25,
    high: "#29D35F",
    mid: "#F2B84B",
    low: "#F05A4F",
};

const ACTION_LABELS = {
    Idle: "READY",
    Run: "MOVING",
    Walk: "MOVING",
    Jump: "AIRBORNE",
    Attack_1: "COMBO I",
    Attack_2: "COMBO II",
    Attack_3: "FINISHER",
    Hurt: "HURT",
    Death: "DOWN",
    Defend: "DEFEND",
};

export class PlayerStatusHUD {
    constructor(screen, playerRef, options = {}) {
        this.screen = screen;
        this.player = playerRef;
        this.x = options.x ?? DEFAULT_HUD_OPTIONS.x;
        this.y = options.y ?? DEFAULT_HUD_OPTIONS.y;
        this.width = options.width ?? DEFAULT_HUD_OPTIONS.width;
        this.height = options.height ?? DEFAULT_HUD_OPTIONS.height;
        this.displayHP = playerRef?.hp ?? 0;
        this.previousHP = playerRef?.hp ?? 0;
        this.damageFlash = 0;
        this.portrait = AssetManager.instance.GetImage("heroi_idle");
    }

    OnUpdate(dt) {
        if (!this.player) return;

        const delta = dt ?? HUD_TIMING.fallbackDelta;
        const targetHP = this.player.hp ?? 0;

        if (targetHP < this.previousHP) {
            this.damageFlash = HUD_TIMING.damageFlashDuration;
        }

        this.previousHP = targetHP;
        this.displayHP += (targetHP - this.displayHP) * Math.min(1, delta * HUD_TIMING.hpEaseSpeed);
        this.damageFlash = Math.max(0, this.damageFlash - delta);
    }

    OnDrawn() {
        if (!this.player || !this.screen?.Context) return;

        const ctx = this.screen.Context;
        ctx.save();
        ctx.textBaseline = "alphabetic";

        this.#drawPanel(ctx);
        this.#drawPortrait(ctx);
        this.#drawIdentity(ctx);
        this.#drawHealth(ctx);
        this.#drawStats(ctx);
        this.#drawCombo(ctx);

        ctx.restore();
    }

    #drawPanel(ctx) {
        const flashAlpha = Math.min(
            PANEL_STYLE.flashAlphaMax,
            this.damageFlash * PANEL_STYLE.flashAlphaScale
        );

        this.#roundRect(ctx, this.x, this.y, this.width, this.height, PANEL_STYLE.radius);
        ctx.fillStyle = PANEL_STYLE.fill;
        ctx.fill();

        ctx.strokeStyle = flashAlpha > 0
            ? PANEL_STYLE.flashStroke.replace("ALPHA", flashAlpha + PANEL_STYLE.flashAlphaBase)
            : PANEL_STYLE.stroke;
        ctx.lineWidth = PANEL_STYLE.lineWidth;
        ctx.stroke();

        ctx.fillStyle = PANEL_STYLE.sheenFill;
        ctx.fillRect(
            this.x + PANEL_STYLE.sheenInset,
            this.y + PANEL_STYLE.sheenInset,
            this.width - (PANEL_STYLE.sheenInset * 2),
            PANEL_STYLE.sheenHeight
        );
    }

    #drawPortrait(ctx) {
        const px = this.x + PORTRAIT_STYLE.x;
        const py = this.y + PORTRAIT_STYLE.y;
        const size = PORTRAIT_STYLE.size;

        this.#roundRect(ctx, px, py, size, size, PORTRAIT_STYLE.radius);
        ctx.fillStyle = PORTRAIT_STYLE.fill;
        ctx.fill();
        ctx.strokeStyle = PORTRAIT_STYLE.stroke;
        ctx.lineWidth = PORTRAIT_STYLE.lineWidth;
        ctx.stroke();

        if (!this.portrait) return;

        const frameWidth = this.portrait.width / PORTRAIT_STYLE.sourceFrameCount;
        const frameHeight = this.portrait.height;
        ctx.save();
        this.#roundRect(
            ctx,
            px + PORTRAIT_STYLE.clipInset,
            py + PORTRAIT_STYLE.clipInset,
            size - (PORTRAIT_STYLE.clipInset * 2),
            size - (PORTRAIT_STYLE.clipInset * 2),
            PORTRAIT_STYLE.clipInset
        );
        ctx.clip();
        ctx.drawImage(
            this.portrait,
            0,
            0,
            frameWidth,
            frameHeight,
            px + PORTRAIT_STYLE.drawInsetX,
            py + PORTRAIT_STYLE.drawOffsetY,
            size - PORTRAIT_STYLE.drawTrimX,
            size + PORTRAIT_STYLE.drawExtraHeight,
        );
        ctx.restore();
    }

    #drawIdentity(ctx) {
        const tx = this.x + TEXT_STYLE.x;
        const ty = this.y + TEXT_STYLE.nameY;

        ctx.fillStyle = TEXT_STYLE.nameColor;
        ctx.font = TEXT_STYLE.nameFont;
        ctx.fillText("KNIGHT", tx, ty);

        ctx.fillStyle = TEXT_STYLE.actionColor;
        ctx.font = TEXT_STYLE.actionFont;
        ctx.fillText(this.#getActionLabel(), tx, ty + TEXT_STYLE.actionYOffset);
    }

    #drawHealth(ctx) {
        const bx = this.x + HEALTH_STYLE.x;
        const by = this.y + HEALTH_STYLE.y;
        const bw = HEALTH_STYLE.width;
        const bh = HEALTH_STYLE.height;
        const maxHP = Math.max(HEALTH_STYLE.minMaxHP, this.player.maxHP ?? HEALTH_STYLE.minMaxHP);
        const hpPercent = Math.max(0, Math.min(1, (this.player.hp ?? 0) / maxHP));
        const displayPercent = Math.max(0, Math.min(1, this.displayHP / maxHP));

        ctx.fillStyle = HEALTH_STYLE.fill;
        ctx.fillRect(bx, by, bw, bh);

        if (displayPercent > hpPercent) {
            ctx.fillStyle = HEALTH_STYLE.delayFill;
            ctx.fillRect(bx, by, bw * displayPercent, bh);
        }

        ctx.fillStyle = this.#healthColor(hpPercent);
        ctx.fillRect(bx, by, bw * hpPercent, bh);

        ctx.strokeStyle = HEALTH_STYLE.stroke;
        ctx.lineWidth = HEALTH_STYLE.lineWidth;
        ctx.strokeRect(bx, by, bw, bh);

        ctx.fillStyle = HEALTH_STYLE.textColor;
        ctx.font = HEALTH_STYLE.textFont;
        ctx.textAlign = "center";
        ctx.fillText(
            `${Math.max(0, Math.ceil(this.player.hp ?? 0))} / ${maxHP}`,
            bx + (bw / 2),
            by + HEALTH_STYLE.textYOffset
        );
        ctx.textAlign = "left";
    }

    #drawStats(ctx) {
        const sx = this.x + STATS_STYLE.x;
        const sy = this.y + STATS_STYLE.y;
        this.#drawChip(ctx, sx, sy, `ATK ${this.player.attack ?? 0}`, STATS_STYLE.attackColor);
        this.#drawChip(ctx, sx + STATS_STYLE.spacing, sy, `DEF ${this.player.defense ?? 0}`, STATS_STYLE.defenseColor);
    }

    #drawCombo(ctx) {
        const startX = this.x + this.width - COMBO_STYLE.rightOffset;
        const y = this.y + COMBO_STYLE.y;
        const activeIndex = this.player.isAttacking ? this.player.combo?.index ?? 0 : -1;
        const segmentCount = this.player.combo?.attacks?.length ?? COMBO_STYLE.segmentCountFallback;

        for (let i = 0; i < segmentCount; i++) {
            ctx.fillStyle = i <= activeIndex ? COMBO_STYLE.activeColor : COMBO_STYLE.idleColor;
            ctx.fillRect(
                startX + (i * COMBO_STYLE.segmentSpacing),
                y,
                COMBO_STYLE.segmentWidth,
                COMBO_STYLE.segmentHeight
            );
        }
    }

    #drawChip(ctx, x, y, text, color) {
        this.#roundRect(ctx, x, y, CHIP_STYLE.width, CHIP_STYLE.height, CHIP_STYLE.radius);
        ctx.fillStyle = CHIP_STYLE.fill;
        ctx.fill();
        ctx.fillStyle = color;
        ctx.font = CHIP_STYLE.font;
        ctx.fillText(text, x + CHIP_STYLE.textX, y + CHIP_STYLE.textY);
    }

    #getActionLabel() {
        const animationName = this.player.animator?.currentAnimationName ?? "Idle";
        return ACTION_LABELS[animationName] ?? animationName.toUpperCase();
    }

    #healthColor(percent) {
        if (percent > HEALTH_COLORS.highThreshold) return HEALTH_COLORS.high;
        if (percent > HEALTH_COLORS.midThreshold) return HEALTH_COLORS.mid;
        return HEALTH_COLORS.low;
    }

    #roundRect(ctx, x, y, width, height, radius) {
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
}
