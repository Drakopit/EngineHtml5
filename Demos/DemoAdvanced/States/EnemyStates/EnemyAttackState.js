import { State } from "../State.js";

export class EnemyAttackState extends State {
    Enter() {
        this.owner.FacePlayer();
        this.owner.BeginAttack();
        this.owner.animator.Play("Attack");
        this.locked = true;
    }

    Update() {
        if (this.owner.isTakingDamage) return;

        if (!this.owner.sprite.finished) return;

        this.owner.FinishAttack();
        this.locked = false;
        this.owner.ReturnToIdle();
    }

    Exit() {
        this.owner.FinishAttack();
    }
}
