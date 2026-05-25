import { Config } from "../CoreCross/Config.js";
import { EventEmitter } from "../CoreCross/EventEmitter.js";
import { NetworkMessage } from "./NetworkMessage.js";

/**
 * Lifecycle states emitted by `NetworkClient`.
 * @type {Object<string, string>}
 */
export const NETWORK_CLIENT_STATE = Object.freeze({
    IDLE: "idle",
    CONNECTING: "connecting",
    OPEN: "open",
    CLOSING: "closing",
    CLOSED: "closed",
});

/**
 * Low-level WebSocket client for message envelopes and optional request/reply calls.
 *
 * Games normally consume `GameNetwork` and an adapter instead of this transport
 * primitive directly.
 *
 * @param {Object} [options] - Client connection settings.
 * @param {string|null} [options.url=null] - WebSocket endpoint.
 * @param {boolean} [options.autoConnect=false] - Connect during construction.
 * @param {boolean} [options.autoReconnect=false] - Retry unexpected connection losses.
 * @param {Function|null} [options.serializer=null] - Envelope-to-wire converter.
 * @param {Function|null} [options.parser=null] - Wire-to-envelope converter.
 */
export class NetworkClient extends EventEmitter {
    constructor({
        url = null,
        protocols = null,
        autoConnect = false,
        autoReconnect = false,
        reconnectDelay = 1000,
        maxReconnectDelay = 8000,
        serializer = null,
        parser = null,
        codec = null,
        binaryType = null,
    } = {}) {
        super();
        this.url = url;
        this.protocols = protocols;
        this.autoReconnect = autoReconnect;
        this.reconnectDelay = reconnectDelay;
        this.maxReconnectDelay = maxReconnectDelay;
        this.codec = codec;
        this.serializer = serializer ?? (codec ? message => codec.Encode(message) : message => NetworkMessage.Serialize(message));
        this.parser = parser ?? (codec ? data => codec.Decode(data) : data => NetworkMessage.Parse(data));
        this.binaryType = binaryType ?? codec?.binaryType ?? "arraybuffer";
        this.socket = null;
        this.state = NETWORK_CLIENT_STATE.IDLE;
        this.pendingRequests = new Map();
        this.reconnectTimer = null;
        this.currentReconnectDelay = reconnectDelay;
        this.intentionalClose = false;

        if (autoConnect) this.Connect();
    }

    /**
     * Constructs a client using `Config.data.network` compatible properties.
     * @param {Object} [config] - Network configuration object.
     * @returns {NetworkClient} Configured client.
     */
    static FromConfig(config = Config.data?.network ?? {}) {
        return new NetworkClient({
            url: config.serverUrl ?? config.url ?? null,
            autoConnect: config.autoConnect ?? false,
            autoReconnect: config.autoReconnect ?? false,
            reconnectDelay: config.reconnectDelay ?? 1000,
            maxReconnectDelay: config.maxReconnectDelay ?? 8000,
        });
    }

    get IsConnected() {
        return typeof WebSocket !== "undefined" && this.socket?.readyState === WebSocket.OPEN;
    }

    /**
     * Opens a WebSocket connection.
     * @param {string} [url] - Endpoint override.
     * @param {string|string[]} [protocols] - WebSocket subprotocol override.
     * @returns {NetworkClient} This client.
     */
    Connect(url = this.url, protocols = this.protocols) {
        if (!url) throw new Error("NetworkClient.Connect requires a url.");
        if (typeof WebSocket === "undefined") throw new Error("WebSocket is not available in this runtime.");
        if (this.socket?.readyState === WebSocket.OPEN || this.socket?.readyState === WebSocket.CONNECTING) {
            return this;
        }

        this.url = url;
        this.protocols = protocols;
        this.intentionalClose = false;
        this.SetState(NETWORK_CLIENT_STATE.CONNECTING);

        this.socket = protocols
            ? new WebSocket(url, protocols)
            : new WebSocket(url);
        this.socket.binaryType = this.binaryType;

        this.socket.addEventListener("open", event => this.HandleOpen(event));
        this.socket.addEventListener("message", event => this.HandleMessage(event));
        this.socket.addEventListener("error", event => this.HandleError(event));
        this.socket.addEventListener("close", event => this.HandleClose(event));

        return this;
    }

    /**
     * Stops reconnection and closes the socket.
     * @param {number} [code=1000] - WebSocket close code.
     * @param {string} [reason="client disconnect"] - Close reason.
     * @returns {NetworkClient} This client.
     */
    Disconnect(code = 1000, reason = "client disconnect") {
        this.intentionalClose = true;
        this.ClearReconnect();
        this.RejectPendingRequests(new Error("NetworkClient disconnected."));

        if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
            this.SetState(NETWORK_CLIENT_STATE.CLOSED);
            return this;
        }

