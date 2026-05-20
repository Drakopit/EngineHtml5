import { BootstrapGame } from "../../CoreCross/Bootstrap.js";
import { BattleLevel } from "./BattleLevel.js";
import { TacticalMapLevel } from "./TacticalMapLevel.js";
import { TacticalModeMenuLevel } from "./TacticalModeMenuLevel.js";

BootstrapGame({
    configPath: ["gameforge.config.json", "Demos/DemoTacticalRPG/tactical.config.json"],
    manifestPath: "Demos/DemoTacticalRPG/resources.json",
    levels: [
        new TacticalModeMenuLevel(),
        new TacticalMapLevel(),
        new BattleLevel(),
    ],
    beforeStart: () => {
        document.title = "Tactical RPG - GameForgeJS";
        document.body.style.backgroundColor = "#000000";
    },
});
