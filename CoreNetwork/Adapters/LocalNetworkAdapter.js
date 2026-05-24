import { EventEmitter } from "../../CoreCross/EventEmitter.js";
import { NetworkMessage } from "../NetworkMessage.js";

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

    send(type, payload = {}) {
        if (!this.IsConnected) return false;

        this.channel.postMessage({
            ...NetworkMessage.Create(type, payload),
            roomId: this.roomId,
            peer: { ...this.peer },
        });
        return true;
    }

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
