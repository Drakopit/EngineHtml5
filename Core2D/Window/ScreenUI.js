import { Screen } from "./Screen.js";
import { Draw } from "../Graphics/Draw.js";

export class ScreenUI {
    constructor(id = "gameCanvasUI", width = 800, height = 600, zIndex = 100) {
        // 1. Instancia a tela nativa 2D (Isso fará o Screen.js criar o canvas automaticamente)
        this.screen = new Screen(id, width, height);
        
        // 2. Pega a referência do canvas que a classe Screen acabou de criar
        const canvasUI = this.screen.Canvas;

        // 3. Aplica a mágica do CSS (Sobreposição) DIRETAMENTE no canvas do jogo
        canvasUI.style.position = "absolute";
        canvasUI.style.left = "0px";
        canvasUI.style.top = "0px";
        canvasUI.style.zIndex = zIndex; 
        canvasUI.style.backgroundColor = "transparent";
        
        // (Opcional) Descomente a linha abaixo caso queira que cliques no mouse atravessem a UI
        // canvasUI.style.pointerEvents = "none";
        
        // 4. Instancia o desenhista 2D apontando para nossa tela
        this.draw = new Draw(this.screen);
    }

    Refresh() {
        this.screen.Refresh();
    }

    get Draw() {
        return this.draw;
    }
    
    get Screen() {
        return this.screen;
    }
}