/**
 * Stores remote peer render state and smooths numeric movement fields.
 *
 * The manager is intentionally representation-neutral: the demo decides how
 * each returned remote player is rendered.
 *
 * @param {GameNetwork} network - Session supplying peer and player-state events.
 * @param {Object} [options] - Remote state settings.
 * @param {number} [options.smoothing=16] - Interpolation response per second.
 */
export class OnlinePlayerManager {
    constructor(network, { smoothing = 16 } = {}) {
        if (!network) throw new Error("OnlinePlayerManager requires a GameNetwork instance.");

        this.network = network;
        this.smoothing = smoothing;
        this.players = new Map();
        this.unsubscribe = [
            network.onPeerJoined(peer => this.spawn(peer)),
            network.onPeerUpdated(peer => this.spawn(peer)),
            network.onPeerLeft(peerId => this.remove(peerId)),
            network.onPlayerStateReceived((peerId, state, peer) => this.updateState(peerId, state, peer)),
        ];
    }

    /**
     * Creates or refreshes a remote player profile.
     * @param {Object} peer - Peer with a stable `id`.
     * @returns {Object|null} Stored player entry.
     */
    spawn(peer) {
        if (!peer?.id) return null;
        const player = this.players.get(peer.id) ?? {
            id: peer.id,
            state: null,
            displayState: null,
        };
        Object.assign(player, peer);
        this.players.set(peer.id, player);
        return player;
    }

    remove(peerId) {
        this.players.delete(peerId);
    }

    /**
     * Stores the newest target state received from a remote player.
     * @param {string} peerId - Remote peer identifier.
     * @param {Object} [state={}] - Target render state.
     * @param {Object} [peer={}] - Updated peer profile.
     * @returns {void}
     */
    updateState(peerId, state = {}, peer = {}) {
        const player = this.spawn({ id: peerId, ...peer });
        if (!player) return;

        player.state = { ...player.state, ...state };
        if (!player.displayState) player.displayState = { ...player.state };
    }

    /**
     * Interpolates displayed numeric position and velocity fields.
     * @param {number} [deltaTime=0.0166667] - Frame time in seconds.
     * @returns {void}
     */
    update(deltaTime = 1 / 60) {
        const alpha = Math.min(1, Math.max(0, deltaTime) * this.smoothing);
        this.players.forEach(player => {
            if (!player.state || !player.displayState) return;
            ["x", "y", "vx", "vy"].forEach(field => {
                if (!Number.isFinite(player.state[field])) return;
                const current = Number.isFinite(player.displayState[field])
                    ? player.displayState[field]
                    : player.state[field];
                player.displayState[field] = current + ((player.state[field] - current) * alpha);
            });
            player.displayState = { ...player.state, ...player.displayState };
        });
    }

    /**
     * Returns render-ready remote player records.
     * @returns {Object[]} Visible interpolated player entries.
     */
    getPlayers() {
        return [...this.players.values()]
            .filter(player => player.displayState)
            .map(player => ({ ...player, ...player.displayState }));
    }

    /**
     * Removes subscriptions and known remote peers.
     * @returns {void}
     */
    dispose() {
        this.unsubscribe.forEach(unsubscribe => unsubscribe?.());
        this.unsubscribe = [];
        this.players.clear();
    }
}
