<p align="center">
  <img src="Docs/assets/gameforgejs-banner.png" alt="GameForgeJS Banner" width="100%" />
</p>

# GameForgeJS

GameForgeJS is an experimental engine/framework in pure JavaScript for browser games. The goal is to allow building demos, 2D/3D games, and tools without locking the runtime to external dependencies.

Node.js is optional: it only acts as a local development server to avoid CORS when loading JSON, images, audio, shaders, and models.

## Principles

- Runtime independent, based on native JavaScript and browser APIs.
- Each game/demo has its own window, screen, and input configuration.
- Assets and levels should move toward data-driven manifests.
- The engine should support classical inheritance and gradually evolve toward componentization.
- Tools like the 3D Scene Editor and WorldEditor should live outside the demos, so they can serve any project.

## How to Run

```sh
npm run start
```

Then open:

```txt
http://localhost:8080/Main.html
```

Without a query string, `Main.html` opens Admin Mode — a screen to choose which demo to run.

The 2D and 3D editors live in the external desktop application `../GameForgeJsEditor` and do not depend on the engine's web server.

Direct links still work:

```txt
http://localhost:8080/Main.html?demo=advanced
http://localhost:8080/Main.html?demo=tactical
http://localhost:8080/Main.html?demo=fighting2d
http://localhost:8080/Main.html?demo=adventure2d
http://localhost:8080/Main.html?demo=demo3d
http://localhost:8080/Main.html?demo=solar3d
http://localhost:8080/Main.html?demo=mini3d
http://localhost:8080/Main.html?demo=online
http://localhost:8080/Main.html?demo=immature
```

To test the Online MMO demo between two computers on the same network, serve the client:

```sh
npm run start
```

In another terminal, run the optional relay from the external tools project, which has its own dependencies:

```sh
cd ../GameForgeJsTools/NodeWebSocketRelay
npm install
npm start
```

Then share an address using the IP of the machine that started the server:

```txt
http://YOUR_IP:8080/Main.html?demo=online&room=terra&name=Colega&server=ws%3A%2F%2FYOUR_IP%3A3000
```

The relay is for testing only. A real MMO requires an authoritative external backend; GameForgeJS remains pure client-side JavaScript with no `ws` dependency.

## Demos

| Demo | Entry | Config | Description |
| --- | --- | --- | --- |
| Advanced | `Demos/DemoAdvanced/mainAdvanced.js` | `Demos/DemoAdvanced/advanced.config.json` | 2D Platformer/RPG with manifests, levels, inventory, skill tree, hitboxes, and HUD. |
| Tactical RPG | `Demos/DemoTacticalRPG/mainTacticalRPG.js` | `Demos/DemoTacticalRPG/tactical.config.json` | Tactical grid with AStar, movement range, action, and battle system. |
| Fighting 2D | `Demos/DemoFightingGame2D/mainFightingGame2D.js` | `Demos/DemoFightingGame2D/fighting.config.json` | Menu, arcade, versus, character select, configurable keyboard and gamepad. |
| Adventure 2D | `Demos/DemoAdventure2D/mainAdventure2D.js` | `Demos/DemoAdventure2D/adventure.config.json` | Component-based top-down adventure with camera transitions between rooms. |
| Demo 3D | `Demos/Demo3D/mainDemo3D.js` | `Demos/Demo3D/demo3d.config.json` | Render3D layer validation with WebGL2, lighting, normal maps, and shadows. |
| Solar System 3D | `Demos/DemoSolarSystem/mainSolarSystem.js` | `Demos/DemoSolarSystem/solar.config.json` | Render3D demo with procedural planet shaders, sunlight, and orbits. |
| MiniGame 3D | `Demos/DemoMiniGame3D/mainMiniGame3D.js` | `Demos/DemoMiniGame3D/mini3d.config.json` | Sky Trail with moving platforms, PBR/parallax, shadows, skybox, physics, and gamepad. |
| Online MMO | `Demos/DemoOnlineMMO/mainOnlineMMO.js` | `Demos/DemoOnlineMMO/online.config.json` | 2D online sandbox with canvas chat, custom map, and local tab sync via swappable adapter. |
| Immature | `Demos/Demo/mainImmature.js` | `Demos/Demo/immature.config.json` | Simple movement and collision example. |

## Structure

```txt
GameForgeJS/
  CoreCross/             Bootstrap, loop, config, assets, audio, input, math, shared components and pathfinding
  Core2D/                Canvas 2D, GameObject, camera, scene, UI, collision, combat, particles and 2D effects
  Core3D/                WebGL/Render3D, Level3D, models, shaders, window, objects and 3D physics
  CoreNetwork/           Reusable networking and online: GameNetwork, adapters, chat and sync
  Tools/                 Optional local static server for development
  Scripts/               Engine documentation verification and generation
  Docs/                  Guides, tutorials and generated JSDoc reference
  Demos/                 All playable and technical demos
    DemoAdvanced/        Data-driven platformer/RPG demo
    DemoFightingGame2D/  2D fighting demo
    DemoAdventure2D/     Component-based top-down adventure demo
    DemoTacticalRPG/     Tactical demo
    Demo3D/              WebGL demo
    DemoSolarSystem/     Render3D solar system demo
    DemoMiniGame3D/      3D mini game
    DemoOnlineMMO/       2D online sandbox via CoreNetwork
```

## Creating a Project

A new project needs its own entry point, its own config, and — when it has assets — a `resources.json`.

```txt
MyGame/
  mygame.config.json
  resources.json
  mainMyGame.js
  Levels/
    FirstLevel.js
  Entities/
    Player.js
  Assets/
```

Minimal entry point:

