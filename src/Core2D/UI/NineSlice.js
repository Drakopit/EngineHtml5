import { Vector2D } from "../../CoreCross/Math/Vector2D.js";

/**
 * Draws resizable UI panels from a nine-slice source image.
 *
 * @param {Screen} screen - Canvas screen.
 * @param {HTMLImageElement} image - Panel texture.
 * @param {number} [cornerSize=16] - Corner sample size in pixels.
 */
export class NineSlice {
    /**
     * @param {Object} screen - The screen object to get the Context
     * @param {HTMLImageElement} image - The source image (loaded via AssetManager)
     * @param {number} cornerSize - The size (in pixels) of the non-scalable corners
     */
    constructor(screen, image, cornerSize = 16) {
        this.screen = screen;
        this.image = image;
        this.corner = cornerSize;
    }

    /**
     * Draws the scalable panel on the screen.
     * @param {number} x - Target X position
     * @param {number} y - Target Y position
     * @param {number} finalWidth - The total width you want the window to be
     * @param {number} finalHeight - The total height you want the window to be
     */
    DrawPanel(x, y, finalWidth, finalHeight) {
        if (!this.image || !this.screen || !this.screen.Context) return;

        const ctx = this.screen.Context;
        const c = this.corner;
        
        // Original image dimensions
        const iw = this.image.width;
        const ih = this.image.height;
        
        // Source dimensions of the middle parts (stretchy parts)
        const smw = iw - (c * 2); 
        const smh = ih - (c * 2);

        // Destination dimensions of the middle parts
        const dmw = finalWidth - (c * 2);
        const dmh = finalHeight - (c * 2);

        // TOP ROW
        // 1. Top-Left
        ctx.drawImage(this.image, 0, 0, c, c, x, y, c, c);
        // 2. Top-Center
        ctx.drawImage(this.image, c, 0, smw, c, x + c, y, dmw, c);
        // 3. Top-Right
        ctx.drawImage(this.image, iw - c, 0, c, c, x + c + dmw, y, c, c);

        // MIDDLE ROW
        // 4. Middle-Left
        ctx.drawImage(this.image, 0, c, c, smh, x, y + c, c, dmh);
        // 5. Center (The core background)
        ctx.drawImage(this.image, c, c, smw, smh, x + c, y + c, dmw, dmh);
        // 6. Middle-Right
        ctx.drawImage(this.image, iw - c, c, c, smh, x + c + dmw, y + c, c, dmh);

        // BOTTOM ROW
        // 7. Bottom-Left
        ctx.drawImage(this.image, 0, ih - c, c, c, x, y + c + dmh, c, c);
        // 8. Bottom-Center
        ctx.drawImage(this.image, c, ih - c, smw, c, x + c, y + c + dmh, dmw, c);
        // 9. Bottom-Right
        ctx.drawImage(this.image, iw - c, ih - c, c, c, x + c + dmw, y + c + dmh, c, c);
    }
}
