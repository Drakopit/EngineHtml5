import { BootstrapGame } from "../../CoreCross/Bootstrap.js";
import { OnlineMMOLevel } from "./OnlineMMOLevel.js";

BootstrapGame({
    configPath: ["gameforge.config.json", "Demos/DemoOnlineMMO/online.config.json"],
    levels: [
        new OnlineMMOLevel(),
    ],
});
