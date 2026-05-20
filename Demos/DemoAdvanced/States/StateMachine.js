export class StateMachine {

    constructor(owner) {
        this.owner = owner;
        this.currentState = null;
    }

    ChangeState(newState) {

        if (this.currentState && this.currentState.locked)
            return;

        if (this.currentState)
            this.currentState.Exit();

        this.currentState = newState;

        this.currentState.Enter();
    }

    Update(dt) {

        if (!this.currentState)
            return;

        this.currentState.Update(dt);

    }

}