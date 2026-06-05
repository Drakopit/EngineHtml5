# Per-Game Input Configuration

Input bindings should not live in `gameforge.config.json`. That file is global to the engine. Each demo/game must declare its own bindings in its local config.

## ActionManager

Demos that use `ActionManager` declare `input.actionMappings`. The gamepad accepts both raw tokens (`button_0`, `axis_0_positive`) and human-readable aliases:

```json
{
  "input": {
    "gamepadProfile": "xbox",
    "actionMappings": {
      "ATTACK": [
        { "device": "keyboard", "input": "KeyZ" },
        { "device": "gamepad", "input": "X" }
      ],
      "JUMP": [
        { "device": "keyboard", "input": "Space" },
        { "device": "gamepad", "input": "A" }
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

`BootstrapGame` can load a list of configs. Later files override or extend the earlier ones:

```js
BootstrapGame({
    configPath: ["gameforge.config.json", "MyGame/mygame.config.json"],
    levels: [
        new FirstLevel(),
    ],
});
```

## Input and Gamepad Polling

`Input` calls `navigator.getGamepads()` on every engine `PreUpdate`. This means a controller connected before the game starts is detected without needing to be reconnected, and disconnections are removed from the current state. In browsers that only expose a controller after user interaction, pressing any button once is enough.

```js
if (Input.IsGamepadConnected(0)) {
    const jump = Input.GetGamepadButtonDown(0, "A");
    const horizontal = Input.GetGamepadAxis(0, "LeftX");
}
```

The keyboard continues to work via `Input.GetKey`, `Input.GetKeyDown`, and `Input.GetKeyUp`. For gameplay, prefer the action layer; `GetActionValue` preserves the intensity of an analog axis:

```js
const horizontal = ActionManager.GetActionValue("RIGHT") - ActionManager.GetActionValue("LEFT");
```

Mappings can also be declared in code when a game needs to configure them dynamically:

```js
ActionManager.MapAction("MOVE_LEFT", [
    Input.Keyboard("KeyA"),
    Input.GamepadButton("DPAD_LEFT"),
    Input.GamepadAxis("LeftX", -1),
]);
```

## Profiles

`input.gamepadProfile` changes the meaning of the short names `A`, `B`, `X`, and `Y`:

| Profile | South button | Right button | Left button | North button |
| --- | --- | --- | --- | --- |
| `xbox` | `A` | `B` | `X` | `Y` |
| `playstation` | `X` / `CROSS` | `CIRCLE` | `SQUARE` | `TRIANGLE` |
| `nintendo` | `B` | `A` | `Y` | `X` |

When you want to remove all ambiguity, use explicit aliases:

```json
{ "device": "gamepad", "input": "XBOX_A" }
{ "device": "gamepad", "input": "PS_CROSS" }
{ "device": "gamepad", "input": "NINTENDO_B" }
```

## Common Aliases

```txt
A / B / X / Y       depend on gamepadProfile
LB / RB / LT / RT   Xbox-style shoulders and triggers
L1 / R1 / L2 / R2   PlayStation-style shoulders and triggers
BACK / START        menu buttons
DPAD_UP             d-pad up
DPAD_DOWN           d-pad down
DPAD_LEFT           d-pad left
DPAD_RIGHT          d-pad right
LEFT_STICK_UP       left analog stick up
LEFT_STICK_DOWN     left analog stick down
LEFT_STICK_LEFT     left analog stick left
LEFT_STICK_RIGHT    left analog stick right
```

The full cheat sheet is at [Gamepad](./gamepad.md).

## Per-Game Extension

Each game can define its own aliases without touching the engine:

```json
{
  "input": {
    "gamepadProfile": "xbox",
    "gamepadAliases": {
      "LIGHT_ATTACK": "X",
      "HEAVY_ATTACK": "Y",
      "SPECIAL": "RB",
      "DODGE": "B"
    },
    "actionMappings": {
      "ATTACK": [
        { "device": "gamepad", "input": "LIGHT_ATTACK" }
      ],
      "SKILL": [
        { "device": "gamepad", "input": "SPECIAL" }
      ]
    }
  }
}
```

Aliases can point to other aliases. For example, `LIGHT_ATTACK -> X -> button_2` under the Xbox profile.

## Fighting Demo

The fighting demo uses its own configuration under `fighting.controls`, because it supports two players, a menu, arcade mode, and versus mode. It also resolves gamepad aliases:

```json
{
  "input": {
    "gamepadProfile": "xbox",
    "gamepadAliases": {
      "LIGHT_ATTACK": "X",
      "HEAVY_ATTACK": "Y",
      "SPECIAL": "RB"
    }
  },
  "fighting": {
    "controls": {
      "playerOne": {
        "left": ["KeyA"],
        "right": ["KeyD"],
        "light": ["KeyJ"],
        "gamepad": {
          "index": 0,
          "left": { "buttons": ["DPAD_LEFT"], "axes": ["LEFT_STICK_LEFT"] },
          "right": { "buttons": ["DPAD_RIGHT"], "axes": ["LEFT_STICK_RIGHT"] },
          "light": ["LIGHT_ATTACK"]
        }
      }
    }
  }
}
```

This keeps each game's controls contained within that game, with no leakage into other demos.
