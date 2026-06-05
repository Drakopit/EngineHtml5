import { AssetManager } from "../../../src/CoreCross/Assets/AssetManager.js";
import { Mesh, PrimitiveMesh, StandardMaterial, Texture } from "../../../src/Core3D/index.js";

export class SkyTrailSurfaceFactory {
    constructor(config) {
        this.config = config;
        this.assets = AssetManager.instance;
        this.geometry = PrimitiveMesh.BeveledCube(config.bevel);
        this.textures = this.CreateTextures();
    }

    CreatePlatform(definition) {
        const baseColor = [...definition.color];
        const material = new StandardMaterial({
            name: `PlatformMaterial_${definition.id}`,
            ...this.textures,
            albedoColor: baseColor,
            uvScale: [
                Math.max(1, definition.size.x * this.config.uvDensity),
                Math.max(1, definition.size.z * this.config.uvDensity),
            ],
            normalScale: this.config.normalScale,
            heightScale: this.config.heightScale,
            roughness: this.config.roughness,
        });
        const mesh = Mesh.FromGeometry(
            this.geometry,
            material,
            { name: `Platform_${definition.id}`, castShadow: true, receiveShadow: true },
        );

        return { baseColor, material, mesh };
    }

    CreateTextures() {
        const names = this.config.textures;
        const options = { anisotropy: this.config.anisotropy };
        const albedoName = this.assets.HasImage(names.albedo) ? names.albedo : names.fallbackAlbedo;

        return {
            albedoMap: Texture.FromImage(this.assets.GetImage(albedoName), options),
            normalMap: this.OptionalTexture(names.normal, options),
            ormMap: this.OptionalTexture(names.orm, options),
            heightMap: this.OptionalTexture(names.height, options),
        };
    }

    OptionalTexture(name, options) {
        return this.assets.HasImage(name)
            ? Texture.FromImage(this.assets.GetImage(name), options)
            : null;
    }
}
