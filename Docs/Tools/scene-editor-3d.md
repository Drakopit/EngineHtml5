# Scene Editor 3D

The Scene Editor 3D is a desktop authoring tool for GameForgeJS `Render3D`
scenes. It lives inside the sibling `GameForgeJsEditor` Tauri/Rust
application, so the runtime does not contain an authoring application or
editor dependencies.

## Run

```sh
cd ../GameForgeJsEditor
npm install
npm run dev
```

In the desktop app, select `Scene Editor 3D`. Its Render3D modules are bundled
from GameForgeJS when the editor is built; running the engine web server is not
required for authoring.

## Features

- WebGL `Render3D` viewport with directional shadows.
- Hierarchy with cube, sphere and plane creation.
- Duplicate and delete operations.
- Inspector for name, primitive, transform, albedo, roughness, metallic and shadows.
- Background and sunlight settings.
- Orbit camera and frame-selected command.
- Native open, save and save-as operations for `.scene.json` documents.
- Browser import/export fallback while previewing the frontend without Tauri.

This is a focused first editor, not a complete Unity replacement. Future
layers can add asset browsing, model placement, gizmos, colliders and prefab
composition.

## Runtime Contract

Exported files use the reusable `SceneManifest3D` module:

```js
import { AssetManager } from "../CoreCross/index.js";
import { Level3D, SceneManifest3D } from "../Core3D/index.js";

export class MySceneLevel extends Level3D {
    BuildScene() {
        const document = AssetManager.instance.GetJson("scene");
        this.scene.backgroundColor = [...document.backgroundColor];
        this.camera = SceneManifest3D.CreateCamera(document.camera, this.width / this.height);
        this.scene.Add(this.camera);
        SceneManifest3D.Populate(this.scene, document);
    }
}
```

Declare the exported document in the demo's own `resources.json`:

```json
{
  "jsons": [
    { "name": "scene", "path": "Demos/My3DGame/Assets/Manifests/start.scene.json" }
  ]
}
```

The editor owns no game rules. The demo may add movement, collisions, scripts,
goals, NPCs or UI after instantiating the authored scene.
