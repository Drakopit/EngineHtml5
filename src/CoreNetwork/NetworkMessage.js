/**
 * Creates and decodes transport-neutral message envelopes.
 *
 * Payload contents belong to the game; this utility only gives messages a
 * stable `type` and metadata shape.
 */
export class NetworkMessage {
    /**
     * Creates an envelope with an id and send timestamp.
     * @param {string} type - Application message type.
     * @param {Object} [payload={}] - Serializable body.
     * @param {Object} [meta={}] - Additional metadata.
     * @returns {Object} Message envelope.
     */
    static Create(type, payload = {}, meta = {}) {
        if (!type || typeof type !== "string") {
            throw new Error("NetworkMessage.Create requires a string type.");
        }

        return {
            type,
            payload,
            meta: {
                id: meta.id ?? this.CreateId(),
                sentAt: meta.sentAt ?? this.Now(),
                ...meta,
            },
        };
    }

    /**
     * Tests whether a value has the minimal envelope contract.
     * @param {*} value - Candidate value.
     * @returns {boolean} Whether the value is an envelope.
     */
    static IsEnvelope(value) {
        return Boolean(value)
            && typeof value === "object"
            && typeof value.type === "string"
            && "payload" in value;
    }

    /**
     * Encodes an envelope as JSON.
     * @param {Object} message - Message envelope.
     * @returns {string} JSON representation.
     */
    static Serialize(message) {
        return JSON.stringify(message);
    }

    /**
     * Parses JSON text, an ArrayBuffer or an existing envelope.
     * @param {string|ArrayBuffer|Object} data - Wire data.
     * @returns {Object} Message envelope.
     */
    static Parse(data) {
        if (typeof data === "string") {
            return JSON.parse(data);
        }

        if (data instanceof ArrayBuffer) {
            return JSON.parse(new TextDecoder().decode(data));
        }

        if (this.IsEnvelope(data)) {
            return data;
        }

        throw new Error("Unsupported network message format.");
    }

    static CreateId(prefix = "msg") {
        if (globalThis.crypto?.randomUUID) {
            return `${prefix}_${globalThis.crypto.randomUUID()}`;
        }

        const random = Math.random().toString(36).slice(2);
        return `${prefix}_${Date.now().toString(36)}_${random}`;
    }

    static Now() {
        return globalThis.performance?.now?.() ?? Date.now();
    }
}
