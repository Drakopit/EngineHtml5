import { NetworkMessage } from "../NetworkMessage.js";

export class NetworkSnapshotBuffer {
    constructor({
        interpolationDelay = 120,
        maxAge = 1200,
    } = {}) {
        this.interpolationDelay = interpolationDelay;
        this.maxAge = maxAge;
        this.snapshots = [];
    }

    Push(state, time = NetworkMessage.Now()) {
        if (!state) return this;

        this.snapshots.push({
            time,
            state: { ...state },
        });

        this.snapshots.sort((a, b) => a.time - b.time);
        this.Trim(time);
        return this;
    }

    Sample(now = NetworkMessage.Now()) {
        if (this.snapshots.length === 0) return null;

        const targetTime = now - this.interpolationDelay;
        const first = this.snapshots[0];
        const last = this.snapshots[this.snapshots.length - 1];

        if (targetTime <= first.time || this.snapshots.length === 1) {
            return { ...first.state };
        }

        if (targetTime >= last.time) {
            return { ...last.state };
        }

        for (let index = 1; index < this.snapshots.length; index++) {
            const previous = this.snapshots[index - 1];
            const next = this.snapshots[index];
            if (targetTime > next.time) continue;

            const span = Math.max(1, next.time - previous.time);
            const alpha = Math.max(0, Math.min(1, (targetTime - previous.time) / span));
            return this.Interpolate(previous.state, next.state, alpha);
        }

        return { ...last.state };
    }

    Clear() {
        this.snapshots.length = 0;
    }

    Trim(now = NetworkMessage.Now()) {
        const oldestAllowed = now - this.maxAge;
        while (this.snapshots.length > 2 && this.snapshots[0].time < oldestAllowed) {
            this.snapshots.shift();
        }
    }

    Interpolate(previous, next, alpha) {
        const state = { ...previous, ...next };
        ["x", "y", "vx", "vy"].forEach(field => {
            if (!Number.isFinite(previous[field]) || !Number.isFinite(next[field])) return;
            state[field] = previous[field] + ((next[field] - previous[field]) * alpha);
        });

        return state;
    }
}
