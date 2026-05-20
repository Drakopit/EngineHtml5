export class NetworkMessage {
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

    static IsEnvelope(value) {
        return Boolean(value)
            && typeof value === "object"
            && typeof value.type === "string"
            && "payload" in value;
    }

    static Serialize(message) {
        return JSON.stringify(message);
    }

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
