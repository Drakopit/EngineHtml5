import { EventEmitter } from "../../CoreCross/EventEmitter.js";
import { NetworkMessage } from "../NetworkMessage.js";

/**
 * Same-origin multiplayer transport implemented with `BroadcastChannel`.
 *
 * It is useful for local demos and testing two browser tabs without an MMO
 * backend. Messages remain scoped to a room and do not leave the browser.
 *
 * @param {Object} [options] - Adapter settings.
 * @param {string} [options.roomId="main"] - Channel room identifier.
 * @param {Object} [options.peer={}] - Local public peer profile.
 * @param {string} [options.channelPrefix="gameforgejs-online"] - Browser channel namespace.
 */
export class LocalNetworkAdapter extends EventEmitter {
    constructor({
        roomId = "main",
        peer = {},
        channelPrefix = "gameforgejs-online",
    } = {}) {
        super();
        this.roomId = roomId;
        this.peer = peer;
        this.channelPrefix = channelPrefix;
        this.channel = null;
        this.pageHideHandler = () => this.disconnect();
        this.messageHandler = event => this.emit("message", event.data);
    }

    get IsConnected() {
        return Boolean(this.channel);
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
     * Opens the browser broadcast channel.
     * @returns {LocalNetworkAdapter} This adapter.
     */
    connect() {
        if (this.IsConnected) return this;
        if (typeof BroadcastChannel === "undefined") {
            throw new Error("LocalNetworkAdapter requires BroadcastChannel support.");
        }

        this.channel = new BroadcastChannel(`${this.channelPrefix}:${this.roomId}`);
        this.channel.addEventListener("message", this.messageHandler);
        globalThis.addEventListener?.("pagehide", this.pageHideHandler);
        this.emit("open");
        return this;
    }

    /**
     * Broadcasts an envelope to the other tabs in this room.
     * @param {string} type - Message type.
     * @param {Object} [payload={}] - Serializable message body.
     * @returns {boolean} Whether the channel was open.
     */
    send(type, payload = {}) {
        if (!this.IsConnected) return false;

        this.channel.postMessage({
            ...NetworkMessage.Create(type, payload),
            roomId: this.roomId,
            peer: { ...this.peer },
        });
        return true;
    }

    /**
     * Announces departure and releases the browser channel.
     * @returns {LocalNetworkAdapter} This adapter.
     */
    disconnect() {
        if (!this.IsConnected) return this;

        this.send("peer:left", { peer: this.peer });
        this.channel.removeEventListener("message", this.messageHandler);
        this.channel.close();
        this.channel = null;
        globalThis.removeEventListener?.("pagehide", this.pageHideHandler);
        this.emit("close");
        return this;
    }
}