        this.SetState(NETWORK_CLIENT_STATE.CLOSING);
        this.socket.close(code, reason);
        return this;
    }

    /**
     * Sends a message envelope or creates one from a type and payload.
     * @param {string|Object} type - Type name or complete envelope.
     * @param {Object} [payload={}] - Serializable payload.
     * @param {Object} [meta={}] - Envelope metadata.
     * @returns {Object|boolean} Sent envelope, or `false` while disconnected.
     */
    Send(type, payload = {}, meta = {}) {
        const message = NetworkMessage.IsEnvelope(type)
            ? type
            : NetworkMessage.Create(type, payload, meta);

        if (!this.IsConnected) {
            this.emit("send:error", message, new Error("NetworkClient is not connected."));
            return false;
        }

        this.socket.send(this.serializer(message));
        this.emit("send", message);
        return message;
    }

    /**
     * Sends a correlated message and waits for its matching reply.
     * @param {string} type - Request message type.
     * @param {Object} [payload={}] - Serializable request data.
     * @param {Object} [options] - Timeout and expected response type.
     * @returns {Promise<Object>} Reply envelope.
     */
    Request(type, payload = {}, { timeout = 5000, responseType = null } = {}) {
        const correlationId = NetworkMessage.CreateId("req");
        const message = NetworkMessage.Create(type, payload, { correlationId });

        return new Promise((resolve, reject) => {
            const timeoutId = timeout > 0
                ? setTimeout(() => {
                    this.pendingRequests.delete(correlationId);
                    reject(new Error(`Network request timed out: ${type}`));
                }, timeout)
                : null;

            this.pendingRequests.set(correlationId, {
                resolve,
                reject,
                responseType,
                timeoutId,
            });

            if (!this.Send(message)) {
                this.pendingRequests.delete(correlationId);
                if (timeoutId) clearTimeout(timeoutId);
                reject(new Error(`Network request could not be sent: ${type}`));
            }
        });
    }

    /**
     * Responds to a previously received request envelope.
     * @param {Object} requestMessage - Envelope carrying correlation metadata.
     * @param {string} type - Response type.
     * @param {Object} [payload={}] - Serializable response data.
     * @param {Object} [meta={}] - Additional response metadata.
     * @returns {Object|boolean} Sent response or `false`.
     */
    Reply(requestMessage, type, payload = {}, meta = {}) {
        const replyTo = requestMessage?.meta?.correlationId
            ?? requestMessage?.meta?.id
            ?? requestMessage?.id;

        return this.Send(type, payload, { ...meta, replyTo });
    }

    HandleOpen(event) {
        this.currentReconnectDelay = this.reconnectDelay;
        this.SetState(NETWORK_CLIENT_STATE.OPEN);
        this.emit("open", event);
    }

    HandleMessage(event) {
        let message = null;

        try {
            message = this.parser(event.data);
        } catch (error) {
            this.emit("message:error", error, event.data);
            return;
        }

        this.ResolvePendingRequest(message);
        this.emit("message", message);
        this.emit(message.type, message);
    }

    HandleError(event) {
        this.emit("error", event);
    }

    HandleClose(event) {
        this.SetState(NETWORK_CLIENT_STATE.CLOSED);
        this.socket = null;
        this.emit("close", event);

        if (this.autoReconnect && !this.intentionalClose) {
            this.ScheduleReconnect();
        } else {
            this.RejectPendingRequests(new Error("NetworkClient connection closed."));
        }
    }

    ResolvePendingRequest(message) {
        const replyTo = message?.meta?.replyTo ?? message?.meta?.correlationId;
        if (!replyTo || !this.pendingRequests.has(replyTo)) return;

        const pending = this.pendingRequests.get(replyTo);
        if (pending.responseType && pending.responseType !== message.type) return;

        this.pendingRequests.delete(replyTo);
        if (pending.timeoutId) clearTimeout(pending.timeoutId);
        pending.resolve(message);
    }

    RejectPendingRequests(error) {
        this.pendingRequests.forEach(pending => {
            if (pending.timeoutId) clearTimeout(pending.timeoutId);
            pending.reject(error);
        });
        this.pendingRequests.clear();
    }

    ScheduleReconnect() {
        this.ClearReconnect();
        this.reconnectTimer = setTimeout(() => {
            this.Connect();
            this.currentReconnectDelay = Math.min(this.currentReconnectDelay * 2, this.maxReconnectDelay);
        }, this.currentReconnectDelay);
    }

    ClearReconnect() {
        if (!this.reconnectTimer) return;
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
    }

    SetState(state) {
        if (this.state === state) return;
        const previous = this.state;
        this.state = state;
        this.emit("state", state, previous);
    }
}
