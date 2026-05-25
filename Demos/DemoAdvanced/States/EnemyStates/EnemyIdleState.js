import { EnemyRunState } from "./EnemyRunState.js";
import { EnemyAttackState } from "./EnemyAttackState.js";
import { State } from "../State.js";

export class EnemyIdleState extends State {

    Enter() {
        this.owner.animator.Play("Idle");
    }

    Update(dt) {
        if (this.owner.isTakingDamage) return;

        let dist = Math.abs(
            this.owner.position.x - this.owner.player.position.x
        );

        if (this.owner.CanAttackPlayer()) {
            this.owner.stateMachine.ChangeState(
                new EnemyAttackState(this.owner)
            );
            return;
        }

        if (dist < this.owner.aggroRange) {
            this.owner.stateMachine.ChangeState(
                new EnemyRunState(this.owner)
            );
        }
    }
}
