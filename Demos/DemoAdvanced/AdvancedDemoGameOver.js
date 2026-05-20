import { AdvancedDemoResultScreen } from "./AdvancedDemoResultScreen.js";

export class AdvancedDemoGameOver extends AdvancedDemoResultScreen {
    constructor() {
        super({
            caption: "GameForgeJS - Advanced Demo: Game Over",
            screenId: "AdvancedDemoGameOver",
            eyebrow: "FIM DA EXPEDICAO",
            title: "GAME OVER",
            subtitle: "A rota congelada venceu desta vez.",
            accentColor: "#FF7B7B",
            overlayColor: "rgba(24, 8, 14, 0.6)",
            bandColor: "rgba(22, 8, 16, 0.74)",
        });
    }
}
