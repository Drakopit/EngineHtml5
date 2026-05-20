import { NetworkMessage } from "../NetworkMessage.js";
import {
    NETWORK_BINARY_TYPE,
    NETWORK_FIXED_POINT,
    NETWORK_MESSAGE,
    NETWORK_PROTOCOL_VERSION,
    NetworkProtocol,
} from "../Protocol/NetworkProtocol.js";
import { JsonNetworkCodec } from "./JsonNetworkCodec.js";

const CLIENT_PLAYER_STATE_BYTES = 14;
const REMOTE_PLAYER_STATE_BYTES = 16;

export class BinaryNetworkCodec {
    constructor({ jsonCodec = new JsonNetworkCodec() } = {}) {
        this.jsonCodec = jsonCodec;
        this.sequence = 0;
    }

    get binaryType() {
        return "arraybuffer";
    }

    Encode(message) {
        if (message?.type === NETWORK_MESSAGE.PLAYER_STATE) {
            return this.EncodePlayerState(message.payload);
        }

        return this.jsonCodec.Encode(message);
    }

    Decode(data) {
        const buffer = this.ToArrayBuffer(data);
        if (!buffer) return this.jsonCodec.Decode(data);

        const view = new DataView(buffer);
        if (view.byteLength >= 2 && view.getUint8(0) === NETWORK_PROTOCOL_VERSION) {
            const binaryType = view.getUint8(1);

            if (binaryType === NETWORK_BINARY_TYPE.REMOTE_PLAYER_STATE) {
                return this.DecodeRemotePlayerState(view);
            }

            if (binaryType === NETWORK_BINARY_TYPE.PLAYER_STATE) {
                return this.DecodePlayerState(view);
            }
        }

        return this.jsonCodec.Decode(buffer);
    }

    EncodePlayerState(payload = {}) {
        const buffer = new ArrayBuffer(CLIENT_PLAYER_STATE_BYTES);
        const view = new DataView(buffer);
        const sequence = this.NextSequence();

        view.setUint8(0, NETWORK_PROTOCOL_VERSION);
        view.setUint8(1, NETWORK_BINARY_TYPE.PLAYER_STATE);
        view.setUint16(2, sequence, false);
        view.setInt16(4, this.ToFixedInt16(payload.x, NETWORK_FIXED_POINT.POSITION_SCALE), false);
        view.setInt16(6, this.ToFixedInt16(payload.y, NETWORK_FIXED_POINT.POSITION_SCALE), false);
        view.setInt16(8, this.ToFixedInt16(payload.vx, NETWORK_FIXED_POINT.VELOCITY_SCALE), false);
        view.setInt16(10, this.ToFixedInt16(payload.vy, NETWORK_FIXED_POINT.VELOCITY_SCALE), false);
        view.setUint8(12, NetworkProtocol.EncodePlayerFlags(payload));
        view.setUint8(13, this.ToUint8(payload.colorIndex));

        return buffer;
    }

    DecodePlayerState(view) {
        if (view.byteLength < CLIENT_PLAYER_STATE_BYTES) {
            throw new Error("Invalid binary player state packet.");
        }

        return NetworkMessage.Create(NETWORK_MESSAGE.PLAYER_STATE, {
            x: this.FromFixedInt16(view.getInt16(4, false), NETWORK_FIXED_POINT.POSITION_SCALE),
            y: this.FromFixedInt16(view.getInt16(6, false), NETWORK_FIXED_POINT.POSITION_SCALE),
            vx: this.FromFixedInt16(view.getInt16(8, false), NETWORK_FIXED_POINT.VELOCITY_SCALE),
            vy: this.FromFixedInt16(view.getInt16(10, false), NETWORK_FIXED_POINT.VELOCITY_SCALE),
            ...NetworkProtocol.DecodePlayerFlags(view.getUint8(12)),
            colorIndex: view.getUint8(13),
        }, {
            protocol: "binary",
            sequence: view.getUint16(2, false),
        });
    }

    DecodeRemotePlayerState(view) {
        if (view.byteLength < REMOTE_PLAYER_STATE_BYTES) {
            throw new Error("Invalid binary remote player state packet.");
        }

        return NetworkMessage.Create(NETWORK_MESSAGE.PLAYER_UPDATE, {
            slot: view.getUint16(4, false),
            x: this.FromFixedInt16(view.getInt16(6, false), NETWORK_FIXED_POINT.POSITION_SCALE),
            y: this.FromFixedInt16(view.getInt16(8, false), NETWORK_FIXED_POINT.POSITION_SCALE),
            vx: this.FromFixedInt16(view.getInt16(10, false), NETWORK_FIXED_POINT.VELOCITY_SCALE),
            vy: this.FromFixedInt16(view.getInt16(12, false), NETWORK_FIXED_POINT.VELOCITY_SCALE),
            ...NetworkProtocol.DecodePlayerFlags(view.getUint8(14)),
            colorIndex: view.getUint8(15),
        }, {
            protocol: "binary",
            sequence: view.getUint16(2, false),
        });
    }

    NextSequence() {
        this.sequence = (this.sequence + 1) & 0xffff;
        return this.sequence;
    }

    ToArrayBuffer(data) {
        if (data instanceof ArrayBuffer) return data;
        if (ArrayBuffer.isView(data)) {
            return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
        }

        return null;
    }

    ToFixedInt16(value, scale) {
        const numeric = Number.isFinite(Number(value)) ? Number(value) : 0;
        return Math.max(-32768, Math.min(32767, Math.round(numeric * scale)));
    }

    FromFixedInt16(value, scale) {
        return value / scale;
    }

    ToUint8(value) {
        const numeric = Number.isFinite(Number(value)) ? Number(value) : 0;
        return Math.max(0, Math.min(255, Math.trunc(numeric)));
    }
}
