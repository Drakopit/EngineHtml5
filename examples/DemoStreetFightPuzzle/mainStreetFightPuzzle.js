import { BootstrapGame } from "../../src/CoreCross/Bootstrap.js";
import { StreetFightPuzzleScene } from "./StreetFightPuzzleScene.js";

BootstrapGame({
    configPath: ["gameforge.config.json", "examples/DemoStreetFightPuzzle/streetfight.config.json"],
    manifestPath: "examples/DemoStreetFightPuzzle/resources.json",
    levels: [
        new StreetFightPuzzleScene()
    ],
});
