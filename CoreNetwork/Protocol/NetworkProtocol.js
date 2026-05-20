export const NETWORK_PROTOCOL_VERSION = 1;

export const NETWORK_BINARY_TYPE = Object.freeze({
    PLAYER_STATE: 1,
    REMOTE_PLAYER_STATE: 2,
});

export const NETWORK_MESSAGE = Object.freeze({
    PLAYER_STATE: "player:state",
    PLAYER_UPDATE: "player:update",
    PLAYER_PROFILE: "player:profile",
    PLAYER_JOINED: "player:joined",
    PLAYER_LEFT: "player:left",
    ROOM_WELCOME: "room:welcome",
    WORLD_BLOCK_SET: "world:block:set",
    CHAT_SAY: "chat:say",
});

export const NETWORK_PLAYER_FLAGS = Object.freeze({
    GROUNDED: 1 << 0,
    FACING_RIGHT: 1 << 1,
});

export const NETWORK_FIXED_POINT = Object.freeze({
    POSITION_SCALE: 4,
    VELOCITY_SCALE: 8,
});

export class NetworkProtocol {
    static EncodePlayerFlags({ grounded = false, facingRight = true } = {}) {
        let flags = 0;
        if (grounded) flags |= NETWORK_PLAYER_FLAGS.GROUNDED;
        if (facingRight) flags |= NETWORK_PLAYER_FLAGS.FACING_RIGHT;
        return flags;
    }

    static DecodePlayerFlags(flags = 0) {
        return {
            grounded: (flags & NETWORK_PLAYER_FLAGS.GROUNDED) !== 0,
            facingRight: (flags & NETWORK_PLAYER_FLAGS.FACING_RIGHT) !== 0,
        };
    }
}
