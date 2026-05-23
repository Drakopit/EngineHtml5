import { Level3D } from "../../Core3D/Level/LegacyLevel3D.js";
import { ScreenUI } from "../../Core2D/Window/ScreenUI.js";
import { Screen3D } from "../../Core3D/Window/Screen3D.js";
import { AssetManager } from "../../CoreCross/Assets/AssetManager.js";
import {
    AmbientLight,
    DirectionalLight,
    HemisphereLight,
    Mesh,
    PerspectiveCamera,
    PointLight,
    PrimitiveMesh,
    Scene3D,
    StandardMaterial,
    Texture,
    WebGL3DRenderer,
} from "../../Core3D/Render3D/index.js";

export class TechDemo3DLevel extends Level3D {
    constructor() {
        super();
        this.TelaId = "Demo3D";
        this.caption = "GameForgeJS - Render3D";
        this.time = 0;
    }

    OnStart() {
        const width = 960;
        const height = 540;
        this.screen3D = new Screen3D("gameCanvas3D", width, height);
        this.ui = new ScreenUI("gameCanvasUI", width, height);

        this.#setUpCanvas3D();
        this.#setUpCanvasUI();

        this.renderer = new WebGL3DRenderer(this.screen3D.Canvas, {
            clearColor: [0.035, 0.045, 0.065, 1],
        });

        this.scene = new Scene3D({
            backgroundColor: [0.035, 0.045, 0.065, 1],
        });

        this.camera = new PerspectiveCamera({
            fov: 55,
            aspect: width / height,
            near: 0.1,
            far: 120,
            position: [0, 3.4, 8.5],
            target: [0, 0.25, 0],
        });
        this.scene.Add(this.camera);

        this.scene.Add(new AmbientLight({ intensity: 0.08 }));
        this.scene.Add(new HemisphereLight({
            skyColor: [0.48, 0.68, 1.0],
            groundColor: [0.22, 0.18, 0.14],
            intensity: 0.34,
        }));
        this.scene.Add(new DirectionalLight({
            direction: [-0.45, -1.0, -0.35],
            color: [1.0, 0.94, 0.78],
            intensity: 1.9,
            castShadow: true,
            shadowMapSize: 1024,
            shadowBias: 0.0015,
            shadowStrength: 0.48,
            shadowDistance: 18,
        }));
        this.scene.Add(new PointLight({
            position: [2.6, 2.0, 1.3],
            color: [0.35, 0.72, 1.0],
            intensity: 1.2,
            range: 7,
        }));

        this.BuildScene();
        super.OnStart();
    }

    #setUpCanvasUI() {
        this.ui.Screen.Canvas.style.position = "absolute";
        this.ui.Screen.Canvas.style.left = "0px";
        this.ui.Screen.Canvas.style.top = "0px";
        this.ui.Screen.Canvas.style.zIndex = "2";
    }

    #setUpCanvas3D() {
        this.screen3D.Canvas.style.position = "absolute";
        this.screen3D.Canvas.style.left = "0px";
        this.screen3D.Canvas.style.top = "0px";
        this.screen3D.Canvas.style.zIndex = "1";
    }

    BuildScene() {
        const assets = AssetManager.instance;
        const albedoImage = assets.GetImage("grid_albedo") ?? assets.GetImage("textura_player");
        const albedo = albedoImage ? Texture.FromImage(albedoImage) : null;
        const normal = assets.HasImage("grid_normal")
            ? Texture.FromImage(assets.GetImage("grid_normal"))
            : null;

        const gridMaterial = new StandardMaterial({
            name: "TemplateGridMaterial",
            albedoMap: albedo,
            normalMap: normal,
            roughness: 0.82,
            metallic: 0.0,
            receiveShadow: true,
        });

        const floor = Mesh.FromGeometry(
            PrimitiveMesh.Plane(12, 12, { subdivisions: 8 }),
            gridMaterial,
            { name: "NormalMappedFloor", receiveShadow: true, castShadow: false },
        );
        floor.transform.SetPosition(0, -1, 0);
        this.scene.Add(floor);

        this.cube = Mesh.FromGeometry(
            PrimitiveMesh.Cube(1.65),
            new StandardMaterial({
                name: "RotatingCubeMaterial",
                albedoColor: [0.88, 0.92, 1.0, 1.0],
                albedoMap: albedo,
                normalMap: normal,
                roughness: 0.58,
            }),
            { name: "RotatingCube" },
        );
        this.cube.transform.SetPosition(-1.15, 0.05, 0);
        this.scene.Add(this.cube);

        this.sphere = Mesh.FromGeometry(
            PrimitiveMesh.Sphere(0.72, { widthSegments: 32, heightSegments: 16 }),
            new StandardMaterial({
                name: "WarmSphereMaterial",
                albedoColor: [1.0, 0.68, 0.34, 1.0],
                roughness: 0.38,
                metallic: 0.08,
            }),
            { name: "SpecularSphere" },
        );
        this.sphere.transform.SetPosition(1.75, -0.15, -0.25);
        this.scene.Add(this.sphere);
    }

    OnUpdate(dt) {
        const delta = dt || 0.016;
        this.time += delta;

        if (this.cube) {
            this.cube.transform.rotation.x += delta * 0.55;
            this.cube.transform.rotation.y += delta * 0.9;
        }

        if (this.sphere) {
            this.sphere.transform.position[1] = -0.15 + Math.sin(this.time * 1.8) * 0.18;
            this.sphere.transform.rotation.y += delta * 0.65;
        }

        if (this.camera) {
            this.camera.position[0] = Math.sin(this.time * 0.35) * 1.2;
            this.camera.position[2] = 8.5 + Math.cos(this.time * 0.35) * 0.7;
            this.camera.LookAt([0, 0.05, 0]);
        }
    }

    OnDrawn() {
        this.renderer.Render(this.scene, this.camera);
        this.ui?.Refresh();
    }

    OnGUI() {
        if (!this.ui) return;

        const draw = this.ui.Draw;

        // this.#drawTextUI(draw);
        draw.Color = "#9FE7FF";
        draw.FontSize = "22px";
        draw.DrawText("Render3D: WebGL2 + luz + normal map + sombra", 20, 38);
        draw.Color = "#FFFFFF";
        draw.FontSize = "15px";
        draw.DrawText(`FPS: ${this.FPS}`, 20, 64);
        draw.DrawText("Camada 2D/UI continua por cima do canvas 3D.", 20, 88);
    }

    #drawTextUI(color, fontSize, text, x, y) {
        draw.Color = color;
        draw.FontSize = fontSize;
        draw.DrawText(text, x, y);
        draw.Color = "#FFFFFF";
    }

    OnExit() {
        this.renderer?.Dispose();
        if (this.screen3D?.Canvas) this.screen3D.Canvas.remove();
        if (this.ui?.Screen?.Canvas) this.ui.Screen.Canvas.remove();
    }
}
