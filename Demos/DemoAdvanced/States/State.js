export class State {
    constructor(owner) {
        this.owner = owner;
        this.isFinished = false;
        this.locked = false; // impede interrupção
    }

    Enter() {}
    Update(dt) {}
    Exit() {}
}