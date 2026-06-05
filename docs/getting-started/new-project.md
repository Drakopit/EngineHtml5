# New GameForgeJS Project Format

This format keeps the engine free of external dependencies. A project declares its own entry point, configuration, asset manifests, and initial levels.

## Suggested Structure Inside the Repository

```txt
MyGame/
  mygame.config.json
  resources.json
  mainMyGame.js
  Assets/
    Player/
    Audio/
  Entities/
    Player.js
    Enemy.js
  Levels/
    FirstLevel.js
```

## Entry Point

```js
import { BootstrapGame } from "../src/CoreCross/index.js";
import { FirstLevel } from "./Levels/FirstLevel.js";

BootstrapGame({
    configPath: ["gameforge.config.json", "MyGame/mygame.config.json"],
    manifestPath: "MyGame/resources.json",
    levels: [
        new FirstLevel(),
    ],
});
```

`gameforge.config.json` lives at the root and contains engine-level defaults. `MyGame/mygame.config.json` belongs to the game and should contain the title, screen, input, and any game-specific configuration.

## Responsive Screen

Each game can make its canvas fill the full available area of the page:

```json
{
  "screen": {
    "width": 640,
    "height": 480,
    "fullScreen": true
  }
}
```

With `screen.fullScreen: true`, the canvas still uses its logical resolution (`width` and `height`) for entities, collision, and UI, but is displayed responsively across the full window. This works for 2D screens, 3D screens, and engine overlays, without requesting the browser's native fullscreen.

## resources.json

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

## Input Config

```json
{
  "input": {
    "gamepadProfile": "xbox",
    "actionMappings": {
      "ATTACK": [
        { "device": "keyboard", "input": "KeyZ" },
        { "device": "gamepad", "input": "X" }
      ],
      "LEFT": [
        { "device": "keyboard", "input": "ArrowLeft" },
        { "device": "gamepad", "input": "LEFT_STICK_LEFT" },
        { "device": "gamepad", "input": "DPAD_LEFT" }
      ]
    }
  }
}
```

## Admin Mode

During development, `Main.html` without a query string opens Admin Mode:

```txt
http://localhost:8080/Main.html
```

To open a demo directly:

```txt
http://localhost:8080/Main.html?demo=advanced
http://localhost:8080/Main.html?demo=fighting2d
http://localhost:8080/Main.html?demo=online
```

## Optional Local Server

```sh
npm run start
```

This command uses only `tools/server.js` to serve local files and avoid CORS. The engine itself remains independent of Node.js.
