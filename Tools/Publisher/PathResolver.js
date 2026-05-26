const path = require('path');

class PathResolver {
    constructor(configFilePath, config) {
        // The base path is the directory containing the config file.
        // This ensures that all relative paths in the config are resolved relative to the config file itself.
        this.baseDir = path.dirname(path.resolve(configFilePath));
        
        this.gameRoot = path.resolve(this.baseDir, config.gameRoot);
        this.engineRoot = path.resolve(this.baseDir, config.engineRoot);
        this.output = path.resolve(this.baseDir, config.output);
    }

    resolveGameFile(relativePath) {
        return path.resolve(this.gameRoot, relativePath);
    }

    resolveEngineModule(moduleName) {
        return path.resolve(this.engineRoot, moduleName);
    }

    resolveOutput(relativePath) {
        return path.resolve(this.output, relativePath);
    }
}

module.exports = PathResolver;
