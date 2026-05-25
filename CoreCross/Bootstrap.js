import { Engine, LevelHandler } from "./Engine.js";
import { Config } from "./Config.js";
import { Input } from "./Input/Input.js";
import { ActionManager } from "./Input/ActionManager.js";
import { AssetManager } from "./Assets/AssetManager.js";
import { AudioManager } from "./Audio/AudioManager.js";
import { Logger } from "./Logger.js";
import { ResourceManifestLoader } from "./Assets/ResourceManifestLoader.js";

/**
 * Loads a game's configuration and assets, registers its levels and starts the engine.
 *
 * @param {Object} [options] - Game startup values.
 * @param {string|string[]} [options.configPath="gameforge.config.json"] - Config manifest paths.
 * @param {string|string[]|null} [options.manifestPath=null] - Resource manifest paths.
 * @param {Level[]} [options.levels=[]] - Levels registered before startup.
 * @param {Function|null} [options.beforeStart=null] - Async customization hook.
 * @returns {Promise<Object>} Loaded config, assets, manifest and levels.
 */
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
