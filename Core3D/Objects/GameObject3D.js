import { Base } from "../../CoreCross/Base.js";
import { Util } from "../../CoreCross/Utils.js";

// Estrutura simples para simular um Vector3D se o seu ainda não suportar rotações
export class Transform3D {
    constructor() {
        this.position = [0, 0, 0];
        this.rotation = { x: 0, y: 0, z: 0 };
        this.scale = [1, 1, 1];
    }
}

export class GameObject3D extends Base {
    constructor() {
        super();
        this.id = Util.NewUUIDv4();
        this.name = "Entity3D";
        this.transform = new Transform3D();
        this.solid = true;
    }

    OnUpdate(dt) {}
    OnDrawn() {}
}