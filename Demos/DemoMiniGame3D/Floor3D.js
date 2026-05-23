import { GameObject3D } from "../../Core3D/Objects/GameObject3D.js";
import { Shapes3D } from "../../Core3D/Legacy/Graphics/Shape3D.js";
import { AssetManager } from "../../CoreCross/Assets/AssetManager.js";

const DEFAULT_ARENA = {
    minX: -4.0,
    maxX: 4.0,
    minZ: -12.0,
    maxZ: -3.0,
};

export class Floor3D extends GameObject3D {
    constructor(screen3D, arena = DEFAULT_ARENA) {
        super();
        this.name = "Floor";
        this.shapes = new Shapes3D(screen3D);

        const width = arena.maxX - arena.minX;
        const depth = arena.maxZ - arena.minZ;
        this.transform.position = [
            (arena.minX + arena.maxX) / 2,
            -0.55,
            (arena.minZ + arena.maxZ) / 2,
        ];
        this.transform.scale = [width / 2 + 0.25, 0.08, depth / 2 + 0.25];

        const htmlImage = AssetManager.instance.GetImage("textura_chao");
        if (htmlImage) {
            this.myTexture = this.shapes.CreateTexture(htmlImage);
        }
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
