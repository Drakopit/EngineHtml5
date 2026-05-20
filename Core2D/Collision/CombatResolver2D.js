import { Collide2D } from "../Math/Collide2D.js";

export class CombatResolver2D {
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
