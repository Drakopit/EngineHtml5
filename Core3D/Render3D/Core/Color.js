export class Color {
    constructor(r = 1, g = 1, b = 1, a = 1) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    ToArray3() {
        return [this.r, this.g, this.b];
    }

    ToArray4() {
        return [this.r, this.g, this.b, this.a];
    }

    static White() {
        return new Color(1, 1, 1, 1);
    }

    static Black() {
        return new Color(0, 0, 0, 1);
    }

    static FromHex(hex, alpha = 1) {
        const value = String(hex).replace("#", "");
        const normalized = value.length === 3
            ? value.split("").map(char => char + char).join("")
            : value.padEnd(6, "0").slice(0, 6);

        const number = Number.parseInt(normalized, 16);
        return new Color(
            ((number >> 16) & 255) / 255,
            ((number >> 8) & 255) / 255,
            (number & 255) / 255,
            alpha,
        );
    }

    static ToArray3(value, fallback = [1, 1, 1]) {
        if (value instanceof Color) return value.ToArray3();
        if (Array.isArray(value)) return [value[0] ?? fallback[0], value[1] ?? fallback[1], value[2] ?? fallback[2]];
        if (typeof value === "string") return Color.FromHex(value).ToArray3();
        return fallback;
    }

    static ToArray4(value, fallback = [1, 1, 1, 1]) {
        if (value instanceof Color) return value.ToArray4();
        if (Array.isArray(value)) {
            return [
                value[0] ?? fallback[0],
                value[1] ?? fallback[1],
                value[2] ?? fallback[2],
                value[3] ?? fallback[3],
            ];
        }
        if (typeof value === "string") return Color.FromHex(value, fallback[3]).ToArray4();
        return fallback;
    }
}
