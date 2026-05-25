// ==========================================
// ESTADO: ATACANDO
// ==========================================

import { ActionManager } from "../../../../CoreCross/Input/ActionManager.js";
import { State } from "../State.js";
import { IdleState } from "./PlayerIdleState.js";

export class AttackState extends State {
    Enter() {
        this.locked = true;
        this.owner.isAttacking = true;
        this.owner.boxes.ResetHitMemory();
        this.owner.animator.Play(this.owner.combo.Start());
    }

    Update(dt) {
        const sprite = this.owner.sprite;

        this.owner.combo.Update(dt);

        if (ActionManager.IsActionDown("ATTACK")) {
            this.owner.combo.QueueNext();
        }

        const nextAttack = this.owner.combo.ConsumeNextIfReady(sprite.index);
        if (nextAttack) {
            this.owner.animator.Play(nextAttack);
            return;
        }

        if (sprite.index >= sprite.frameCount - 1) {
            this.locked = false;
            this.owner.stateMachine.ChangeState(new IdleState(this.owner));
        }
    }

    Exit() {
        this.owner.isAttacking = false;
        this.owner.boxes.ResetHitMemory();
        this.owner.combo.Reset();
    }
}
