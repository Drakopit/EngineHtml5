import { EventEmitter } from "../../CoreCross/EventEmitter.js";
import { NetworkClient } from "../NetworkClient.js";
import { NetworkMessage } from "../NetworkMessage.js";
import { BinaryNetworkCodec } from "../Codec/BinaryNetworkCodec.js";
import { NetworkSnapshotBuffer } from "../Interpolation/NetworkSnapshotBuffer.js";
import { NETWORK_MESSAGE } from "../Protocol/NetworkProtocol.js";

export class NetworkRoomClient extends EventEmitter {
    constructor({
        url = null,
        roomId = "default",
        name = "Player",
        colorIndex = 0,
        width = 22,
        height = 42,
        syncRate = 15,
        interpolationDelay = 120,
        autoReconnect = true,
        codec = new BinaryNetworkCodec(),
    } = {}) {
        super();
        this.url = url;
        this.roomId = roomId;
        this.profile = {
            id: null,
            slot: null,
            name,
            colorIndex,
            width,
            height,
        };
        this.syncRate = syncRate;
        this.interpolationDelay = interpolationDelay;
        this.lastSentAt = 0;
        this.lastSentState = null;
        this.remotePlayers = new Map();
        this.client = new NetworkClient({
            url,
            autoReconnect,
            codec,
        });

        this.BindClientEvents();
    }

    get IsConnected() {
        return this.client.IsConnected;
    }

    Connect(url = this.url) {
        this.url = url;
        this.client.Connect(url);
        return this;
    }

    Disconnect() {
        this.client.Disconnect();
        return this;
    }

    SendPlayerProfile(profile = {}) {
        this.profile = {
            ...this.profile,
            ...profile,
            name: this.NormalizeName(profile.name ?? this.profile.name),
        };

        if (!this.IsConnected) return false;
        return this.client.Send(NETWORK_MESSAGE.PLAYER_PROFILE, this.profile);
    }

    SendPlayerState(state = {}, { force = false } = {}) {
        if (!this.IsConnected) return false;

        const now = NetworkMessage.Now();
        const minInterval = 1000 / Math.max(1, this.syncRate);
        if (!force && now - this.lastSentAt < minInterval) return false;

        const payload = {
            x: state.x,
            y: state.y,
            vx: state.vx ?? 0,
            vy: state.vy ?? 0,
            grounded: Boolean(state.grounded),
            facingRight: state.facingRight !== false,
            colorIndex: state.colorIndex ?? this.profile.colorIndex,
        };

        if (!force && !this.HasMeaningfulStateChange(payload)) return false;

        this.lastSentAt = now;
        this.lastSentState = { ...payload };
        return this.client.Send(NETWORK_MESSAGE.PLAYER_STATE, payload);
    }

    SetBlock(block) {
        if (!this.IsConnected) return false;
        return this.client.Send(NETWORK_MESSAGE.WORLD_BLOCK_SET, block);
    }

    Say(text) {
        if (!this.IsConnected) return false;
        return this.client.Send(NETWORK_MESSAGE.CHAT_SAY, { text });
    }

    GetRemotePlayers(now = NetworkMessage.Now()) {
        return [...this.remotePlayers.values()]
            .map(entry => {
                const state = entry.buffer.Sample(now);
                return state ? { ...entry.profile, ...state } : null;
            })
            .filter(Boolean);
    }

    BindClientEvents() {
        ["open", "close", "error", "state", "message", "send", "send:error"].forEach(eventName => {
            this.client.on(eventName, (...args) => this.emit(eventName, ...args));
        });

        this.client.on("open", () => {
            this.SendPlayerProfile();
        });
        this.client.on(NETWORK_MESSAGE.ROOM_WELCOME, message => this.HandleWelcome(message.payload));
        this.client.on(NETWORK_MESSAGE.PLAYER_PROFILE, message => this.HandlePlayerProfile(message.payload));
        this.client.on(NETWORK_MESSAGE.PLAYER_JOINED, message => this.HandlePlayerProfile(message.payload));
        this.client.on(NETWORK_MESSAGE.PLAYER_UPDATE, message => this.HandlePlayerState(message.payload));
        this.client.on(NETWORK_MESSAGE.PLAYER_LEFT, message => this.HandlePlayerLeft(message.payload));
        this.client.on(NETWORK_MESSAGE.WORLD_BLOCK_SET, message => this.emit(NETWORK_MESSAGE.WORLD_BLOCK_SET, message.payload));
        this.client.on(NETWORK_MESSAGE.CHAT_SAY, message => this.emit(NETWORK_MESSAGE.CHAT_SAY, message.payload));
    }

