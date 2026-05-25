import { Base } from "../../CoreCross/Base.js";
import { Deprecation } from "../../CoreCross/Deprecation.js";
import { Util } from "../../CoreCross/Utils.js";

/** @deprecated Use `Transform3D` from the `Render3D` exports. */
export class Transform3D {
    constructor(showWarning = true) {
        if (showWarning) Deprecation.WarnOnce("LegacyTransform3D", "Transform3D");
        this.position = [0, 0, 0];
        this.rotation = { x: 0, y: 0, z: 0 };
        this.scale = [1, 1, 1];
    }
}

/** @deprecated Use `Mesh`, `Model3D` or game-owned entities composed with Render3D. */
export class GameObject3D extends Base {
    constructor() {
        super();
        Deprecation.WarnOnce("GameObject3D", "Mesh or Model3D");
        this.id = Util.NewUUIDv4();
        this.name = "Entity3D";
        this.transform = new Transform3D(false);
        this.solid = true;
    }

    OnUpdate(dt) {}
    OnDrawn() {}
}
