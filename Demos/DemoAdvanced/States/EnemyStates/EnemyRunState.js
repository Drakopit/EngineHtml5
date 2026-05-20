import { EnemyIdleState } from "./EnemyIdleState.js";
import { EnemyAttackState } from "./EnemyAttackState.js";
import { State } from "../State.js";

export class EnemyRunState extends State {

    Enter() {
        this.owner.animator.Play("Run");
    }

    Update(dt) {
        if (this.owner.isTakingDamage) return;

        let dist = this.owner.position.x - this.owner.player.position.x;
        this.owner.FacePlayer();

        if (Math.abs(dist) > this.owner.aggroRange) {
            this.owner.stateMachine.ChangeState(
                new EnemyIdleState(this.owner)
            );
            return;
        }

        if (this.owner.CanAttackPlayer()) {
            this.owner.stateMachine.ChangeState(
                new EnemyAttackState(this.owner)
            );
            return;
        }

        if (dist > this.owner.stopDistance) {
            this.owner.position.x -= this.owner.speed * dt;
            this.owner.facingRight = false;
        }
        else if (dist < -this.owner.stopDistance) {
            this.owner.position.x += this.owner.speed * dt;
            this.owner.facingRight = true;
        }

    }
}
