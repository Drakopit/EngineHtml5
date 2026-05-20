import { BootstrapGame } from "../../CoreCross/Bootstrap.js";
import { TechDemo3DLevel } from "./TechDemo3DLevel.js";

BootstrapGame({
    configPath: ["gameforge.config.json", "Demos/Demo3D/demo3d.config.json"],
    manifestPath: "Demos/Demo3D/resources.json",
    levels: [
        new TechDemo3DLevel(),
    ],
});
