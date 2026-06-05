import { BootstrapGame } from "../../packages/core/index.js";
import { MyFirstLevel } from "./Levels/MyFirstLevel.js";

BootstrapGame({
    configPath: ["../../gameforge.config.json", "./mygame.config.json"],
    manifestPath: "./resources.json",
    levels: [
        new MyFirstLevel(),
    ],
});
