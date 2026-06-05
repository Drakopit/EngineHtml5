// ==========================================
// ESTADO: PARADO
// ==========================================

import { ActionManager } from "../../../../src/CoreCross/Input/ActionManager.js";
import { State } from "../State.js";
import { AttackState } from "./PlayerAttackState.js";
import { JumpState } from "./PlayerJumpState.js";
import { RunState } from "./PlayerRunState.js";

export class IdleState extends State {
    Enter() {
        this.owner.animator.Play("Idle");
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

        if (this.owner.IsMovingInput()) {
            this.owner.stateMachine.ChangeState(new RunState(this.owner));
        }
    }
}
