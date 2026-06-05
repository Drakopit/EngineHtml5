import { Level } from "../../CoreCross/Level/Level.js";
import { Screen3D } from "../Window/Screen3D.js";
import { ScreenUI } from "../../Core2D/Window/ScreenUI.js";
import { PerspectiveCamera, Scene3D, WebGL3DRenderer } from "../Render3D/index.js";
import { PhysicsWorld3D } from "../Physics/PhysicsWorld3D.js";

/**
 * Base level for current Render3D games with optional canvas UI and physics.
 *
 * Extend this class and implement `BuildScene()` to add objects, lights and
 * skyboxes; the standard level lifecycle renders and disposes the scene.
 *
 * @param {Object} [options] - Canvas, rendering and simulation settings.
 * @param {string} [options.canvasId="gameCanvas3D"] - Render canvas identifier.
 * @param {string} [options.uiCanvasId="gameCanvasUI"] - Overlay UI canvas identifier.
 * @param {number} [options.width=960] - Logical render width.
 * @param {number} [options.height=540] - Logical render height.
 * @param {number[]} [options.clearColor] - RGBA clear color.
 * @param {boolean} [options.useUI=true] - Whether to create `ScreenUI`.
 * @param {boolean} [options.usePhysics=true] - Whether to create `PhysicsWorld3D`.
 * @example
 * class FirstLevel extends Level3D {
 *     BuildScene() {
 *         this.scene.Add(new DirectionalLight({ castShadow: true }));
 *     }
 * }
 */
export class Level3D extends Level {
    constructor({
        canvasId = "gameCanvas3D",
        uiCanvasId = "gameCanvasUI",
        width = 960,
        height = 540,
        clearColor = [0.02, 0.025, 0.04, 1],
        useUI = true,
        usePhysics = true,
    } = {}) {
        super();
        this.canvasId = canvasId;
        this.uiCanvasId = uiCanvasId;
        this.width = width;
        this.height = height;
        this.clearColor = clearColor;
        this.useUI = useUI;
        this.usePhysics = usePhysics;
    }

    OnStart() {
        document.title = this.caption ?? document.title;
        this.screen3D = new Screen3D(this.canvasId, this.width, this.height);
        this.screen3D.Canvas.style.position = "absolute";
        this.screen3D.Canvas.style.left = "0px";
        this.screen3D.Canvas.style.top = "0px";
        this.screen3D.Canvas.style.zIndex = "1";

        if (this.useUI) {
            this.ui = new ScreenUI(this.uiCanvasId, this.width, this.height, 2);
        }

        this.renderer = new WebGL3DRenderer(this.screen3D.Canvas, {
            clearColor: this.clearColor,
        });
        this.scene = new Scene3D({ backgroundColor: this.clearColor });
        this.camera = new PerspectiveCamera({
            aspect: this.width / this.height,
            position: [0, 4, 10],
            target: [0, 0, 0],
        });
        this.scene.Add(this.camera);
        this.physics = this.usePhysics ? new PhysicsWorld3D() : null;

        this.BuildScene();
    }

    /**
     * Scene construction hook implemented by a game level.
     * @returns {void}
     */
    BuildScene() {}

    OnUpdate(dt) {
        this.physics?.Step(dt);
    }

    OnDrawn() {
        this.renderer.Render(this.scene, this.camera);
        this.ui?.Refresh();
    }

    OnExit() {
        this.renderer?.Dispose();
        if (this.screen3D?.Canvas) this.screen3D.Canvas.remove();
        if (this.ui?.Screen?.Canvas) this.ui.Screen.Canvas.remove();
    }
}
