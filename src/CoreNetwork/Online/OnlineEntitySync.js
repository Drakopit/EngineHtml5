/**
 * Rate-limited sender for one game's local entity state.
 *
 * The game supplies `readState`, choosing the compact fields that remote peers
 * need to render; unchanged snapshots are not resent.
 *
 * @param {GameNetwork} network - Session used to send player state.
 * @param {Object} options - Entity synchronization settings.
 * @param {Function} options.readState - Returns serializable local state.
 * @param {number} [options.syncRate=12] - Maximum sends per second.
 */
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

    /**
     * Advances the rate limiter and sends changed state when due.
     * @param {number} [deltaTime=0.0166667] - Frame time in seconds.
     * @returns {boolean} Whether state was sent.
     */
    update(deltaTime = 1 / 60) {
        this.elapsed += deltaTime;
        if (this.elapsed < 1 / Math.max(1, this.syncRate)) return false;
        return this.send();
    }

    /**
     * Immediately evaluates and optionally sends local state.
     * @param {boolean} [force=false] - Send even when fields did not change.
     * @returns {boolean} Whether the network accepted a state message.
     */
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
