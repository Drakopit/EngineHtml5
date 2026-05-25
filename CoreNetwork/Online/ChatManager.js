import { EventEmitter } from "../../CoreCross/EventEmitter.js";

/**
 * Reusable online text chat service connected to a `GameNetwork` session.
 *
 * It owns message normalization and system notices, while a game supplies its
 * own canvas UI such as `ChatWindow`.
 *
 * @param {GameNetwork} network - Active high-level network session.
 * @param {Object} [options] - Chat constraints.
 * @param {number} [options.maxLength=120] - Maximum transmitted text length.
 */
export class ChatManager extends EventEmitter {
    constructor(network, { maxLength = 120 } = {}) {
        super();
        if (!network) throw new Error("ChatManager requires a GameNetwork instance.");

        this.network = network;
        this.maxLength = maxLength;
        this.unsubscribe = [
            network.on("chatMessage", (peerId, payload, peer) => this.receiveMessage(peerId, payload, peer)),
            network.onPeerJoined(peer => this.addSystemMessage(`${peer.name ?? "Player"} joined.`)),
            network.onPeerLeft((peerId, peer) => this.addSystemMessage(`${peer?.name ?? "Player"} left.`)),
        ];
    }

    /**
     * Emits a local chat message and relays it to connected peers.
     * @param {string} text - User-entered message.
     * @returns {boolean} Whether non-empty text was accepted.
     */
    sendMessage(text) {
        const normalized = this.normalizeText(text);
        if (!normalized) return false;

        const message = {
            playerId: this.network.peer.id,
            playerName: this.network.peer.name ?? "Player",
            text: normalized,
            system: false,
        };
        this.emit("message", message);
        this.network.send("chatMessage", { text: normalized });
        return true;
    }

    /**
     * Subscribes to local, remote and system chat messages.
     * @param {Function} callback - Receives a normalized chat message.
     * @returns {Function} Unsubscribe callback.
     */
    onMessageReceived(callback) {
        return this.on("message", callback);
    }

    /**
     * Emits an informational message without transmitting it.
     * @param {string} text - Notice content.
     * @returns {void}
     */
    addSystemMessage(text) {
        this.emit("message", {
            playerId: null,
            playerName: "System",
            text: this.normalizeText(text),
            system: true,
        });
    }

    receiveMessage(peerId, payload, peer) {
        const text = this.normalizeText(payload?.text);
        if (!text) return;

        this.emit("message", {
            playerId: peerId,
            playerName: peer?.name ?? "Player",
            text,
            system: false,
        });
    }

    normalizeText(text) {
        return String(text ?? "")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, this.maxLength);
    }

    /**
     * Releases subscriptions created by this service.
     * @returns {void}
     */
    dispose() {
        this.unsubscribe.forEach(unsubscribe => unsubscribe?.());
        this.unsubscribe = [];
    }
}
