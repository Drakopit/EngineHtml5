import { BootstrapGame } from "../../src/CoreCross/Bootstrap.js";
import { TechDemo3DLevel } from "./TechDemo3DLevel.js";

BootstrapGame({
    configPath: ["gameforge.config.json", "examples/Demo3D/demo3d.config.json"],
    manifestPath: "examples/Demo3D/resources.json",
    levels: [
        new TechDemo3DLevel(),
    ],
});
