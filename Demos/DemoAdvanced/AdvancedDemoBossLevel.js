import { AdvancedDemoFirstLevel } from "./AdvancedDemoFirstLevel.js";

export class AdvancedDemoBossLevel extends AdvancedDemoFirstLevel {
    constructor() {
        super({
            caption: "GameForgeJS - Advanced Demo: Boss",
            screenId: "AdvancedDemoBossLevel",
            manifestName: "advanced_boss_level",
            phaseId: "boss",
            unlocksPhaseId: null,
            returnToPhaseSelector: false,
            completionTarget: "congratulations",
        });
    }
}
