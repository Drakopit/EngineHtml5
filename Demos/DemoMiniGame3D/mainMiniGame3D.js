import { BootstrapGame } from "../../CoreCross/Bootstrap.js";
import { CubeGameLevel } from "./CubeGameLevel.js";
import { MiniGame3DMenu } from "./MiniGame3DMenu.js";

BootstrapGame({
    configPath: ["gameforge.config.json", "Demos/DemoMiniGame3D/mini3d.config.json"],
    manifestPath: "Demos/DemoMiniGame3D/resources.json",
    levels: [
        new MiniGame3DMenu(),
        new CubeGameLevel(),
    ],
});
