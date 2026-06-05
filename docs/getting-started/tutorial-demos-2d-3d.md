# Tutorial: Creating 2D And 3D Demos

This guide creates small demos using the current GameForgeJS architecture:

- `CoreCross` owns bootstrap, input, assets, configuration and math.
- `Core2D` owns canvas drawing, 2D objects, UI and collisions.
- `Core3D` owns `Level3D`, `Render3D`, materials, lights, physics and scene manifests.
- Each demo owns its assets, manifests, entities and game rules.

Do not place game content inside engine modules or `tools/server.js`.

## Common Project Shape

Put new examples under `examples/`:

```txt
examples/DemoHello/
  Assets/
    Manifests/
  hello.config.json
  resources.json
  mainHello.js
  HelloLevel.js
```

Every demo starts through `BootstrapGame`:

```js
import { BootstrapGame } from "../../src/CoreCross/index.js";
import { HelloLevel } from "./HelloLevel.js";

BootstrapGame({
    configPath: ["gameforge.config.json", "examples/DemoHello/hello.config.json"],
    manifestPath: "examples/DemoHello/resources.json",
    levels: [new HelloLevel()],
});
```

`resources.json` declares files to preload. A level reads loaded JSON with
`AssetManager.instance.GetJson("asset_name")`.

## Create A 2D Demo

### 1. Create The Files

```txt
examples/DemoHello2D/
  Assets/Manifests/room.json
  hello2d.config.json
  resources.json
  mainHello2D.js
  Hello2DLevel.js
  Player.js
```

### 2. Configure Screen And Actions

`examples/DemoHello2D/hello2d.config.json`:

```json
{
  "project": { "name": "Hello 2D", "version": "1.0.0" },
  "window": { "title": "Hello 2D", "backgroundColor": "#111923", "cursor": "default" },
  "screen": { "width": 640, "height": 480, "fullScreen": true },
  "input": {
    "actionMappings": {
      "UP": [
        { "device": "keyboard", "input": "KeyW" },
        { "device": "keyboard", "input": "ArrowUp" },
        { "device": "gamepad", "input": "LEFT_STICK_UP" }
      ],
      "DOWN": [
        { "device": "keyboard", "input": "KeyS" },
        { "device": "keyboard", "input": "ArrowDown" },
        { "device": "gamepad", "input": "LEFT_STICK_DOWN" }
      ],
      "LEFT": [
        { "device": "keyboard", "input": "KeyA" },
        { "device": "gamepad", "input": "LEFT_STICK_LEFT" }
      ],
      "RIGHT": [
        { "device": "keyboard", "input": "KeyD" },
        { "device": "gamepad", "input": "LEFT_STICK_RIGHT" }
      ]
    }
  }
}
```

### 3. Put Coordinates In A Manifest

`examples/DemoHello2D/Assets/Manifests/room.json`:

```json
{
  "player": { "spawn": [80, 200], "size": [28, 28], "speed": 230 },
  "coins": [
    { "position": [220, 160], "radius": 10 },
    { "position": [450, 300], "radius": 10 }
  ]
}
```

`examples/DemoHello2D/resources.json`:

```json
{
  "jsons": [
    { "name": "hello_room", "path": "examples/DemoHello2D/Assets/Manifests/room.json" }
  ]
}
```

### 4. Create A Player Entity

`examples/DemoHello2D/Player.js`:

```js
import { ActionManager, Vector2D } from "../../src/CoreCross/index.js";
import { Draw, GameObject } from "../../src/Core2D/index.js";

export class Player extends GameObject {
    constructor(screen, data) {
        super();
        this.draw = new Draw(screen);
        this.position = new Vector2D(data.spawn[0], data.spawn[1]);
        this.size = new Vector2D(data.size[0], data.size[1]);
        this.speed = data.speed;
    }

    OnUpdate(dt) {
        const x = ActionManager.GetActionValue("RIGHT") - ActionManager.GetActionValue("LEFT");
        const y = ActionManager.GetActionValue("DOWN") - ActionManager.GetActionValue("UP");
        this.position.x += x * this.speed * dt;
        this.position.y += y * this.speed * dt;
    }

    OnDrawn() {
        this.draw.Color = "#43B9E6";
        this.draw.DrawRect(this.position.x, this.position.y, this.size.x, this.size.y);
    }
}
```

