import { Level } from "../../CoreCross/Level/Level.js";
import { Screen3D } from "../Window/Screen3D.js";
import { ScreenUI } from "../../Core2D/Window/ScreenUI.js";
import { PerspectiveCamera, Scene3D, WebGL3DRenderer } from "../Render3D/index.js";
import { PhysicsWorld3D } from "../Physics/PhysicsWorld3D.js";

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
