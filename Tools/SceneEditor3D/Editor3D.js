import { SceneManifest3D, WebGL3DRenderer } from "../../Core3D/index.js";

const DEFAULT_SCENE = Object.freeze({
    version: 1,
    name: "New 3D Scene",
    backgroundColor: [0.035, 0.055, 0.08, 1],
    camera: {
        fov: 55,
        near: 0.1,
        far: 240,
        position: [8, 6, 9],
        target: [0, 0.5, 0],
    },
    lights: [
        { type: "ambient", color: [0.8, 0.9, 1], intensity: 0.08 },
        { type: "hemisphere", skyColor: [0.52, 0.72, 1], groundColor: [0.25, 0.2, 0.16], intensity: 0.36 },
        {
            type: "directional",
            direction: [-0.5, -1, -0.3],
            color: [1, 0.95, 0.82],
            intensity: 2,
            castShadow: true,
            shadowMapSize: 1024,
            shadowDistance: 25,
        },
    ],
    objects: [
        {
            id: "ground",
            name: "Ground",
            primitive: { type: "plane", width: 16, depth: 16, subdivisions: 8 },
            transform: { position: [0, -0.55, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
            material: { albedoColor: [0.28, 0.34, 0.32, 1], roughness: 0.95, metallic: 0 },
            castShadow: false,
        },
        {
            id: "platform",
            name: "Platform",
            primitive: { type: "beveledCube", bevel: 0.08 },
            transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [3.5, 0.45, 3.5] },
            material: { albedoColor: [0.25, 0.6, 0.68, 1], roughness: 0.62, metallic: 0.03 },
            castShadow: true,
        },
        {
            id: "sphere",
            name: "Player Marker",
            primitive: { type: "sphere", radius: 0.5 },
            transform: { position: [0, 0.78, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
            material: { albedoColor: [0.96, 0.58, 0.18, 1], roughness: 0.34, metallic: 0.12 },
            castShadow: true,
        },
    ],
});

class Editor3D {
    constructor() {
        this.canvas = document.getElementById("scene-viewport");
        this.status = document.getElementById("status");
        this.document = clone(DEFAULT_SCENE);
        this.selectedId = "platform";
        this.meshById = new Map();
        this.dragging = false;
        this.pointer = { x: 0, y: 0 };
        this.orbit = { yaw: 0, pitch: 0, distance: 1 };

        try {
            this.renderer = new WebGL3DRenderer(this.canvas, {
                clearColor: this.document.backgroundColor,
                antialias: true,
            });
        } catch (error) {
            this.SetStatus(error.message);
            throw error;
        }

        this.BindCommands();
        this.BindInspector();
        this.BindViewport();
        this.LoadDocument(this.document);
        requestAnimationFrame(() => this.Render());
    }

    LoadDocument(document) {
        this.document = normalizeDocument(document);
        this.selectedId = this.document.objects.some(object => object.id === this.selectedId)
            ? this.selectedId
            : this.document.objects[0]?.id ?? null;
        this.RebuildScene();
        this.DrawHierarchy();
        this.SyncSceneInspector();
        this.SyncObjectInspector();
        this.SetStatus(`Scene loaded: ${this.document.name}`);
    }

    RebuildScene() {
        const created = SceneManifest3D.Create(this.document, {
            aspect: this.canvas.clientWidth / Math.max(1, this.canvas.clientHeight),
        });
        this.scene = created.scene;
        this.camera = created.camera;
        this.meshById = new Map(this.document.objects.map((object, index) => [object.id, created.objects[index]]));
        this.SyncOrbitFromCamera();
        this.HighlightSelection();
    }

    BindCommands() {
        document.getElementById("new-scene").addEventListener("click", () => {
            this.selectedId = "platform";
            this.LoadDocument(clone(DEFAULT_SCENE));
        });
        document.getElementById("export-scene").addEventListener("click", () => this.ExportDocument());
        document.getElementById("import-scene").addEventListener("change", event => this.ImportDocument(event));
        document.getElementById("duplicate-object").addEventListener("click", () => this.DuplicateObject());
        document.getElementById("delete-object").addEventListener("click", () => this.DeleteObject());
        document.getElementById("focus-object").addEventListener("click", () => this.FocusSelection());
        document.querySelectorAll("[data-create]").forEach(button => {
            button.addEventListener("click", () => this.CreateObject(button.dataset.create));
        });
    }

    BindInspector() {
        document.getElementById("scene-name").addEventListener("input", event => {
            this.document.name = event.target.value || "Untitled Scene";
        });
        document.getElementById("scene-background").addEventListener("input", event => {
            this.document.backgroundColor = [...hexToRgb(event.target.value), 1];
            this.scene.backgroundColor = [...this.document.backgroundColor];
        });
        document.getElementById("sun-intensity").addEventListener("input", event => {
            const sun = this.document.lights.find(light => light.type === "directional");
            if (!sun) return;
            sun.intensity = number(event.target.value, sun.intensity);
            const renderSun = this.scene.GetLights("directional")[0];
            if (renderSun) renderSun.intensity = sun.intensity;
        });

        document.getElementById("object-name").addEventListener("input", event => {
            const object = this.SelectedObject();
            if (!object) return;
            object.name = event.target.value || "Scene Object";
            this.meshById.get(object.id).name = object.name;
            this.DrawHierarchy();
        });
        document.getElementById("object-primitive").addEventListener("change", event => {
            const object = this.SelectedObject();
            if (!object) return;
            object.primitive = primitiveDefinition(event.target.value);
            this.RebuildScene();
        });
        document.getElementById("object-color").addEventListener("input", event => {
            const object = this.SelectedObject();
            if (!object) return;
            object.material.albedoColor = [...hexToRgb(event.target.value), 1];
            this.meshById.get(object.id).material.albedoColor = [...object.material.albedoColor];
        });
        document.getElementById("object-roughness").addEventListener("input", event => {
            this.UpdateMaterialNumber("roughness", event.target.value);
        });
        document.getElementById("object-metallic").addEventListener("input", event => {
            this.UpdateMaterialNumber("metallic", event.target.value);
        });
        document.getElementById("object-shadow").addEventListener("change", event => {
            const object = this.SelectedObject();
            if (!object) return;
            object.castShadow = event.target.checked;
            this.meshById.get(object.id).castShadow = object.castShadow;
        });

        document.querySelectorAll("[data-vector]").forEach(group => {
            group.querySelectorAll("input").forEach(input => {
                input.addEventListener("input", () => this.UpdateTransform(group.dataset.vector, group));
            });
        });
    }

    BindViewport() {
        this.canvas.addEventListener("pointerdown", event => {
            this.dragging = true;
            this.pointer = { x: event.clientX, y: event.clientY };
            this.canvas.setPointerCapture(event.pointerId);
        });
        this.canvas.addEventListener("pointermove", event => {
            if (!this.dragging) return;
            this.orbit.yaw -= (event.clientX - this.pointer.x) * 0.008;
            this.orbit.pitch = clamp(this.orbit.pitch + (event.clientY - this.pointer.y) * 0.008, -1.45, 1.45);
            this.pointer = { x: event.clientX, y: event.clientY };
            this.ApplyOrbit();
        });
        this.canvas.addEventListener("pointerup", () => { this.dragging = false; });
        this.canvas.addEventListener("wheel", event => {
            event.preventDefault();
            this.orbit.distance = clamp(this.orbit.distance * (1 + event.deltaY * 0.001), 1.2, 90);
            this.ApplyOrbit();
        }, { passive: false });
    }

    CreateObject(type) {
        const object = {
            id: createId(type),
            name: displayName(type),
            primitive: primitiveDefinition(type),
            transform: { position: [0, 0.4, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
            material: { albedoColor: [0.3, 0.64, 0.78, 1], roughness: 0.58, metallic: 0.04 },
            castShadow: true,
        };
        if (type === "plane") {
            object.transform.position[1] = 0;
            object.castShadow = false;
        }
        this.document.objects.push(object);
        this.selectedId = object.id;
        this.RebuildScene();
        this.DrawHierarchy();
        this.SyncObjectInspector();
    }

    DuplicateObject() {
        const object = this.SelectedObject();
        if (!object) return;
        const duplicate = clone(object);
        duplicate.id = createId(object.primitive.type);
        duplicate.name = `${object.name} Copy`;
        duplicate.transform.position[0] += 0.8;
        this.document.objects.push(duplicate);
        this.selectedId = duplicate.id;
        this.RebuildScene();
        this.DrawHierarchy();
        this.SyncObjectInspector();
    }

    DeleteObject() {
        const object = this.SelectedObject();
        if (!object) return;
        this.document.objects = this.document.objects.filter(candidate => candidate.id !== object.id);
        this.selectedId = this.document.objects[0]?.id ?? null;
        this.RebuildScene();
        this.DrawHierarchy();
        this.SyncObjectInspector();
    }

    DrawHierarchy() {
        const hierarchy = document.getElementById("hierarchy");
        hierarchy.replaceChildren();
        this.document.objects.forEach(object => {
            const item = document.createElement("li");
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = object.name;
            button.classList.toggle("selected", object.id === this.selectedId);
            button.addEventListener("click", () => {
                this.selectedId = object.id;
                this.DrawHierarchy();
                this.SyncObjectInspector();
                this.HighlightSelection();
            });
            item.appendChild(button);
            hierarchy.appendChild(item);
        });
    }

    SyncSceneInspector() {
        document.getElementById("scene-name").value = this.document.name;
        document.getElementById("scene-background").value = rgbToHex(this.document.backgroundColor);
        const sun = this.document.lights.find(light => light.type === "directional");
        document.getElementById("sun-intensity").value = sun?.intensity ?? 0;
    }

    SyncObjectInspector() {
        const object = this.SelectedObject();
        const fieldset = document.getElementById("object-inspector");
        fieldset.disabled = !object;
        if (!object) return;

        document.getElementById("object-name").value = object.name;
        document.getElementById("object-primitive").value = object.primitive.type;
        document.getElementById("object-color").value = rgbToHex(object.material.albedoColor);
        document.getElementById("object-roughness").value = object.material.roughness;
        document.getElementById("object-metallic").value = object.material.metallic;
        document.getElementById("object-shadow").checked = object.castShadow !== false;
        ["position", "rotation", "scale"].forEach(key => {
            const inputs = document.querySelector(`[data-vector="${key}"]`).querySelectorAll("input");
            inputs.forEach((input, index) => { input.value = object.transform[key][index]; });
        });
    }

    UpdateTransform(key, group) {
        const object = this.SelectedObject();
        if (!object) return;
        object.transform[key] = Array.from(group.querySelectorAll("input"), input => number(input.value, 0));
        const transform = this.meshById.get(object.id).transform;
        if (key === "position") transform.SetPosition(...object.transform.position);
        if (key === "rotation") transform.SetRotation(...object.transform.rotation);
        if (key === "scale") transform.SetScale(...object.transform.scale);
    }

    UpdateMaterialNumber(key, rawValue) {
        const object = this.SelectedObject();
        if (!object) return;
        object.material[key] = number(rawValue, object.material[key]);
        this.meshById.get(object.id).material[key] = object.material[key];
    }

    HighlightSelection() {
        this.document.objects.forEach(object => {
            const material = this.meshById.get(object.id)?.material;
            if (!material || material.type !== "standard") return;
            material.emissiveColor = object.id === this.selectedId ? [0.03, 0.1, 0.14] : [0, 0, 0];
        });
    }

    FocusSelection() {
        const object = this.SelectedObject();
        if (!object) return;
        this.camera.LookAt([...object.transform.position]);
        this.SyncOrbitFromCamera();
        this.orbit.distance = Math.max(3, Math.hypot(...object.transform.scale) * 2.8);
        this.ApplyOrbit();
    }

    SyncOrbitFromCamera() {
        const delta = this.camera.position.map((value, index) => value - this.camera.target[index]);
        this.orbit.distance = Math.hypot(...delta) || 1;
        this.orbit.yaw = Math.atan2(delta[0], delta[2]);
        this.orbit.pitch = Math.asin(delta[1] / this.orbit.distance);
    }

    ApplyOrbit() {
        const horizontal = Math.cos(this.orbit.pitch) * this.orbit.distance;
        const target = this.camera.target;
        this.camera.SetPosition(
            target[0] + Math.sin(this.orbit.yaw) * horizontal,
            target[1] + Math.sin(this.orbit.pitch) * this.orbit.distance,
            target[2] + Math.cos(this.orbit.yaw) * horizontal,
        );
        this.document.camera.position = [...this.camera.position];
        this.document.camera.target = [...this.camera.target];
    }

    SelectedObject() {
        return this.document.objects.find(object => object.id === this.selectedId) ?? null;
    }

    async ImportDocument(event) {
        const file = event.target.files?.[0];
        if (!file) return;
        try {
            this.LoadDocument(JSON.parse(await file.text()));
        } catch (error) {
            this.SetStatus(`Cannot import scene: ${error.message}`);
        } finally {
            event.target.value = "";
        }
    }

    ExportDocument() {
        const fileName = `${slug(this.document.name) || "scene"}.scene.json`;
        const blob = new Blob([JSON.stringify(this.document, null, 4)], { type: "application/json" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(link.href);
        this.SetStatus(`Exported ${fileName}`);
    }

    SetStatus(message) {
        this.status.textContent = message;
    }

    Render() {
        if (this.renderer && this.scene) this.renderer.Render(this.scene, this.camera);
        requestAnimationFrame(() => this.Render());
    }
}

function primitiveDefinition(type) {
    if (type === "sphere") return { type, radius: 0.5, widthSegments: 24, heightSegments: 12 };
    if (type === "plane") return { type, width: 5, depth: 5, subdivisions: 4 };
    if (type === "ring") return { type, innerRadius: 0.65, outerRadius: 1, segments: 48 };
    if (type === "cube") return { type, size: 1 };
    return { type: "beveledCube", bevel: 0.08 };
}

function normalizeDocument(document) {
    const result = clone(document);
    result.version ??= 1;
    result.name ??= "Imported Scene";
    result.backgroundColor ??= [0.035, 0.055, 0.08, 1];
    result.camera ??= clone(DEFAULT_SCENE.camera);
    result.lights ??= clone(DEFAULT_SCENE.lights);
    result.objects ??= [];
    result.objects.forEach((object, index) => {
        object.id ??= createId(`object_${index}`);
        object.name ??= `Object ${index + 1}`;
        object.primitive ??= primitiveDefinition("cube");
        object.transform = {
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            ...object.transform,
        };
        object.material = {
            albedoColor: [0.7, 0.7, 0.7, 1],
            roughness: 0.6,
            metallic: 0,
            ...object.material,
        };
        object.castShadow ??= true;
    });
    return result;
}

function displayName(type) {
    return ({ beveledCube: "Cube", sphere: "Sphere", plane: "Plane" })[type] ?? "Object";
}

function hexToRgb(hex) {
    const value = Number.parseInt(hex.replace("#", ""), 16);
    return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
}

function rgbToHex(color = [0, 0, 0]) {
    const parts = color.slice(0, 3).map(value => Math.round(clamp(value, 0, 1) * 255).toString(16).padStart(2, "0"));
    return `#${parts.join("")}`;
}

function createId(prefix) {
    return `${prefix}_${Date.now().toString(36)}_${Math.floor(Math.random() * 1000).toString(36)}`;
}

function number(value, fallback) {
    const result = Number.parseFloat(value);
    return Number.isFinite(result) ? result : fallback;
}

function slug(value) {
    return String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

new Editor3D();
