import { Engine, LevelHandler } from "./Engine.js";
import { Config } from "./Config.js";
import { Input } from "./Input/Input.js";
import { ActionManager } from "./Input/ActionManager.js";
import { AssetManager } from "./Assets/AssetManager.js";
import { AudioManager } from "./Audio/AudioManager.js";
import { Logger } from "./Logger.js";
import { ResourceManifestLoader } from "./Assets/ResourceManifestLoader.js";

export async function BootstrapGame({
    configPath = "gameforge.config.json",
    manifestPath = null,
    levels = [],
    beforeStart = null,
} = {}) {
    try {
        const config = configPath ? await Config.Load(configPath) : null;

        ApplyWindowConfig(config);
        Input.Initialize();
        ActionManager.LoadMappings(config?.input?.actionMappings);

        AudioManager.instance.Initialize();
        if (config?.audio) {
            AudioManager.instance.SetGlobalVolume(config.audio.masterVolume);
        }

        const assets = new AssetManager();
        const manifest = manifestPath
            ? await ResourceManifestLoader.Load(manifestPath, assets)
            : null;

        if (typeof beforeStart === "function") {
            await beforeStart({ config, assets, manifest, LevelHandler });
        }

        levels.forEach(level => LevelHandler.addLevel(level));
        Engine.OnStart();

        const projectName = config?.project?.name ?? "GameForgeJS";
        const projectVersion = config?.project?.version ?? "1.0.0";
        Logger.log("info", `${projectName} v${projectVersion}: Engine started.`);

        return { config, assets, manifest, levels };
    } catch (exception) {
        Logger.log("error", "Critical bootstrap error.", exception);
        console.error("Critical bootstrap error:", exception);
        throw exception;
    }
}

function ApplyWindowConfig(config) {
    if (!config?.window) return;

    document.title = config.window.title;
    document.body.style.backgroundColor = config.window.backgroundColor;
    document.body.style.cursor = config.window.cursor;
}
