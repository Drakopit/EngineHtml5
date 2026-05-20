import { BootstrapGame } from "../../CoreCross/Bootstrap.js";
import { SolarSystemLevel } from "./SolarSystemLevel.js";

BootstrapGame({
    configPath: ["gameforge.config.json", "Demos/DemoSolarSystem/solar.config.json"],
    manifestPath: "Demos/DemoSolarSystem/resources.json",
    levels: [
        new SolarSystemLevel(),
    ],
});
