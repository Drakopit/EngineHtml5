import { BootstrapGame } from "../../CoreCross/Bootstrap.js";
import { StreetFightPuzzleScene } from "./StreetFightPuzzleScene.js";

BootstrapGame({
    configPath: ["gameforge.config.json", "Demos/DemoStreetFightPuzzle/streetfight.config.json"],
    manifestPath: "Demos/DemoStreetFightPuzzle/resources.json",
    levels: [
        new StreetFightPuzzleScene()
    ],
});
