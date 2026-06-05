import { Collide2D } from "./Collide2D.js";

/**
 * Stateless hitbox-versus-hurtbox resolver for data-driven 2D combat.
 */
export class CombatResolver2D {
    /**
     * Finds new attack contacts and emits optional game-owned hit handling.
     * @param {BoxController2D} attackerBoxes - Attacking entity boxes.
     * @param {BoxController2D|BoxController2D[]} defenderBoxesList - Potential defenders.
     * @param {Object} [options={}] - Default hit values and `onHit` callback.
     * @returns {Object[]} Resolved hit records.
     */
    static Resolve(attackerBoxes, defenderBoxesList, options = {}) {
        const defenders = Array.isArray(defenderBoxesList) ? defenderBoxesList : [defenderBoxesList];
        const hits = [];

        attackerBoxes.GetHitBoxes().forEach(hitbox => {
            defenders.forEach(defenderBoxes => {
                if (!defenderBoxes) return;

                defenderBoxes.GetHurtBoxes().forEach(hurtbox => {
                    if (!this.Intersects(hitbox, hurtbox)) return;
                    if (hitbox.oncePerTarget !== false && attackerBoxes.HasHit(hitbox, defenderBoxes)) return;

                    const hit = {
                        attacker: attackerBoxes,
                        defender: defenderBoxes,
                        hitbox,
                        hurtbox,
                        damage: hitbox.damage ?? options.defaultDamage ?? 0,
                        knockback: hitbox.knockback ?? options.defaultKnockback ?? { x: 0, y: 0 },
                        hitStop: hitbox.hitStop ?? options.defaultHitStop ?? 0.06,
                        hitStun: hitbox.hitStun ?? options.defaultHitStun ?? 0.14,
                        stagger: hitbox.stagger ?? options.defaultStagger ?? true,
                        position: this.GetImpactPoint(hitbox, hurtbox),
                    };

                    attackerBoxes.MarkHit(hitbox, defenderBoxes);
                    hits.push(hit);
                    options.onHit?.(hit);
                });
            });
        });

        return hits;
    }

    static Intersects(boxA, boxB) {
        return Collide2D.isCollidingAABB(boxA, boxB);
    }

    static IntersectsAny(boxesA, boxesB) {
        return boxesA.some(boxA => boxesB.some(boxB => this.Intersects(boxA, boxB)));
    }

    static GetImpactPoint(boxA, boxB) {
        const left = Math.max(boxA.position.x, boxB.position.x);
        const right = Math.min(boxA.position.x + boxA.size.x, boxB.position.x + boxB.size.x);
        const top = Math.max(boxA.position.y, boxB.position.y);
        const bottom = Math.min(boxA.position.y + boxA.size.y, boxB.position.y + boxB.size.y);

        return {
            x: (left + right) / 2,
            y: (top + bottom) / 2,
        };
    }
}
