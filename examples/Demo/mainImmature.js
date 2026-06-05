import { BootstrapGame } from "../../src/CoreCross/Bootstrap.js";
import { TechDemoLevel } from "./TechDemoLevel.js";

BootstrapGame({
    configPath: ["gameforge.config.json", "examples/Demo/immature.config.json"],
    levels: [
        new TechDemoLevel(),
    ],
});
