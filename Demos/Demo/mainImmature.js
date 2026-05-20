import { BootstrapGame } from "../../CoreCross/Bootstrap.js";
import { TechDemoLevel } from "./TechDemoLevel.js";

BootstrapGame({
    configPath: ["gameforge.config.json", "Demos/Demo/immature.config.json"],
    levels: [
        new TechDemoLevel(),
    ],
});
