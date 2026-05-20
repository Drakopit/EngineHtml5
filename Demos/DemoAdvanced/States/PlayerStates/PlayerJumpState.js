// ==========================================
// ESTADO: NO AR (PULO / QUEDA)
// ==========================================

import { State } from "../State.js";
import { IdleState } from "./PlayerIdleState.js";
import { RunState } from "./PlayerRunState.js";

export class JumpState extends State {
    Enter() {
        this.owner.animator.Play("Jump");
    }

    Update(dt) {

        this.owner.ApplyMovement(dt);

        if (this.owner.isGrounded && this.owner.vy >= 0) {

            if (this.owner.IsMovingInput()) {
                this.owner.stateMachine.ChangeState(new RunState(this.owner));
            }
            else {
                this.owner.stateMachine.ChangeState(new IdleState(this.owner));
            }

        }
    }
}