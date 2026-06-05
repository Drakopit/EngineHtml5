import { EventEmitter } from "../../CoreCross/EventEmitter.js";
import { NetworkClient } from "../NetworkClient.js";
import { NetworkMessage } from "../NetworkMessage.js";

/**
 * Adapter that carries `GameNetwork` messages through an external WebSocket relay.
 *
 * The relay is optional and replaceable; the game still owns world state and rules.
 *
 * @param {Object} [options] - Adapter settings.
 * @param {string|null} [options.url=null] - WebSocket relay URL.
 * @param {string} [options.roomId="main"] - Logical room identifier.
 * @param {Object} [options.peer={}] - Local peer profile.
 * @param {boolean} [options.autoReconnect=true] - Whether the low-level client reconnects.
 */
export class WebSocketClientAdapter extends EventEmitter {
    constructor({
        url = null,
        roomId = "main",
        peer = {},
        autoReconnect = true,
    } = {}) {
        super();
        this.url = url;
        this.roomId = roomId;
        this.peer = peer;
        this.autoReconnect = autoReconnect;
        this.client = null;
    }

    get IsConnected() {
        return this.client?.IsConnected === true;
    }

    setPeer(peer) {
        this.peer = { ...peer };
        return this;
    }

    setRoom(roomId) {
        this.roomId = roomId || "main";
        return this;
    }

    /**
     * Creates and connects the underlying WebSocket client.
     * @returns {WebSocketClientAdapter} This adapter.
     */
    connect() {
        if (!this.url) throw new Error("WebSocketClientAdapter.connect requires a url.");
        if (this.client) return this;

        this.client = new NetworkClient({
            url: this.url,
            autoReconnect: this.autoReconnect,
        });
        this.client.on("open", () => this.emit("open"));
        this.client.on("message", message => this.emit("message", message));
        this.client.on("error", error => this.emit("error", error));
        this.client.on("close", () => {
            this.emit("close");
            if (!this.client?.autoReconnect) this.client = null;
        });
        this.client.Connect();
        return this;
    }

    /**
     * Sends a room-aware message envelope to the relay.
     * @param {string} type - Message type.
     * @param {Object} [payload={}] - Serializable message body.
     * @returns {boolean|Object} `false` while offline, otherwise the sent envelope.
     */
    send(type, payload = {}) {
        if (!this.IsConnected) return false;

        return this.client.Send({
            ...NetworkMessage.Create(type, payload),
            roomId: this.roomId,
            peer: { ...this.peer },
        });
    }

    /**
     * Gracefully closes the underlying client.
     * @returns {WebSocketClientAdapter} This adapter.
     */
    disconnect() {
        if (!this.client) return this;
        if (this.IsConnected) this.send("peer:left", { peer: this.peer });
        this.client.Disconnect();
        this.client = null;
        return this;
    }
}