```js
import { BootstrapGame } from "../CoreCross/index.js";
import { FirstLevel } from "./Levels/FirstLevel.js";

BootstrapGame({
    configPath: ["gameforge.config.json", "MyGame/mygame.config.json"],
    manifestPath: "MyGame/resources.json",
    levels: [
        new FirstLevel(),
    ],
});
```

`gameforge.config.json` holds engine-level defaults. `MyGame/mygame.config.json` overrides game-specific details: title, screen size, audio, input, and any other settings.

To make the game canvas fill the entire window responsively, set `"fullScreen": true` inside `screen`. The logical resolution is still defined by `width` and `height`, preserving game and UI coordinates.

Per-game input config example:

```json
{
  "input": {
    "gamepadProfile": "xbox",
    "actionMappings": {
      "ATTACK": [
        { "device": "keyboard", "input": "KeyZ" },
        { "device": "gamepad", "input": "X" }
      ],
      "RIGHT": [
        { "device": "keyboard", "input": "ArrowRight" },
        { "device": "gamepad", "input": "LEFT_STICK_RIGHT" },
        { "device": "gamepad", "input": "DPAD_RIGHT" }
      ]
    }
  }
}
```

## Assets and Manifests

Assets are loaded by `ResourceManifestLoader`:

```json
{
  "images": [
    { "name": "player_idle", "path": "MyGame/Assets/Player/IDLE.png" }
  ],
  "audios": [
    { "name": "jump", "path": "MyGame/Assets/Audio/Jump.wav" }
  ],
  "jsons": [
    { "name": "first_level", "path": "MyGame/Assets/Manifests/first.level.json" }
  ]
}
```

In the AdvancedDemo, levels are composed from smaller manifests. Shared configuration lives in:

```txt
Demos/DemoAdvanced/Assets/Manifests/advanced/stage-default.json
```

And a level composes defaults with level-specific parts:

```json
{
  "id": "advanced_snow_demo",
  "compose": [
    "advanced_stage_default",
    "advanced_core",
    "advanced_stage",
    "advanced_player",
    "advanced_enemies",
    "advanced_effects",
    "advanced_ui"
  ]
}
```

## Componentization

`GameObject` still supports the classic flow with `OnStart`, `OnUpdate`, `OnFixedUpdate`, `OnDrawn`, and `OnGUI`, but can now also receive reusable components.

```js
import { GameObject } from "./Core2D/index.js";
import { BoundsComponent, HealthComponent, TransformComponent } from "./CoreCross/index.js";

const entity = new GameObject();
entity.AddComponent(new TransformComponent({ x: 80, y: 120 }));
entity.AddComponent(new BoundsComponent({ width: 32, height: 32 }));
entity.AddComponent(new HealthComponent({ hp: 100 }));
```

See the full guide at [Componentization](Docs/Guides/components.md). This is the path toward evolving into an ECS-lite model without breaking existing demos.

## External Tools

The 3D Scene Editor and WorldEditor/WorldMaker now live in the separate desktop application `../GameForgeJsEditor`. The tool uses `game.workspace.json` to declare editable levels/scenes without adding any runtime dependency; `resources.json` remains the manifest loaded by the game. The 3D editor uses `Render3D`, hierarchy, inspector, and visual transform gizmos anchored to the selected object.

It is deliberately a lightweight first tool, not a full Unity reimplementation. The runtime stays pure JavaScript and the demos do not depend on the editor.

To run:

```sh
cd ../GameForgeJsEditor
npm run dev
```

The desktop editor can migrate old folders on save or create a fresh structure. In 2D, `New Project` generates `game.workspace.json`, `resources.json`, and `Assets/Manifests/editor/level_1/*` manifests. In 3D, `New Project` initializes a folder, while `Open Project` and `+ Scene` declare scenes in `game.workspace.json` and create files inside `Assets/Manifests/scenes/`. `Demos/Demo3D` includes an editable scene loaded by the demo. `Demos/DemoMiniGame3D` declares its native `course.json` as an editable level: the editor transforms platforms, coins, spawn, and goal, and newly saved courses appear in the game menu.

## Documentation

- [Official index](Docs/index.md)
- [Creating a project](Docs/GettingStarted/new-project.md)
- [Tutorial: creating 2D and 3D demos](Docs/GettingStarted/tutorial-demos-2d-3d.md)
- [Per-game input configuration](Docs/GettingStarted/input-config.md)
- [Gamepad cheat sheet](Docs/GettingStarted/gamepad.md)
- [CoreNetwork](Docs/Guides/network.md)
- [Componentization](Docs/Guides/components.md)
- [Render3D](Docs/Guides/render3d.md)
- [External 3D Scene Editor integration](Docs/Tools/scene-editor-3d.md)
- [Advanced Stage Manifest](Docs/Manifests/advanced-stage-manifest.md)
- [Hitbox Manifest 2D](Docs/Manifests/hitbox-manifest.md)
- [WorldEditor v4](Docs/Tools/world-editor-v4.md)
- [API Reference generated by JSDoc](Docs/Helper/index.md)

## Project Direction

The strongest path forward is:

- consolidating `GameObject + Component` with a **standardized lifecycle**
- creating reusable systems for rendering, physics, input, and animation
- turning entities into serializable data
- keeping authoring tools separate from the runtime (**GameForgeJSEditorsV2** in C# + Avalonia)
- finishing a small game using the engine as real-world validation

### Recommended New Structure

Prefer importing via the new package structure:

```js
import { Component, TransformComponent } from "../packages/core/index.js";
import { GameObject } from "../packages/2d/index.js";
```

See `templates/basic/` for a minimal example.

For real structure examples organized by game genre (Platformer, Top-Down, Isometric, Tactical, etc.), check the `templates/2d/` folder. Each subfolder shows how to organize `game.workspace.json`, the `levelType`, and the documents for that game style.
