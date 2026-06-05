import { BootstrapGame } from "../../packages/core/index.js";
import { PlatformerLevel } from "./Levels/PlatformerLevel.js";

BootstrapGame({
    configPath: ["mygame.config.json"],
    manifestPath: "resources.json",
    levels: [
        new PlatformerLevel()
    ]
});