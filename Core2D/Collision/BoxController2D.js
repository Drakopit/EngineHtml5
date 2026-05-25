import { Vector2D } from "../../CoreCross/Math/Vector2D.js";
import { BoxManifest2D } from "./BoxManifest2D.js";
import { DEBUG } from "../../CoreCross/Engine.js";

/**
 * Resolves an entity's manifest-defined collision, hurt and attack boxes in world space.
 *
 * @param {GameObject} owner - Animated entity that supplies position and facing.
 * @param {Object|BoxManifest2D} [manifestData={}] - Box definitions.
 */
export class BoxController2D {
    constructor(owner, manifestData = {}) {
        this.owner = owner;
        this.manifest = manifestData instanceof BoxManifest2D
            ? manifestData
            : new BoxManifest2D(manifestData);
        this.hitMemory = new Set();
        this.previousAnimationName = null;
    }

    GetCollisionBoxes() {
        return this.GetWorldBoxes("collision");
    }

    GetHurtBoxes() {
        return this.GetWorldBoxes("hurt");
    }

    /**
     * Returns active attack boxes for the current animation frame.
     * @returns {Object[]} World-space hitboxes.
     */
    GetHitBoxes() {
        const boxes = this.GetWorldBoxes("hit");
        if (boxes.length === 0) this.ResetHitMemory();
        return boxes;
    }

    GetWorldBoxes(type, animationName = this.GetAnimationName(), frame = this.GetFrame()) {
        if (animationName !== this.previousAnimationName) {
            this.previousAnimationName = animationName;
            this.ResetHitMemory();
        }

        return this.manifest
            .GetBoxes(type, animationName, frame)
            .map((box, index) => this.#toWorldBox(box, type, animationName, frame, index));
    }

    GetAnimationName() {
        return this.owner?.animator?.currentAnimationName ?? "*";
    }

    GetFrame() {
        return this.owner?.sprite?.index ?? 0;
    }

    HasHit(hitbox, target) {
        return this.hitMemory.has(this.#hitKey(hitbox, target));
    }

    MarkHit(hitbox, target) {
        this.hitMemory.add(this.#hitKey(hitbox, target));
    }

    ResetHitMemory() {
        this.hitMemory.clear();
    }

    DrawDebug(draw, options = {}) {
        if (!(options.enabled ?? DEBUG())) return;

        const config = {
            collision: options.collision ?? true,
            hurt: options.hurt ?? true,
            hit: options.hit ?? true,
        };

        const previousStyle = draw.Style;
        const previousColor = draw.Color;
        draw.Style = draw.TYPES.STROKED;

        if (config.collision) this.#drawBoxes(draw, this.GetCollisionBoxes(), options.collisionColor ?? "#00FF66");
        if (config.hurt) this.#drawBoxes(draw, this.GetHurtBoxes(), options.hurtColor ?? "#36A3FF");
        if (config.hit) this.#drawBoxes(draw, this.GetHitBoxes(), options.hitColor ?? "#FF3355");

        draw.Style = previousStyle;
        draw.Color = previousColor;
    }

    #drawBoxes(draw, boxes, color) {
        draw.Color = color;
        boxes.forEach(box => draw.DrawRect(box.position.x, box.position.y, box.size.x, box.size.y));
    }

    #toWorldBox(box, type, animationName, frame, index) {
        const scale = box.scale ?? this.manifest.scale ?? 1;
        const width = (box.w ?? box.width ?? 0) * scale;
        const height = (box.h ?? box.height ?? 0) * scale;
        const localX = (box.x ?? 0) * scale;
        const localY = (box.y ?? 0) * scale;
        const ownerX = this.owner?.position?.x ?? 0;
        const ownerY = this.owner?.position?.y ?? 0;
        const ownerWidth = this.owner?.size?.x ?? 0;
        const facingRight = this.owner?.facingRight ?? true;
        const mirror = box.mirror !== false;
        const worldX = !facingRight && mirror
            ? ownerX + ownerWidth - localX - width
            : ownerX + localX;
        const worldY = ownerY + localY;

        return {
            ...box,
            type,
            animationName,
            frame,
            index,
            owner: this.owner,
            position: new Vector2D(worldX, worldY),
            size: new Vector2D(width, height),
            x: worldX,
            y: worldY,
            width,
            height,
            key: `${type}:${animationName}:${box.name ?? index}:${box.from ?? box.frame ?? "all"}:${box.to ?? ""}`,
        };
    }

    #hitKey(hitbox, target) {
        const targetId = target?.owner?.id ?? target?.id ?? "target";
        return `${hitbox.key}:${targetId}`;
    }
}
