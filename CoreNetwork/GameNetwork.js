import { EventEmitter } from "../CoreCross/EventEmitter.js";
import { NetworkMessage } from "./NetworkMessage.js";

const PEER_MESSAGE = Object.freeze({
    HELLO: "peer:hello",
    PRESENT: "peer:present",
    PROFILE: "peer:profile",
    LEFT: "peer:left",
});

/**
 * High-level multiplayer session API built on a replaceable transport adapter.
 *
 * `GameNetwork` discovers peers in a room and forwards game-defined messages.
 * It does not contain maps, entities or gameplay rules.
 *
 * @param {Object} [options] - Initial network settings.
 * @param {Object|null} [options.adapter=null] - Adapter implementing connect, disconnect and send.
 * @param {string} [options.roomId="main"] - Logical room shared by connected peers.
 * @param {Object} [options.peer={}] - Local peer profile such as a display name.
 * @example
 * const network = new GameNetwork({
 *     adapter: new LocalNetworkAdapter(),
 *     peer: { name: "Ada" },
 * });
 * network.onPlayerStateReceived((peerId, state) => players.updateState(peerId, state));
 * network.connect();
 */
export class GameNetwork extends EventEmitter {
    constructor({
        adapter = null,
        roomId = "main",
        peer = {},
    } = {}) {
        super();
        this.roomId = roomId;
        this.peer = {
            id: peer.id ?? NetworkMessage.CreateId("peer"),
            ...peer,
            name: peer.name ?? "Player",
        };
        this.peers = new Map();
        this.adapter = null;
        this.unsubscribe = [];

        if (adapter) this.useAdapter(adapter);
    }

    get IsConnected() {
        return this.adapter?.IsConnected === true;
    }

    /**
     * Selects the transport used by this session.
     * @param {Object} adapter - A LocalNetworkAdapter, WebSocketClientAdapter or compatible adapter.
     * @returns {GameNetwork} This network instance.
     */
    useAdapter(adapter) {
        if (!adapter) throw new Error("GameNetwork.useAdapter requires an adapter.");
        this.unbindAdapter();
        this.adapter = adapter;
        this.adapter.setRoom?.(this.roomId);
        this.adapter.setPeer?.(this.peer);
        this.unsubscribe = [
            adapter.on("open", () => this.handleOpen()),
            adapter.on("message", message => this.handleMessage(message)),
            adapter.on("close", () => this.emit("disconnected")),
            adapter.on("error", error => this.emit("error", error)),
        ];
        return this;
    }

    /**
     * Opens the selected adapter and starts peer discovery.
     * @returns {GameNetwork} This network instance.
     */
    connect() {
        if (!this.adapter) throw new Error("GameNetwork.connect requires an adapter.");
        this.adapter.connect();
        return this;
    }

    /**
     * Closes the adapter and forgets discovered remote peers.
     * @returns {GameNetwork} This network instance.
     */
    disconnect() {
        this.adapter?.disconnect();
        this.peers.clear();
        return this;
    }

    createRoom(roomId) {
        return this.joinRoom(roomId);
    }

    joinRoom(roomId) {
        const reconnect = this.IsConnected;
        if (reconnect) this.disconnect();
        this.roomId = roomId || "main";
        this.adapter?.setRoom?.(this.roomId);
        if (reconnect) this.connect();
        return this;
    }

    /**
     * Updates the local public identity and informs connected peers.
     * @param {Object} profile - Public peer fields such as `name`.
     * @returns {GameNetwork} This network instance.
     */
    setPeerProfile(profile = {}) {
        this.peer = {
            ...this.peer,
            ...profile,
            id: this.peer.id,
        };
        this.adapter?.setPeer?.(this.peer);
        if (this.IsConnected) this.send(PEER_MESSAGE.PROFILE, { peer: this.peer });
        return this;
    }

    /**
     * Sends an application message to peers in the current room.
     * @param {string} type - Message channel name.
     * @param {Object} [payload={}] - Game-owned serializable payload.
     * @returns {boolean} Whether an adapter accepted the message.
     */
    send(type, payload = {}) {
        if (!this.IsConnected) return false;
        return this.adapter.send(type, payload);
    }

    /**
     * Sends the local player's small replicated state payload.
     * @param {Object} state - Game-selected state such as position and animation.
     * @returns {boolean} Whether the message was submitted.
     */
    sendPlayerState(state) {
        return this.send("playerState", state);
    }

    onConnected(callback) {
        return this.on("connected", callback);
    }

    onPeerJoined(callback) {
        return this.on("peer:joined", callback);
    }

    onPeerLeft(callback) {
        return this.on("peer:left", callback);
    }

    onPeerUpdated(callback) {
        return this.on("peer:updated", callback);
    }

    onPlayerStateReceived(callback) {
        return this.on("playerState", callback);
    }

    handleOpen() {
        this.emit("connected", this.peer);
        this.send(PEER_MESSAGE.HELLO, { peer: this.peer });
    }

    handleMessage(message) {
        if (!NetworkMessage.IsEnvelope(message)) return;

        const sender = message.peer ?? message.payload?.peer;
        if (!sender?.id || sender.id === this.peer.id) return;

        if (message.type === PEER_MESSAGE.HELLO) {
            this.registerPeer(sender);
            this.send(PEER_MESSAGE.PRESENT, { peer: this.peer });
            return;
        }

        if (message.type === PEER_MESSAGE.PRESENT || message.type === PEER_MESSAGE.PROFILE) {
            this.registerPeer(sender);
            return;
        }

        if (message.type === PEER_MESSAGE.LEFT) {
            this.removePeer(sender.id);
            return;
        }

        this.registerPeer(sender);
        this.emit(message.type, sender.id, message.payload, sender);
    }

    registerPeer(peer) {
        const current = this.peers.get(peer.id);
        const next = { ...current, ...peer };
        this.peers.set(peer.id, next);
        if (!current) {
            this.emit("peer:joined", next);
            return;
        }

        const changed = Object.keys(peer).some(key => current[key] !== peer[key]);
        if (changed) this.emit("peer:updated", next);
    }

    removePeer(peerId) {
        const peer = this.peers.get(peerId);
        if (!peer) return;
        this.peers.delete(peerId);
        this.emit("peer:left", peerId, peer);
    }

    unbindAdapter() {
        this.unsubscribe.forEach(unsubscribe => unsubscribe?.());
        this.unsubscribe = [];
    }
}
