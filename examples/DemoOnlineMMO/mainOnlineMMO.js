import { BootstrapGame } from "../../src/CoreCross/Bootstrap.js";
import { OnlineMMOLevel } from "./OnlineMMOLevel.js";

BootstrapGame({
    configPath: ["gameforge.config.json", "examples/DemoOnlineMMO/online.config.json"],
    levels: [
        new OnlineMMOLevel(),
    ],
});
