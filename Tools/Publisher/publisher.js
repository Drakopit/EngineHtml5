const path = require('path');
const PublisherConfig = require('./PublisherConfig');
const PathResolver = require('./PathResolver');
const FileCopier = require('./FileCopier');
const PublishReport = require('./PublishReport');

function parseCLI() {
    const args = process.argv.slice(2);
    let configPath = "gameforge.publisher.json"; // default

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--config' || args[i] === '-c') {
            configPath = args[i + 1];
            break;
        }
    }

    return path.resolve(process.cwd(), configPath);
}

function run() {
    console.log("🎮 GameForgeJS Publisher");
    const configPath = parseCLI();
    console.log(`Loading config from: ${configPath}`);

    let config;
    try {
        config = PublisherConfig.load(configPath);
    } catch (e) {
        console.error(e.message);
        process.exit(1);
    }

    const resolver = new PathResolver(configPath, config);
    const report = new PublishReport();
    const copier = new FileCopier(report, config.exclude);

    if (config.cleanOutput) {
        console.log("🧹 Cleaning output folder...");
        copier.cleanOutput(resolver.output);
    }

    console.log(`🚀 Publishing: ${config.name}`);
    console.log(`📂 Output directory: ${resolver.output}`);

    // 1. Copy engine modules
    if (config.engineModules && config.engineModules.length > 0) {
        for (const mod of config.engineModules) {
            const src = resolver.resolveEngineModule(mod);
            // Place engine modules inside an engine folder or directly in output?
            // The plan says output structure: /publish/GameForgeJS/Core/...
            // If the user expects standard relative paths, we should put them inside a GameForgeJS folder,
            // or put them exactly mirroring the relative path structure between gameRoot and engineRoot.
            // But a simple approach is just to put them inside the output folder directly (e.g. output/Core2D).
            // Let's copy them directly into output so the game can reference them as `./Core2D`.
            const dest = resolver.resolveOutput(mod);
            copier.copyItem(src, dest, mod);
        }
    }

    // 2. Copy Game Files and Folders
    if (config.gameFiles && config.gameFiles.length > 0) {
        for (const fileOrFolder of config.gameFiles) {
            const src = resolver.resolveGameFile(fileOrFolder);
            const dest = resolver.resolveOutput(fileOrFolder);
            copier.copyItem(src, dest, fileOrFolder);
        }
    }

    // 3. Ensure entry file is copied (if not covered by gameFiles array)
    if (config.entry) {
        const entrySrc = resolver.resolveGameFile(config.entry);
        const entryDest = resolver.resolveOutput(config.entry);
        // Only copy if it wasn't already copied (the copier handles overwrites fine though)
        copier.copyItem(entrySrc, entryDest, config.entry);
    }

    report.print();
}

run();
