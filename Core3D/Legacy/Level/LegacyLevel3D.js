import { Base } from "../../../CoreCross/Base.js";
import { Screen3D as ScreenWebGL } from "../../Window/Screen3D.js";

export class Level3D extends Base {
    constructor() {
        super();
        this.caption = "Modelo de Level 3D";
        this.TelaId = null;
        this.FPS = 0;
        this.LEVEL_HANDLER = this;
        this.entities = [];
    }

    OnStart() {
        document.title = this.caption;

        if (this.screen3D) {
            const gl = this.screen3D.Context;
            gl.clearColor(0.0, 0.0, 0.0, 1.0); // Fundo preto
            gl.enable(gl.DEPTH_TEST);
        }
        
        this.entities.forEach(entity => {
            if (typeof entity.OnStart === "function") entity.OnStart();
        });
    }

    OnUpdate(dt) {
        this.entities.forEach(entity => {
            if (typeof entity.OnUpdate === "function") entity.OnUpdate(dt);
        });
    }

    OnDrawn() {
        // Limpa os buffers de cor e profundidade do WebGL a cada frame
        this.screen3D.Refresh();

        this.entities.forEach(entity => {
            if (typeof entity.OnDrawn === "function") entity.OnDrawn();
        });
    }

    AddEntity(entity) {
        this.entities.push(entity);
        if (typeof entity.OnStart === "function") {
            entity.OnStart();
        }
    }
}