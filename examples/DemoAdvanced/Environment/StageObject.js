import { GameObject } from "../../../src/Core2D/Objects/GameObject.js";
import { Vector2D } from "../../../src/CoreCross/Math/Vector2D.js";
import { Draw } from "../../../src/Core2D/Graphics/Draw.js";
import { AssetManager } from "../../../src/CoreCross/Assets/AssetManager.js";
import { JsonManifestComposer } from "../../../src/CoreCross/Assets/JsonManifestComposer.js";

const DEFAULT_STAGE_OBJECT = {
    x: 0,
    y: 0,
    width: 16,
    height: 16,
    visible: true,
    solid: false,
    sprite: null,
    source: null,
    pos_x: 0,
    pos_y: 0,
    frameWidth: null,
    frameHeight: null,
    zIndex: 30,
};

const DEFAULT_ANIMATION = {
    frames: 1,
    speed: 8,
    frameStepX: null,
    frameStepY: 0,
    loop: true,
};

export class StageObject extends GameObject {
    constructor(screen, config = {}) {
        super();
        const catalogConfig = this.ResolveCatalogConfig(config);
        this.config = {
            ...DEFAULT_STAGE_OBJECT,
            ...catalogConfig,
            ...config,
            source: { ...catalogConfig.source, ...config.source },
            animation: catalogConfig.animation || config.animation
                ? { ...catalogConfig.animation, ...config.animation }
                : null,
        };
        this.name = "StageObject";
        this.id = this.config.id ?? this.id;
        this.position = new Vector2D(this.config.x, this.config.y);
        this.previousPosition = new Vector2D(this.config.x, this.config.y);
        this.size = new Vector2D(this.config.width, this.config.height);
        this.solid = this.config.solid ?? DEFAULT_STAGE_OBJECT.solid;
        this.visible = this.config.visible ?? DEFAULT_STAGE_OBJECT.visible;
        this.material = this.config.material ?? null;
        this.zIndex = this.config.zIndex ?? DEFAULT_STAGE_OBJECT.zIndex;
        this.draw = new Draw(screen);
        this.image = this.ResolveImage(this.config.sprite);
        this.animation = this.config.animation
            ? { ...DEFAULT_ANIMATION, ...this.config.animation }
            : null;
        this.frameIndex = 0;
        this.frameTimer = 0;
    }

    ResolveImage(spriteName) {
        if (!spriteName || !AssetManager.instance.HasImage(spriteName)) return null;
        return AssetManager.instance.GetImage(spriteName);
    }

    ResolveCatalogConfig(config) {
        const ref = config.animationRef ?? config.spriteRef ?? config.ref;
        if (!ref) return {};

        const catalog = JsonManifestComposer.Compose("snow_pack");
        const atlases = Object.values(catalog?.atlases ?? {});

        for (const atlas of atlases) {
            const animation = atlas.animations?.[ref];
            if (animation) {
                return {
                    sprite: atlas.sprite,
                    source: animation.source,
                    animation: {
                        frames: animation.frames,
                        speed: animation.speed,
                        frameStepX: animation.frameStepX,
                        frameStepY: animation.frameStepY,
                    },
                };
            }

            const sprite = atlas.sprites?.[ref];
            if (sprite) {
                return {
                    sprite: atlas.sprite,
                    source: sprite,
                };
            }
        }

        return {};
    }

    OnUpdate(dt) {
        if (!this.animation || this.animation.frames <= 1) return;

        const delta = dt ?? 0.016;
        this.frameTimer += delta;

        if (this.frameTimer < 1 / this.animation.speed) return;

        this.frameTimer = 0;
        this.frameIndex += 1;

        if (this.frameIndex >= this.animation.frames) {
            this.frameIndex = this.animation.loop ? 0 : this.animation.frames - 1;
        }
    }

    OnDrawn() {
        if (!this.visible) return;

        if (!this.image) {
            this.draw.Color = "#7A8799";
            this.draw.DrawRect(this.position.x, this.position.y, this.size.x, this.size.y);
            return;
        }

        this.draw.DrawSpritePart(this.image, this.GetSource(), {
            x: this.position.x,
            y: this.position.y,
            width: this.size.x,
            height: this.size.y,
        });
    }

    GetSource() {
        const source = this.config.source ?? {};
        const width = source.width ?? this.config.frameWidth ?? this.image.width;
        const height = source.height ?? this.config.frameHeight ?? this.image.height;
        const stepX = this.animation?.frameStepX ?? width;
        const stepY = this.animation?.frameStepY ?? DEFAULT_ANIMATION.frameStepY;

        return {
            x: (source.x ?? this.config.pos_x ?? DEFAULT_STAGE_OBJECT.pos_x) + (this.frameIndex * stepX),
            y: (source.y ?? this.config.pos_y ?? DEFAULT_STAGE_OBJECT.pos_y) + (this.frameIndex * stepY),
            width,
            height,
        };
    }
}
