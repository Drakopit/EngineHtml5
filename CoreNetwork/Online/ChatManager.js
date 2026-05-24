import { EventEmitter } from "../../CoreCross/EventEmitter.js";

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

    onMessageReceived(callback) {
        return this.on("message", callback);
    }

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

    dispose() {
        this.unsubscribe.forEach(unsubscribe => unsubscribe?.());
        this.unsubscribe = [];
    }
}
