import { AssetManager } from "../../CoreCross/Assets/AssetManager.js";
import { Geometry3D, Mesh, StandardMaterial } from "../Render3D/index.js";
import { Model3D } from "./Model3D.js";

/**
 * Converts model asset parts already loaded by `AssetManager` into Render3D meshes.
 */
export class ModelMeshFactory {
    /**
     * Builds a `Model3D` from a queued model asset.
     * @param {string} modelName - AssetManager model key.
     * @param {Object} [options] - Mesh naming and material options.
     * @param {Material|null} [options.material=null] - Shared material override.
     * @param {Function|null} [options.materialFactory=null] - Per-part material factory.
     * @returns {Model3D} Renderable model wrapper.
     */
    static FromAsset(modelName, { material = null, materialFactory = null, name = modelName } = {}) {
        const parts = AssetManager.instance.GetModel(modelName) ?? [];
        const meshes = parts.map((part, index) => {
            const geometry = new Geometry3D({
                positions: part.positions,
                normals: part.normals,
                uvs: part.uvs,
                indices: part.indices,
            });
            const meshMaterial = materialFactory
                ? materialFactory(part, index)
                : (material ?? new StandardMaterial({ name: `${name}_material_${index}` }));

            return Mesh.FromGeometry(geometry, meshMaterial, {
                name: part.name ? `${name}_${part.name}` : `${name}_${index}`,
            });
        });

        return new Model3D(meshes);
    }
}