### 5. Create The Level

`examples/DemoHello2D/Hello2DLevel.js`:

```js
import { AssetManager, Level, Vector2D } from "../../src/CoreCross/index.js";
import { Collide2D, Draw, GameObject, Screen } from "../../src/Core2D/index.js";
import { Player } from "./Player.js";

class Coin extends GameObject {
    constructor(screen, data) {
        super();
        this.draw = new Draw(screen);
        this.radius = data.radius;
        this.position = new Vector2D(data.position[0], data.position[1]);
        this.size = new Vector2D(data.radius * 2, data.radius * 2);
        this.collected = false;
    }

    OnDrawn() {
        if (this.collected) return;
        this.draw.Color = "#FBCB43";
        this.draw.DrawCircle(this.position.x + this.radius, this.position.y + this.radius, this.radius);
    }
}

export class Hello2DLevel extends Level {
    OnStart() {
        super.OnStart();
        const data = AssetManager.instance.GetJson("hello_room");
        this.screen = new Screen("gameCanvas", 640, 480);
        this.draw = new Draw(this.screen);
        this.score = 0;
        this.player = new Player(this.screen, data.player);
        this.coins = data.coins.map(coin => new Coin(this.screen, coin));
        this.AddEntity(this.player);
        this.coins.forEach(coin => this.AddEntity(coin));
    }

    OnUpdate(dt) {
        super.OnUpdate(dt);
        this.coins.forEach(coin => {
            if (!coin.collected && Collide2D.isCollidingAABB(this.player, coin)) {
                coin.collected = true;
                this.score++;
            }
        });
    }

    OnGUI() {
        this.draw.Color = "#FFFFFF";
        this.draw.FontSize = "18px";
        this.draw.DrawText(`Coins: ${this.score}/${this.coins.length}`, 18, 30);
    }
}
```

All game UI above is drawn on the GameForgeJS canvas. For more complex
windows use `UIWindow`, `Label`, `TextBox` and `Button` from `Core2D`.

### 6. Bootstrap It

`examples/DemoHello2D/mainHello2D.js`:

```js
import { BootstrapGame } from "../../src/CoreCross/index.js";
import { Hello2DLevel } from "./Hello2DLevel.js";

BootstrapGame({
    configPath: ["gameforge.config.json", "examples/DemoHello2D/hello2d.config.json"],
    manifestPath: "examples/DemoHello2D/resources.json",
    levels: [new Hello2DLevel()],
});
```

Register it in `src/CoreCross/DemoLauncher.js`, then open
`Main.html?demo=hello2d`.

## Create A 3D Demo

New 3D projects must use `Level3D` and `Render3D`, not classes from
`src/Core3D/Legacy`.

### 1. Create The Files

```txt
examples/DemoHello3D/
  Assets/Manifests/first.scene.json
  hello3d.config.json
  resources.json
  mainHello3D.js
  Hello3DLevel.js
```

### 2. Create Or Export A Scene

Run `../GameForgeJsEditor` with `npm run dev`, then select `Scene Editor 3D`
in the desktop application.

Create platforms, change their transforms and materials, then select `Save As`
and write the document at:

```txt
examples/DemoHello3D/Assets/Manifests/first.scene.json
```

A minimal scene document looks like this:

