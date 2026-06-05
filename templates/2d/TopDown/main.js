import { BootstrapGame } from "../../packages/core/index.js";
import { TopDownLevel } from "./Levels/TopDownLevel.js";

BootstrapGame({
    configPath: ["mygame.config.json"],
    manifestPath: "resources.json",
    levels: [
        new TopDownLevel()
    ]
});