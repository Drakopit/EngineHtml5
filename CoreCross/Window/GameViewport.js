import { Config } from "../Config.js";

export class GameViewport {
    static IsFullScreen() {
        const config = Config.data?.screen?.fullScreen
            ?? Config.data?.window?.fullScreen
            ?? false;

        return typeof config === "object"
            ? config.enabled === true
            : config === true;
    }

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