```json
{
  "version": 1,
  "name": "Hello Scene",
  "backgroundColor": [0.03, 0.05, 0.08, 1],
  "camera": { "position": [7, 5, 9], "target": [0, 0, 0], "fov": 55 },
  "lights": [
    { "type": "ambient", "intensity": 0.08 },
    { "type": "directional", "direction": [-0.5, -1, -0.3], "intensity": 2, "castShadow": true }
  ],
  "objects": [
    {
      "id": "floor",
      "name": "Floor",
      "primitive": { "type": "plane", "width": 12, "depth": 12 },
      "transform": { "position": [0, -0.5, 0], "rotation": [0, 0, 0], "scale": [1, 1, 1] },
      "material": { "albedoColor": [0.25, 0.34, 0.32, 1], "roughness": 0.9 },
      "castShadow": false
    }
  ]
}
```

### 3. Load The Scene As An Asset

`examples/DemoHello3D/resources.json`:

```json
{
  "jsons": [
    { "name": "hello_scene", "path": "examples/DemoHello3D/Assets/Manifests/first.scene.json" }
  ]
}
```

`examples/DemoHello3D/hello3d.config.json`:

```json
{
  "project": { "name": "Hello 3D", "version": "1.0.0" },
  "window": { "title": "Hello 3D", "backgroundColor": "#080C13", "cursor": "default" },
  "screen": { "width": 960, "height": 540, "fullScreen": true }
}
```

### 4. Create A `Level3D`

`examples/DemoHello3D/Hello3DLevel.js`:

```js
import { AssetManager } from "../../src/CoreCross/index.js";
import { Level3D, SceneManifest3D } from "../../src/Core3D/index.js";

export class Hello3DLevel extends Level3D {
    constructor() {
        super({
            width: 960,
            height: 540,
            clearColor: [0.03, 0.05, 0.08, 1],
            usePhysics: false,
        });
        this.caption = "Hello 3D";
    }

    BuildScene() {
        const document = AssetManager.instance.GetJson("hello_scene");
        this.scene.backgroundColor = [...document.backgroundColor];
        this.camera = SceneManifest3D.CreateCamera(document.camera, this.width / this.height);
        this.scene.Add(this.camera);
        const content = SceneManifest3D.Populate(this.scene, document);
        this.rotatingObject = content.objects.find(object => object.name === "Player Marker");
    }

    OnUpdate(dt) {
        if (this.rotatingObject) this.rotatingObject.transform.rotation.y += dt;
    }
}
```

### 5. Bootstrap It

`examples/DemoHello3D/mainHello3D.js`:

```js
import { BootstrapGame } from "../../src/CoreCross/index.js";
import { Hello3DLevel } from "./Hello3DLevel.js";

BootstrapGame({
    configPath: ["gameforge.config.json", "examples/DemoHello3D/hello3d.config.json"],
    manifestPath: "examples/DemoHello3D/resources.json",
    levels: [new Hello3DLevel()],
});
```

### 6. Add Dynamic Positions With `Vector3D`

JSON represents coordinates as arrays. Once game logic reads them, use the
framework vector type and convert only at the renderer/physics boundary:

```js
import { Vector3D } from "../../src/CoreCross/index.js";

const spawn = Vector3D.FromArray(document.player.spawn);
const raised = spawn.AddValue(new Vector3D(0, 1, 0));
mesh.transform.SetPosition(...raised.ToArray());
```

## Legacy 3D Migration

Old projects may still import:

```js
import { Camera3D, LegacyLevel3D, Mesh3D, Shapes3D, Skybox3D } from "../../src/Core3D/index.js";
```

Those exports remain temporarily so existing games continue to load. They
are deprecated and issue one console warning when instantiated. JavaScript
browser projects do not use a C#-style decorator here: JSDoc `@deprecated`
marks the API for editors and a small runtime warning works without a
transpiler.

For new code, use:

```js
import {
    Level3D,
    Mesh,
    ModelMeshFactory,
    PerspectiveCamera,
    PrimitiveMesh,
    Skybox,
    StandardMaterial,
} from "../../src/Core3D/index.js";
```

The current examples to study are:

- `examples/Demo3D` for a small renderer showcase.
- `examples/DemoSolarSystem` for custom materials and many animated bodies.
- `examples/DemoMiniGame3D` for manifests, physics, gamepad, skybox and PBR surfaces.
