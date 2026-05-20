import { AssetManager } from "./AssetManager.js";

export class JsonManifestComposer {
    static cache = new Map();

    static Compose(name, assets = AssetManager.instance) {
        if (this.cache.has(name)) {
            return this.cache.get(name);
        }

        const manifest = assets.GetJson(name);
        if (!manifest?.compose) {
            return manifest;
        }

        const result = this.CloneWithoutCompose(manifest);

        manifest.compose.forEach(entry => {
            const childName = typeof entry === "string" ? entry : entry.name;
            const childManifest = this.Compose(childName, assets);
            this.DeepMerge(result, childManifest);
        });

        this.cache.set(name, result);
        return result;
    }

    static CloneWithoutCompose(manifest) {
        const clone = { ...manifest };
        delete clone.compose;
        return clone;
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
