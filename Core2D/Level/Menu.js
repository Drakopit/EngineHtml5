import { Draw } from "../Graphics/Draw.js";
import { Input } from "../../CoreCross/Input/Input.js";
import { Screen } from "../Window/Screen.js";
import { Level } from "../../CoreCross/Level/Level.js";

export class Menu extends Level {
    constructor() {
        super();
    }

    OnStart() {
        this.caption = "Menu Principal";
        this.options = new Array("Novo Jogo", "Continuar", "Opções", "Sair");
        this.currentSelected = 0;

        // 1. Cria a tela e os utilitários APENAS quando a fase iniciar
        this.screen = new Screen("MenuCanvas", 640, 480);
        this.TelaId = this.screen.id || this.screen.ScreenId;

        this.draw = new Draw(this.screen);
        this.draw.FontSize = "45px";

        super.OnStart();
    }

    OnUpdate(dt) {
        if (Input.GetKeyDown("KeyW") || Input.GetKeyDown("ArrowUp")) {
            this.currentSelected--;
            if (this.currentSelected < 0) {
                this.currentSelected = (this.options.length - 1);
            }
        } else if (Input.GetKeyDown("KeyS") || Input.GetKeyDown("ArrowDown")) {
            this.currentSelected++;
            if (this.currentSelected > (this.options.length - 1)) {
                this.currentSelected = 0;
            }
        }
    }

    // A Engine exige que este método exista. 
    // Usamos ele para limpar o canvas 2D do menu a cada frame!
    OnDrawn() {
        if (this.screen) this.screen.Refresh();
    }

    // A Engine exige este método para a física, mesmo que o menu não use
    OnFixedUpdate(dt) { }

    OnGUI() {
        for (let i = 0; i < this.options.length; i++) {
            if (i == this.currentSelected) {
                this.draw.Color = "lightgray";
            } else {
                this.draw.Color = "lime";
            }
            this.draw.DrawText(this.options[i], 32, 64 + i * 64);
        }
    }
}