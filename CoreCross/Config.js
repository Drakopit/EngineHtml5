/**
 * Loads and merges global and per-game JSON configuration files.
 */
export class Config {
    static data = null;

    /**
     * Fetches one or more config paths, with later values overriding earlier values.
     * @param {string|string[]} filepath - JSON configuration path or ordered paths.
     * @returns {Promise<Object>} Merged configuration data.
     */
    static async Load(filepath) {
        try {
            const paths = Array.isArray(filepath) ? filepath : [filepath];
            const configs = [];

            for (const path of paths.filter(Boolean)) {
                const response = await fetch(path);
                if (!response.ok) throw new Error(`Arquivo de configuracao nao encontrado: ${path}`);
                configs.push(await response.json());
            }

            this.data = configs.reduce((result, config) => this.DeepMerge(result, config), {});
            return this.data;
        } catch (error) {
            console.error("GameForgeJS: Falha critica ao carregar configuracao.", error);
            throw error;
        }
    }

    static DeepMerge(target, source) {
        if (!source) return target;

        Object.entries(source).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                target[key] = value.slice();
                return;
            }

            if (this.IsPlainObject(value)) {
                target[key] = this.DeepMerge(
                    this.IsPlainObject(target[key]) ? target[key] : {},
                    value
                );
                return;
            }

            target[key] = value;
        });

        return target;
    }

    static IsPlainObject(value) {
        return Boolean(value) && typeof value === "object" && !Array.isArray(value);
    }
}
