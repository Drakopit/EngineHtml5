import { AdvancedDemoFirstLevel } from "./AdvancedDemoFirstLevel.js";

export class AdvancedDemoSecondLevel extends AdvancedDemoFirstLevel {
    constructor() {
        super({
            caption: "GameForgeJS - Advanced Demo: Fase 2",
            screenId: "AdvancedDemoSecondLevel",
            manifestName: "advanced_second_level",
            phaseId: "second",
            unlocksPhaseId: "boss",
        });
    }
}
