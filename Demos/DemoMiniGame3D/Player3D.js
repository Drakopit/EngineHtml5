import { GameObject3D } from "../../Core3D/Objects/GameObject3D.js";
import { Shapes3D } from "../../Core3D/Legacy/Graphics/Shape3D.js";
import { ActionManager } from "../../CoreCross/Input/ActionManager.js";
import { AssetManager } from "../../CoreCross/Assets/AssetManager.js";

const DEFAULT_ARENA = {
    minX: -4.0,
    maxX: 4.0,
    minZ: -12.0,
    maxZ: -3.0,
};

export class Player3D extends GameObject3D {
    constructor(screen3D, arena = DEFAULT_ARENA) {
        super();
        this.name = "PlayerCube";
        this.shapes = new Shapes3D(screen3D);
        this.arena = arena;
        this.radius = 0.45;
        this.speed = 4.4;
        this.rotationSpeed = 2.8;

        this.transform.scale = [0.45, 0.45, 0.45];
        this.Reset();

        const htmlImage = AssetManager.instance.GetImage("textura_player");
        if (htmlImage) {
            this.myTexture = this.shapes.CreateTexture(htmlImage);
        }
    }

    Reset() {
        this.transform.position = [0.0, 0.0, -6.0];
        this.transform.rotation = { x: 0.0, y: 0.0, z: 0.0 };
    }

    OnUpdate(dt) {
        const delta = dt || 0.016;
        const turn = Number(ActionManager.IsAction("LEFT")) - Number(ActionManager.IsAction("RIGHT"));
        const move = Number(ActionManager.IsAction("UP") || ActionManager.IsAction("FORWARD"))
            - Number(ActionManager.IsAction("DOWN") || ActionManager.IsAction("BACK"));

        this.transform.rotation.y += turn * this.rotationSpeed * delta;

        if (move !== 0) {
            const directionX = -Math.sin(this.transform.rotation.y);
            const directionZ = -Math.cos(this.transform.rotation.y);
            this.transform.position[0] += directionX * move * this.speed * delta;
            this.transform.position[2] += directionZ * move * this.speed * delta;
        }

        this.ClampToArena();
    }

    ClampToArena() {
        this.transform.position[0] = Math.min(this.arena.maxX, Math.max(this.arena.minX, this.transform.position[0]));
        this.transform.position[2] = Math.min(this.arena.maxZ, Math.max(this.arena.minZ, this.transform.position[2]));
    }

    OnDrawn(camera, lighting) {
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
