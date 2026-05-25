# Scene Editor 3D

`Tools/SceneEditor3D/index.html` is a lightweight external authoring tool for
GameForgeJS `Render3D` scenes. It is separate from game demos: the editor may
use regular HTML controls, while gameplay UI remains inside GameForgeJS UI.

## Run

Start the local static server:

```sh
npm run start
```

Open:

```txt
http://localhost:8080/Tools/SceneEditor3D/index.html
```

The Admin Mode page also links to the tool.

## Features

- WebGL `Render3D` viewport with directional shadows.
- Hierarchy with cube, sphere and plane creation.
- Duplicate and delete operations.
- Inspector for name, primitive, transform, albedo, roughness, metallic and shadows.
- Background and sunlight settings.
- Orbit camera and frame-selected command.
- Import and export of `.scene.json` documents.

This is a focused first editor, not a complete Unity replacement. Future
layers can add asset browsing, model placement, gizmos, colliders, prefab
composition and direct save integration.

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
