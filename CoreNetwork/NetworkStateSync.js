import { NetworkMessage } from "./NetworkMessage.js";

/**
 * Periodically broadcasts snapshots of small tracked objects through a network client.
 *
 * This generic helper reads and writes selected fields only; it has no knowledge
 * of entities, maps or simulation.
 *
 * @param {Object} [options] - Synchronization settings.
 * @param {NetworkClient|null} [options.client=null] - Client used to send snapshots.
 * @param {string} [options.channel="state:sync"] - Envelope type for snapshots.
 * @param {string} [options.id] - Local source identifier.
 * @param {number} [options.tickRate=20] - Snapshot broadcasts per second.
 */
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

    /**
     * Tracks state with game-provided reader and optional writer callbacks.
     * @param {string} id - Entity identifier inside snapshots.
     * @param {Object} callbacks - State callbacks.
     * @param {Function} callbacks.read - Produces serializable state.
     * @param {Function|null} [callbacks.write=null] - Applies remote state.
     * @returns {NetworkStateSync} This synchronizer.
     */
    Track(id, { read, write = null } = {}) {
        if (!id) throw new Error("NetworkStateSync.Track requires an id.");
        if (typeof read !== "function") throw new Error("NetworkStateSync.Track requires a read function.");

        this.tracked.set(id, { read, write });
        return this;
    }

    /**
     * Tracks common fields on a plain target object.
     * @param {string} id - Entity identifier.
     * @param {Object} target - Target object.
     * @param {string[]} [fields] - Replicated property names.
     * @returns {NetworkStateSync} This synchronizer.
     */
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

    /**
     * Produces the current serializable entity snapshot.
     * @returns {Object} Snapshot containing source, timestamp and entities.
     */
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

    /**
     * Sends one current snapshot.
     * @param {Object} [meta={}] - Message envelope metadata.
     * @returns {Object|boolean} Sent envelope or `false` without a client.
     */
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
