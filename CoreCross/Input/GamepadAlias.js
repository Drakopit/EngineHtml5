export class GamepadAlias {
    static COMMON = Object.freeze({
        LB: "button_4",
        RB: "button_5",
        LT: "button_6",
        RT: "button_7",
        L1: "button_4",
        R1: "button_5",
        L2: "button_6",
        R2: "button_7",
        BACK: "button_8",
        SELECT: "button_8",
        SHARE: "button_8",
        CREATE: "button_8",
        START: "button_9",
        MENU: "button_9",
        OPTIONS: "button_9",
        L3: "button_10",
        R3: "button_11",
        LEFT_STICK_BUTTON: "button_10",
        RIGHT_STICK_BUTTON: "button_11",
        DPAD_UP: "button_12",
        DPAD_DOWN: "button_13",
        DPAD_LEFT: "button_14",
        DPAD_RIGHT: "button_15",
        LEFT_STICK_RIGHT: "axis_0_positive",
        LEFT_STICK_LEFT: "axis_0_negative",
        LEFT_STICK_DOWN: "axis_1_positive",
        LEFT_STICK_UP: "axis_1_negative",
        RIGHT_STICK_RIGHT: "axis_2_positive",
        RIGHT_STICK_LEFT: "axis_2_negative",
        RIGHT_STICK_DOWN: "axis_3_positive",
        RIGHT_STICK_UP: "axis_3_negative",
    });

    static PROFILES = Object.freeze({
        xbox: Object.freeze({
            A: "button_0",
            B: "button_1",
            X: "button_2",
            Y: "button_3",
            VIEW: "button_8",
            GUIDE: "button_16",
        }),
        playstation: Object.freeze({
            X: "button_0",
            CROSS: "button_0",
            CIRCLE: "button_1",
            SQUARE: "button_2",
            TRIANGLE: "button_3",
            PS: "button_16",
        }),
        nintendo: Object.freeze({
            B: "button_0",
            A: "button_1",
            Y: "button_2",
            X: "button_3",
            L: "button_4",
            R: "button_5",
            ZL: "button_6",
            ZR: "button_7",
            MINUS: "button_8",
            PLUS: "button_9",
            HOME: "button_16",
        }),
    });

    static EXPLICIT = Object.freeze({
        XBOX_A: "button_0",
        XBOX_B: "button_1",
        XBOX_X: "button_2",
        XBOX_Y: "button_3",
        XBOX_LB: "button_4",
        XBOX_RB: "button_5",
        XBOX_LT: "button_6",
        XBOX_RT: "button_7",
        XBOX_VIEW: "button_8",
        XBOX_BACK: "button_8",
        XBOX_MENU: "button_9",
        XBOX_START: "button_9",
        PS_X: "button_0",
        PS_CROSS: "button_0",
        PS_CIRCLE: "button_1",
        PS_SQUARE: "button_2",
        PS_TRIANGLE: "button_3",
        PS_L1: "button_4",
        PS_R1: "button_5",
        PS_L2: "button_6",
        PS_R2: "button_7",
        PS_SHARE: "button_8",
        PS_CREATE: "button_8",
        PS_OPTIONS: "button_9",
        NINTENDO_B: "button_0",
        NINTENDO_A: "button_1",
        NINTENDO_Y: "button_2",
        NINTENDO_X: "button_3",
        NINTENDO_L: "button_4",
        NINTENDO_R: "button_5",
        NINTENDO_ZL: "button_6",
        NINTENDO_ZR: "button_7",
        NINTENDO_MINUS: "button_8",
        NINTENDO_PLUS: "button_9",
    });

    static Resolve(input, options = {}, visited = new Set()) {
        if (typeof input !== "string") return input;

        const value = input.trim();
        if (!value) return value;
        if (this.IsNativeToken(value)) return this.NormalizeNativeToken(value);

        const key = this.NormalizeAlias(value);
        if (visited.has(key)) return value;
        visited.add(key);

        const aliases = this.NormalizeAliasMap(options.aliases);
        const profile = this.NormalizeProfile(options.profile);
        const resolved = aliases[key]
            ?? this.EXPLICIT[key]
            ?? this.COMMON[key]
            ?? this.PROFILES[profile]?.[key];

        if (resolved === undefined) return value;
        return this.Resolve(resolved, options, visited);
    }

    static ResolveButtonIndex(input, options = {}) {
        if (typeof input === "number") return Number.isInteger(input) ? input : null;

        const resolved = this.Resolve(input, options);
        if (typeof resolved !== "string") return null;

        const match = /^button_(\d+)$/i.exec(resolved);
        return match ? Number(match[1]) : null;
    }

    static ResolveAxis(input, options = {}) {
        if (input && typeof input === "object" && !Array.isArray(input)) {
            if (Number.isInteger(input.index) && typeof input.direction === "string") {
                return {
                    index: input.index,
                    direction: input.direction.toLowerCase(),
                };
            }
        }

        const resolved = this.Resolve(input, options);
        if (typeof resolved !== "string") return null;

        const match = /^axis_(\d+)_(positive|negative)$/i.exec(resolved);
        return match
            ? { index: Number(match[1]), direction: match[2].toLowerCase() }
            : null;
    }

    static IsNativeToken(input) {
        return /^button_\d+$/i.test(input) || /^axis_\d+_(positive|negative)$/i.test(input);
    }

    static NormalizeNativeToken(input) {
        return input.toLowerCase();
    }

    static NormalizeAlias(input) {
        return input.trim().toUpperCase().replace(/[\s-]+/g, "_");
    }

    static NormalizeProfile(profile) {
        const key = String(profile ?? "xbox").trim().toLowerCase();
        return this.PROFILES[key] ? key : "xbox";
    }

    static NormalizeAliasMap(aliases = {}) {
        return Object.entries(aliases ?? {}).reduce((result, [key, value]) => {
            if (typeof value === "string") {
                result[this.NormalizeAlias(key)] = value;
            }
            return result;
        }, {});
    }
}
