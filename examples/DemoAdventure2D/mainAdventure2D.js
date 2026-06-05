import { BootstrapGame } from "../../src/CoreCross/Bootstrap.js";
import { AdventureDemoLevel } from "./AdventureDemoLevel.js";

BootstrapGame({
    configPath: ["gameforge.config.json", "examples/DemoAdventure2D/adventure.config.json"],
    levels: [
        new AdventureDemoLevel(),
    ],
    beforeStart: () => {
        document.title = "GameForgeJS - Adventure Component Demo";
        document.body.style.backgroundColor = "#050806";
    },
});
