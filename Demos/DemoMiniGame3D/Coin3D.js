import { GameObject3D } from "../../Core3D/Objects/GameObject3D.js";
import { Shapes3D } from "../../Core3D/Graphics/Shape3D.js";
import { AssetManager } from "../../CoreCross/Assets/AssetManager.js";

export class Coin3D extends GameObject3D {
    constructor(screen3D, { position = [0.0, -8.0], value = 10 } = {}) {
        super();
        this.name = "CoinCube";
        this.shapes = new Shapes3D(screen3D);
        this.value = value;
        this.radius = 0.28;
        this.active = true;
        this.animationTime = 0;
        this.baseY = -0.05;

        this.transform.scale = [0.18, 0.18, 0.18];
        this.SetPosition(position[0], position[1]);

        const htmlImage = AssetManager.instance.GetImage("textura_coin");
        if (htmlImage) {
            this.myTexture = this.shapes.CreateTexture(htmlImage);
        }
    }

    SetPosition(x, z) {
        this.active = true;
        this.animationTime = 0;
        this.transform.position = [x, this.baseY, z];
        this.transform.rotation = { x: 0.0, y: 0.0, z: 0.0 };
    }

    Collect() {
        this.active = false;
    }

    OnUpdate(dt) {
        if (!this.active) return;

        const delta = dt || 0.016;
        this.animationTime += delta;
        this.transform.position[1] = this.baseY + Math.sin(this.animationTime * 4.0) * 0.08;
        this.transform.rotation.x += 2.6 * delta;
        this.transform.rotation.y += 4.2 * delta;
    }

    OnDrawn(camera, lighting) {
        if (!this.active) return;

        this.shapes.DrawCube(
            this.transform.position,
            this.transform.rotation,
            this.transform.scale,
            camera,
            this.myTexture,
            lighting,
        );
    }

    OnExit() {
        this.shapes.Dispose();
    }
}
