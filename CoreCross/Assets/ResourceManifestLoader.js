export class ResourceManifestLoader {
    static async Load(paths, assets) {
        const manifestPaths = Array.isArray(paths) ? paths : [paths];
        const manifests = [];

        for (const path of manifestPaths) {
            manifests.push(await this.Queue(path, assets));
        }

        await assets.LoadAll();
        return manifests.length === 1 ? manifests[0] : manifests;
    }

    static async Queue(path, assets) {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`Manifest not found: ${path}`);
        }

        const manifest = await response.json();

        manifest.images?.forEach(asset => assets.QueueImage(asset.name, asset.path));
        manifest.audios?.forEach(asset => assets.QueueAudio(asset.name, asset.path));
        manifest.shaders?.forEach(asset => assets.QueueShader(asset.name, asset.path));
        manifest.models?.forEach(asset => assets.QueueModel(asset.name, asset.path));
        manifest.jsons?.forEach(asset => assets.QueueJson?.(asset.name, asset.path));

        return manifest;
    }
}
