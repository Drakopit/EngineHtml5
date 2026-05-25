import { Config } from "../Config.js";

/**
 * Applies the responsive full-window canvas mode selected by a game config.
 *
 * Logical canvas coordinates remain unchanged; only presentation fills the
 * available browser viewport.
 */
export class GameViewport {
    /**
     * Reads the active game's `screen.fullScreen` setting.
     * @returns {boolean} Whether full-window canvas presentation is enabled.
     */
    static IsFullScreen() {
        const config = Config.data?.screen?.fullScreen
            ?? Config.data?.window?.fullScreen
            ?? false;

        return typeof config === "object"
            ? config.enabled === true
            : config === true;
    }

    /**
     * Styles a game canvas to occupy the browser window responsively.
     * @param {HTMLCanvasElement} canvas - Game canvas element.
     * @param {boolean} [enabled] - Optional setting override.
     * @returns {HTMLCanvasElement} The supplied canvas.
     */
    static Apply(canvas, enabled = this.IsFullScreen()) {
        if (!canvas || !enabled) {
            return canvas;
        }

        document.body.style.overflow = "hidden";
        document.body.style.width = "100vw";
        document.body.style.height = "100vh";

        canvas.style.position = "fixed";
        canvas.style.inset = "0";
        canvas.style.width = "100vw";
        canvas.style.height = "100vh";
        canvas.style.boxSizing = "border-box";
        canvas.style.border = "0";
        canvas.style.margin = "0";

        return canvas;
    }
}
