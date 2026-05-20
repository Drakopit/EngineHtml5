import { NetworkMessage } from "./NetworkMessage.js";

export class NetworkStateSync {
    constructor({
        client = null,
        channel = "state:sync",
        id = NetworkMessage.CreateId("peer"),
        tickRate = 20,
        listen = true,
    } = {}) {
        this.client = client;
        this.channel = channel;
        this.id = id;
        this.tickRate = tickRate;
        this.tracked = new Map();
        this.timer = null;
        this.lastSnapshot = null;

        if (listen && this.client) {
            this.client.on(this.channel, message => this.Apply(message.payload));
        }
    }

    Track(id, { read, write = null } = {}) {
        if (!id) throw new Error("NetworkStateSync.Track requires an id.");
        if (typeof read !== "function") throw new Error("NetworkStateSync.Track requires a read function.");

        this.tracked.set(id, { read, write });
        return this;
    }

    TrackObject(id, target, fields = ["position", "rotation", "scale"]) {
        return this.Track(id, {
            read: () => this.ReadFields(target, fields),
            write: state => this.WriteFields(target, state),
        });
    }

    Untrack(id) {
        this.tracked.delete(id);
        return this;
    }

    Snapshot() {
        const entities = {};
        this.tracked.forEach((entry, id) => {
            entities[id] = entry.read();
        });

        this.lastSnapshot = {
            source: this.id,
            sentAt: NetworkMessage.Now(),
            entities,
        };

        return this.lastSnapshot;
    }

    Broadcast(meta = {}) {
        if (!this.client) return false;
        return this.client.Send(this.channel, this.Snapshot(), meta);
    }

    Apply(snapshot) {
        if (!snapshot?.entities || snapshot.source === this.id) return;

        Object.entries(snapshot.entities).forEach(([id, state]) => {
            const entry = this.tracked.get(id);
            if (entry?.write) entry.write(state, snapshot);
        });
    }

    Start() {
        if (this.timer) return this;

        const interval = 1000 / Math.max(1, this.tickRate);
        this.timer = setInterval(() => this.Broadcast(), interval);
        return this;
    }

    Stop() {
        if (!this.timer) return this;
        clearInterval(this.timer);
        this.timer = null;
        return this;
    }

    ReadFields(target, fields) {
        return fields.reduce((state, field) => {
            const value = target?.[field];
            state[field] = Array.isArray(value)
                ? [...value]
                : this.ClonePlainValue(value);
            return state;
        }, {});
    }

    WriteFields(target, state) {
        if (!target || !state) return;

        Object.entries(state).forEach(([field, value]) => {
            if (Array.isArray(value)) {
                target[field] = [...value];
                return;
            }

            if (this.IsPlainObject(value)) {
                target[field] = { ...(target[field] ?? {}), ...value };
                return;
            }

            target[field] = value;
        });
    }

    ClonePlainValue(value) {
        if (!this.IsPlainObject(value)) return value;
        return { ...value };
    }

    IsPlainObject(value) {
        return Boolean(value) && typeof value === "object" && !Array.isArray(value);
    }
}
