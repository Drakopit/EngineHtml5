export class OnlineEntitySync {
    constructor(network, {
        readState,
        syncRate = 12,
    } = {}) {
        if (!network) throw new Error("OnlineEntitySync requires a GameNetwork instance.");
        if (typeof readState !== "function") throw new Error("OnlineEntitySync requires readState.");

        this.network = network;
        this.readState = readState;
        this.syncRate = syncRate;
        this.elapsed = Infinity;
        this.lastState = null;
    }

    update(deltaTime = 1 / 60) {
        this.elapsed += deltaTime;
        if (this.elapsed < 1 / Math.max(1, this.syncRate)) return false;
        return this.send();
    }

    send(force = false) {
        const state = this.readState();
        if (!force && !this.changed(state)) return false;

        this.elapsed = 0;
        this.lastState = { ...state };
        return this.network.sendPlayerState(state);
    }

    changed(state) {
        if (!this.lastState) return true;
        return Object.keys(state).some(key => state[key] !== this.lastState[key]);
    }
}
