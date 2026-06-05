import { Draw } from "../../../src/Core2D/Graphics/Draw.js";
import { PuzzleConfig } from "../data/puzzleConfig.js";

// Types of gems
export const GemType = {
    NORMAL: 0,
    CRASH: 1,
    GARBAGE: 2,
    EMPTY: 3
};

// Represents a single block in the board or falling piece
export class PuzzleGem {
    constructor(type, color = "red", timer = 0) {
        this.type = type;
        this.color = color;
        this.timer = timer; // Used for garbage gems
        this.markedForDestroy = false;
        
        // Colors for procedural drawing
        this.colorMap = {
            "red": { main: "#ff3333", dark: "#990000", light: "#ff9999" },
            "blue": { main: "#3333ff", dark: "#000099", light: "#9999ff" },
            "green": { main: "#33ff33", dark: "#009900", light: "#99ff99" },
            "yellow": { main: "#ffff33", dark: "#999900", light: "#ffff99" },
            "garbage": { main: "#888888", dark: "#444444", light: "#cccccc" }
        };
    }

    /**
     * Modular render method.
     * Easily swappable to use Sprite.Draw(this.spriteName, x, y) in the future.
     */
    render(ctx, x, y, size = PuzzleConfig.GEM_SIZE) {
        if (this.type === GemType.EMPTY) return;

        let palette = this.colorMap[this.color] || this.colorMap["red"];
        if (this.type === GemType.GARBAGE) {
            palette = this.colorMap["garbage"];
        }

        // Base square
        ctx.fillStyle = palette.main;
        ctx.fillRect(x, y, size, size);
        
        // Highlight and shadow for 3D gem effect
        ctx.fillStyle = palette.light;
        ctx.fillRect(x, y, size, 4); // Top
        ctx.fillRect(x, y, 4, size); // Left
        ctx.fillStyle = palette.dark;
        ctx.fillRect(x + size - 4, y, 4, size); // Right
        ctx.fillRect(x, y + size - 4, size, 4); // Bottom

        // Type specific details
        if (this.type === GemType.CRASH) {
            // Draw a central core for Crash gems (e.g., a diamond or circle)
            ctx.beginPath();
            ctx.arc(x + size / 2, y + size / 2, size / 4, 0, Math.PI * 2);
            ctx.fillStyle = "#ffffff";
            ctx.fill();
            ctx.closePath();
        } else if (this.type === GemType.GARBAGE) {
            // Draw counter number
            ctx.fillStyle = "#ffffff";
            ctx.font = "14px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(this.timer.toString(), x + size / 2, y + size / 2);
        }
    }
}
