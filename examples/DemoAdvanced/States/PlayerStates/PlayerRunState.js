// ==========================================
// ESTADO: CORRENDO
// ==========================================

import { ActionManager } from "../../../../src/CoreCross/Input/ActionManager.js";
import { State } from "../State.js";
import { AttackState } from "./PlayerAttackState.js";
import { IdleState } from "./PlayerIdleState.js";
import { JumpState } from "./PlayerJumpState.js";

export class RunState extends State {
    Enter() {
        this.owner.animator.Play("Run");
    }

    Update(dt) {

        if (!this.owner.isGrounded && this.owner.vy > 0) {
            this.owner.stateMachine.ChangeState(new JumpState(this.owner));
            return;
        }

        if (ActionManager.IsActionDown("ATTACK")) {
            this.owner.stateMachine.ChangeState(new AttackState(this.owner));
            return;
        }

        if (this.owner.IsJumpInput()) {
            this.owner.DoJump();
            this.owner.stateMachine.ChangeState(new JumpState(this.owner));
            return;
        }

        if (!this.owner.IsMovingInput()) {
            this.owner.stateMachine.ChangeState(new IdleState(this.owner));
            return;
        }

        this.owner.ApplyMovement(dt);
    }
}