    HandleWelcome(payload = {}) {
        this.profile.id = payload.playerId ?? payload.player?.id ?? this.profile.id;
        this.profile.slot = payload.playerSlot ?? payload.player?.slot ?? this.profile.slot;

        payload.players?.forEach(player => {
            if (player.id === this.profile.id || player.slot === this.profile.slot) return;
            this.HandlePlayerProfile(player);
            this.HandlePlayerState(player);
        });

        this.SendPlayerProfile();
        this.emit(NETWORK_MESSAGE.ROOM_WELCOME, payload);
    }

    HandlePlayerProfile(profile = {}) {
        const key = this.GetRemoteKey(profile);
        if (key === null || profile.id === this.profile.id || profile.slot === this.profile.slot) return;

        const entry = this.GetOrCreateRemotePlayer(key);
        entry.profile = {
            ...entry.profile,
            ...profile,
            name: this.NormalizeName(profile.name ?? entry.profile.name),
        };
        this.emit(NETWORK_MESSAGE.PLAYER_PROFILE, entry.profile);
    }

    HandlePlayerState(state = {}) {
        const key = this.GetRemoteKey(state);
        if (key === null || state.id === this.profile.id || state.slot === this.profile.slot) return;

        const entry = this.GetOrCreateRemotePlayer(key);
        entry.profile = {
            ...entry.profile,
            id: state.id ?? entry.profile.id,
            slot: state.slot ?? entry.profile.slot,
            colorIndex: state.colorIndex ?? entry.profile.colorIndex,
            name: this.NormalizeName(state.name ?? entry.profile.name),
        };

        if (!Number.isFinite(Number(state.x)) || !Number.isFinite(Number(state.y))) return;

        entry.buffer.Push(state);
        this.emit(NETWORK_MESSAGE.PLAYER_UPDATE, { ...entry.profile, ...state });
    }

    HandlePlayerLeft(payload = {}) {
        const key = this.GetRemoteKey(payload);
        if (key !== null) this.remotePlayers.delete(key);
        this.emit(NETWORK_MESSAGE.PLAYER_LEFT, payload);
    }

    GetOrCreateRemotePlayer(key) {
        if (!this.remotePlayers.has(key)) {
            this.remotePlayers.set(key, {
                profile: {
                    id: null,
                    slot: typeof key === "number" ? key : null,
                    name: "Player",
                    colorIndex: 0,
                    width: this.profile.width,
                    height: this.profile.height,
                },
                buffer: new NetworkSnapshotBuffer({
                    interpolationDelay: this.interpolationDelay,
                }),
            });
        }

        return this.remotePlayers.get(key);
    }

    GetRemoteKey(payload = {}) {
        if (Number.isFinite(payload.slot)) return Number(payload.slot);
        if (payload.id) return String(payload.id);
        return null;
    }

    HasMeaningfulStateChange(next) {
        if (!this.lastSentState) return true;

        return Math.abs((next.x ?? 0) - (this.lastSentState.x ?? 0)) >= 0.25
            || Math.abs((next.y ?? 0) - (this.lastSentState.y ?? 0)) >= 0.25
            || Math.abs((next.vx ?? 0) - (this.lastSentState.vx ?? 0)) >= 1
            || Math.abs((next.vy ?? 0) - (this.lastSentState.vy ?? 0)) >= 1
            || next.grounded !== this.lastSentState.grounded
            || next.facingRight !== this.lastSentState.facingRight
            || next.colorIndex !== this.lastSentState.colorIndex;
    }

    NormalizeName(name) {
        return String(name || "Player")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 18) || "Player";
    }
}
