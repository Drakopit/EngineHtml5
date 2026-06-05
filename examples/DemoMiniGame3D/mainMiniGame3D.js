import { BootstrapGame } from "../../src/CoreCross/Bootstrap.js";
import { CubeGameLevel } from "./CubeGameLevel.js";
import { MiniGame3DMenu } from "./MiniGame3DMenu.js";

BootstrapGame({
    configPath: ["gameforge.config.json", "examples/DemoMiniGame3D/mini3d.config.json"],
    manifestPath: "examples/DemoMiniGame3D/resources.json",
    levels: [
        new MiniGame3DMenu(),
        new CubeGameLevel(),
    ],
});
