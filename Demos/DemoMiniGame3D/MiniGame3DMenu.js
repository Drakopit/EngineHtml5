import { LevelHandler } from "../../CoreCross/Engine.js";
import { Menu } from "../../Core2D/Level/Menu.js";
import { ActionManager } from "../../CoreCross/Input/ActionManager.js";
import { Logger } from "../../CoreCross/Logger.js";
import { ListSkyTrailCourses, SelectSkyTrailCourse } from "./data/SkyTrailCourse.js";

export class MiniGame3DMenu extends Menu {
    OnStart() {
        super.OnStart();
        this.caption = "Sky Trail 3D";
        this.courses = ListSkyTrailCourses();
        this.options = [
            ...this.courses.map(course => `Jogar: ${course.label}`),
            "Sair",
        ];
    }

    OnUpdate(dt) {
        super.OnUpdate(dt);

        if (!ActionManager.IsActionDown("ATTACK")) return;

        const course = this.courses[this.currentSelected];
        if (course) {
            SelectSkyTrailCourse(course.name);
            LevelHandler.current.Next = true;
            return;
        }

        if (this.currentSelected === this.courses.length) {
            Logger.log("info", "Use o launcher do projeto para escolher outra demo.");
            return;
        }

        Logger.log("error", "Opcao invalida selecionada.");
    }

    OnExit() {
        if (this.screen?.Canvas) this.screen.Canvas.remove();
    }
}
