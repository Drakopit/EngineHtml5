import { BootstrapGame } from "../../CoreCross/Bootstrap.js";
import { AdvancedDemoBossLevel } from "./AdvancedDemoBossLevel.js";
import { AdvancedDemoCongratulations } from "./AdvancedDemoCongratulations.js";
import { AdvancedDemoFirstLevel } from "./AdvancedDemoFirstLevel.js";
import { AdvancedDemoGameOver } from "./AdvancedDemoGameOver.js";
import { AdvancedDemoMenu } from "./AdvancedDemoMenu.js";
import { AdvancedDemoPhaseSelector } from "./AdvancedDemoPhaseSelector.js";
import { AdvancedDemoSecondLevel } from "./AdvancedDemoSecondLevel.js";

BootstrapGame({
    configPath: ["gameforge.config.json", "Demos/DemoAdvanced/advanced.config.json"],
    manifestPath: "Demos/DemoAdvanced/resources.json",
    levels: [
        new AdvancedDemoMenu(),
        new AdvancedDemoPhaseSelector(),
        new AdvancedDemoFirstLevel(),
        new AdvancedDemoSecondLevel(),
        new AdvancedDemoBossLevel(),
        new AdvancedDemoGameOver(),
        new AdvancedDemoCongratulations(),
    ],
});
