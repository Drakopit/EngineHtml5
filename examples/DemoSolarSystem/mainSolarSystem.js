import { BootstrapGame } from "../../src/CoreCross/Bootstrap.js";
import { SolarSystemLevel } from "./SolarSystemLevel.js";

BootstrapGame({
    configPath: ["gameforge.config.json", "examples/DemoSolarSystem/solar.config.json"],
    manifestPath: "examples/DemoSolarSystem/resources.json",
    levels: [
        new SolarSystemLevel(),
    ],
});
