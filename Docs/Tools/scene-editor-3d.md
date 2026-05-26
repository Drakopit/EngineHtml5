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
- Hierarchy with platform, cube, sphere and plane creation.
- Duplicate and delete operations.
- Inspector for name, primitive, transform, albedo, roughness, metallic and shadows.
- Background and sunlight settings.
- Orbit camera and frame-selected command.
- Object-anchored viewport translate, rotate and scale handles, with `W`, `E` and `R` mode shortcuts.
- Project-aware scene list declared in `game.workspace.json`.
- `New Project` initialization for a new 3D project folder.
- `+ Scene` creation and save operations for `.scene.json` documents, plus native `SkyTrailCourse` level creation for `DemoMiniGame3D`.
- Native open and save-as operations for loose `.scene.json` documents.
- Browser import/export fallback while previewing the frontend without Tauri.

This is a focused editor, not a complete Unity replacement. Further layers
can add asset browsing, model placement, colliders and prefab composition.

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

Use `Open Project` for a demo folder containing `game.workspace.json` or a
legacy `resources.json`, or `New Project` for an empty project folder, then use
`+ Scene` and `Save`. `Demos/Demo3D` is a ready-to-open example whose runtime
loads its editable `Render3D Showcase` scene before adding animation and
textures. The editor creates
`Assets/Manifests/scenes/<name>.scene.json` and declares it in the demo's own
`game.workspace.json`. It also registers the runtime resource in `resources.json`, equivalent to:

```json
{
  "jsons": [
    { "name": "scene", "path": "Demos/My3DGame/Assets/Manifests/scenes/start.scene.json" }
  ]
}
```

`Demos/DemoMiniGame3D` is also ready to open as a project. Its workspace maps
`Assets/Manifests/sky-trail/course.json` into editable terrain, coin, player
spawn and goal markers without changing the runtime schema. In that project,
`+ Platform` adds playable terrain and `+ Scene` creates a new course resource;
after saving and reloading the demo, the game menu lists the saved courses.

For ordinary `SceneManifest3D` projects, the editor owns no game rules. The
demo may add movement, collisions, scripts, goals, NPCs or UI after
instantiating the authored scene.
