import { AdvancedDemoResultScreen } from "./AdvancedDemoResultScreen.js";

export class AdvancedDemoCongratulations extends AdvancedDemoResultScreen {
    constructor() {
        super({
            caption: "GameForgeJS - Advanced Demo: Congratulations",
            screenId: "AdvancedDemoCongratulations",
            eyebrow: "CAMPANHA CONCLUIDA",
            title: "CONGRATULATIONS",
            subtitle: "A rota do norte foi libertada.",
            creditsTitle: "CREDITOS",
            creditLines: [
                "Criacao original: Patrick Faustino Camello",
                "Demo Advanced e level design: Bruno Marcelo",
                "Implementacao assistida: Codex",
                "GameForgeJS - Framework independente em JavaScript",
            ],
            accentColor: "#F4D26A",
            overlayColor: "rgba(8, 16, 26, 0.56)",
            bandColor: "rgba(8, 14, 28, 0.72)",
        });
    }
}
