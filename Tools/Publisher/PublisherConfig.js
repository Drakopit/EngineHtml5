const fs = require('fs');

class PublisherConfig {
    static load(configPath) {
        if (!fs.existsSync(configPath)) {
            throw new Error(`Configuration file not found: ${configPath}`);
        }

        let raw;
        try {
            raw = fs.readFileSync(configPath, 'utf8');
        } catch (e) {
            throw new Error(`Failed to read config file: ${e.message}`);
        }

        let data;
        try {
            data = JSON.parse(raw);
        } catch (e) {
            throw new Error(`Invalid JSON in config file: ${e.message}`);
        }

        return {
            name: data.name || "GameForgeJS Game",
            entry: data.entry || "index.html",
            output: data.output || "./publish",
            gameRoot: data.gameRoot || "./",
            engineRoot: data.engineRoot || "../GameForgeJS",
            engineModules: data.engineModules || ["Core2D", "Core3D", "CoreCross", "CoreNetwork"],
            gameFiles: data.gameFiles || [],
            exclude: data.exclude || [".git", "node_modules", "package.json", "package-lock.json"],
            cleanOutput: data.cleanOutput !== undefined ? data.cleanOutput : true
        };
    }
}

module.exports = PublisherConfig;
