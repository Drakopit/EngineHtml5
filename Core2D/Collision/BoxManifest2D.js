/**
 * Parses data-driven collision, hurtbox and hitbox definitions for animated entities.
 *
 * @param {Object} [data={}] - Box manifest loaded from game assets.
 */
export class BoxManifest2D {
    constructor(data = {}) {
        this.data = data;
        this.scale = data.scale ?? 1;
        this.origin = data.origin ?? "entity-top-left";
    }

    /**
     * Finds active boxes for a type, animation and current frame.
     * @param {string} type - `collision`, `hurt` or `hit`.
     * @param {string} [animationName="*"] - Active animation.
     * @param {number} [frame=0] - Active animation frame.
     * @returns {Object[]} Matching local box definitions.
     */
    GetBoxes(type, animationName = "*", frame = 0) {
        const group = this.#getGroup(type);
        if (!group) return [];

        return [
            ...this.#getEntries(group, "*"),
            ...this.#getEntries(group, "default"),
            ...this.#getEntries(group, animationName),
        ]
            .filter(box => this.#isFrameActive(box, frame))
            .map((box, index) => ({
                ...box,
                type,
                name: box.name ?? `${type}_${animationName}_${index}`,
            }));
    }

    #getGroup(type) {
        const aliases = {
            collision: ["collisionboxes", "collisionBoxes", "collisions"],
            collisionboxes: ["collisionboxes", "collisionBoxes", "collisions"],
            hurt: ["hurtboxes", "hurtBoxes"],
            hurtboxes: ["hurtboxes", "hurtBoxes"],
            hit: ["hitboxes", "hitBoxes"],
            hitboxes: ["hitboxes", "hitBoxes"],
        };

        const keys = aliases[type] ?? [type];
        for (const key of keys) {
            if (this.data[key]) return this.data[key];
        }

        return null;
    }

    #getEntries(group, animationName) {
        const entries = group?.[animationName];
        if (!entries) return [];
        return Array.isArray(entries) ? entries : [entries];
    }

    #isFrameActive(box, frame) {
        if (box.frame === "*" || box.frames === "*") return true;
        if (typeof box.frame === "number") return box.frame === frame;
        if (Array.isArray(box.frames)) return box.frames.includes(frame);

        const from = box.from ?? box.startFrame;
        const to = box.to ?? box.endFrame;
        if (typeof from === "number" || typeof to === "number") {
            return frame >= (from ?? 0) && frame <= (to ?? frame);
        }

        return true;
    }
}
