import { PerspectiveCamera } from "../Camera/PerspectiveCamera.js";
import { AmbientLight } from "../Light/AmbientLight.js";
import { DirectionalLight } from "../Light/DirectionalLight.js";
import { HemisphereLight } from "../Light/HemisphereLight.js";
import { PointLight } from "../Light/PointLight.js";
import { SpotLight } from "../Light/SpotLight.js";
import { StandardMaterial } from "../Material/StandardMaterial.js";
import { UnlitMaterial } from "../Material/UnlitMaterial.js";
import { Mesh } from "../Mesh/Mesh.js";
import { PrimitiveMesh } from "../Mesh/PrimitiveMesh.js";
import { Scene3D } from "./Scene3D.js";

/**
 * Creates simple Render3D scenes from JSON-compatible game manifests.
 *
 * A game or an authoring tool owns the manifest data; this factory converts
 * its camera, lights, primitives and basic materials into runtime objects.
 *
 * @example
 * const { scene, camera } = SceneManifest3D.Create(levelManifest, {
 *     aspect: canvas.width / canvas.height,
 * });
 */
export class SceneManifest3D {
    /**
     * Builds a scene, camera and manifest-owned content collection.
     * @param {Object} [manifest={}] - Scene manifest definition.
     * @param {Object} [options] - Creation context.
     * @param {number} [options.aspect=1] - Camera aspect ratio.
     * @returns {Object} Object containing `scene`, `camera`, `lights` and `objects`.
     */
    static Create(manifest = {}, { aspect = 1 } = {}) {
        const scene = new Scene3D({
            backgroundColor: manifest.backgroundColor ?? [0.03, 0.04, 0.07, 1],
        });
        const camera = this.CreateCamera(manifest.camera, aspect);
        scene.Add(camera);
        const content = this.Populate(scene, manifest);
        return { scene, camera, ...content };
    }

    /**
     * Creates a perspective camera from a manifest definition.
     * @param {Object} [definition={}] - Camera values.
     * @param {number} [aspect=1] - Current viewport aspect ratio.
     * @returns {PerspectiveCamera} Created camera.
     */
    static CreateCamera(definition = {}, aspect = 1) {
        return new PerspectiveCamera({
            ...definition,
            aspect,
            position: definition.position ?? [7, 5, 9],
            target: definition.target ?? [0, 0, 0],
        });
    }

    /**
     * Adds declared lights and primitive objects to an existing scene.
     * @param {Scene3D} scene - Target scene.
     * @param {Object} [manifest={}] - Scene manifest definition.
     * @returns {Object} Added `lights` and `objects`.
     */
    static Populate(scene, manifest = {}) {
        const lights = (manifest.lights ?? []).map(definition => {
            const light = this.CreateLight(definition);
            scene.Add(light);
            return light;
        });
        const objects = (manifest.objects ?? []).map(definition => {
            const mesh = this.CreateObject(definition);
            scene.Add(mesh);
            return mesh;
        });

        return { lights, objects };
    }

    /**
     * Creates one supported light definition.
     * @param {Object} [definition={}] - Manifest light, selected by `type`.
     * @returns {Light} Render3D light.
     */
    static CreateLight(definition = {}) {
        switch (definition.type) {
            case "ambient":
                return new AmbientLight(definition);
            case "hemisphere":
                return new HemisphereLight(definition);
            case "point":
                return new PointLight(definition);
            case "spot":
                return new SpotLight(definition);
            case "directional":
            default:
                return new DirectionalLight(definition);
        }
    }

    /**
     * Creates a primitive mesh and applies its declared transform.
     * @param {Object} [definition={}] - Manifest object definition.
     * @returns {Mesh} Scene mesh.
     */
    static CreateObject(definition = {}) {
        const material = this.CreateMaterial(definition.material);
        const mesh = Mesh.FromGeometry(
            this.CreateGeometry(definition.primitive),
            material,
            {
                name: definition.name ?? "SceneObject",
                castShadow: definition.castShadow !== false,
                receiveShadow: definition.receiveShadow !== false,
                visible: definition.visible !== false,
            },
        );
        const transform = definition.transform ?? {};
        mesh.transform
            .SetPosition(...(transform.position ?? [0, 0, 0]))
            .SetRotation(...(transform.rotation ?? [0, 0, 0]))
            .SetScale(...(transform.scale ?? [1, 1, 1]));
        return mesh;
    }

    /**
     * Creates cube, beveled cube, plane, sphere or ring geometry.
     * @param {Object} [definition={}] - Primitive definition.
     * @returns {Geometry3D} Generated geometry.
     */
    static CreateGeometry(definition = {}) {
        switch (definition.type) {
            case "plane":
                return PrimitiveMesh.Plane(
                    definition.width ?? 10,
                    definition.depth ?? 10,
                    { subdivisions: definition.subdivisions ?? 1 },
                );
            case "sphere":
                return PrimitiveMesh.Sphere(definition.radius ?? 0.5, {
                    widthSegments: definition.widthSegments ?? 24,
                    heightSegments: definition.heightSegments ?? 12,
                });
            case "ring":
                return PrimitiveMesh.Ring(
                    definition.innerRadius ?? 0.75,
                    definition.outerRadius ?? 1,
                    { segments: definition.segments ?? 48 },
                );
            case "beveledCube":
                return PrimitiveMesh.BeveledCube(definition.bevel ?? 0.08);
            case "cube":
            default:
                return PrimitiveMesh.Cube(definition.size ?? 1);
        }
    }

    /**
     * Creates a standard or unlit material from JSON-compatible values.
     * @param {Object} [definition={}] - Material definition.
     * @returns {Material} Created material.
     */
    static CreateMaterial(definition = {}) {
        if (definition.type === "unlit") {
            return new UnlitMaterial({
                name: definition.name,
                color: definition.color ?? definition.albedoColor,
                transparent: definition.transparent,
            });
        }

        return new StandardMaterial({
            name: definition.name,
            albedoColor: definition.albedoColor,
            emissiveColor: definition.emissiveColor,
            roughness: definition.roughness,
            metallic: definition.metallic,
            transparent: definition.transparent,
        });
    }
}
