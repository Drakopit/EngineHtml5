import { LevelHandler } from "../../CoreCross/Engine.js";
import { Menu } from "../../Core2D/Level/Menu.js";
import { ActionManager } from "../../CoreCross/Input/ActionManager.js";
import { Logger } from "../../CoreCross/Logger.js";

export class MiniGame3DMenu extends Menu {
    OnStart() {
        super.OnStart();
        this.caption = "Menu Principal - MiniGame 3D";
        this.options = ["Iniciar Jogo", "Sair"];
    }

    OnUpdate(dt) {
        super.OnUpdate(dt);

        if (!ActionManager.IsActionDown("ATTACK")) return;

        switch (this.currentSelected) {
            case 0:
                LevelHandler.current.Next = true;
                break;
            case 1:
                Logger.log("info", "Use o launcher do projeto para escolher outra demo.");
                break;
            default:
                Logger.log("error", "Opcao invalida selecionada.");
                break;
        }
    }

    OnExit() {
        if (this.screen?.Canvas) this.screen.Canvas.remove();
    }
}
