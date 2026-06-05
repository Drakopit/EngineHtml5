import { BootstrapGame } from "../../src/CoreCross/Bootstrap.js";
import { FightingCharacterSelectLevel } from "./FightingCharacterSelectLevel.js";
import { FightingGame2DLevel } from "./FightingGame2DLevel.js";
import { FightingGameMenuLevel } from "./FightingGameMenuLevel.js";

BootstrapGame({
    configPath: ["gameforge.config.json", "examples/DemoFightingGame2D/fighting.config.json"],
    manifestPath: "examples/DemoFightingGame2D/resources.json",
    levels: [
        new FightingGameMenuLevel(),
        new FightingCharacterSelectLevel(),
        new FightingGame2DLevel(),
    ],
});
