# Gamepad Cheat Sheet

GameForgeJS accepts human-readable aliases in gamepad configs. Raw tokens like `button_0` and `axis_0_positive` still work, but the recommended approach is to use aliases with `input.gamepadProfile`.

## Profiles

| Profile | South button | Right button | Left button | North button |
| --- | --- | --- | --- | --- |
| `xbox` | `A` | `B` | `X` | `Y` |
| `playstation` | `X` / `CROSS` | `CIRCLE` | `SQUARE` | `TRIANGLE` |
| `nintendo` | `B` | `A` | `Y` | `X` |

Xbox example:

```json
{
  "input": {
    "gamepadProfile": "xbox",
    "actionMappings": {
      "JUMP": [
        { "device": "gamepad", "input": "A" }
      ],
      "ATTACK": [
        { "device": "gamepad", "input": "X" }
      ],
      "RIGHT": [
        { "device": "gamepad", "input": "LEFT_STICK_RIGHT" },
        { "device": "gamepad", "input": "DPAD_RIGHT" }
      ]
    }
  }
}
```

## Explicit Aliases

Use these when you want to remove ambiguity between controller brands:

| Alias | Equivalent |
| --- | --- |
| `XBOX_A` | `button_0` |
| `XBOX_B` | `button_1` |
| `XBOX_X` | `button_2` |
| `XBOX_Y` | `button_3` |
| `PS_CROSS` / `PS_X` | `button_0` |
| `PS_CIRCLE` | `button_1` |
| `PS_SQUARE` | `button_2` |
| `PS_TRIANGLE` | `button_3` |
| `NINTENDO_B` | `button_0` |
| `NINTENDO_A` | `button_1` |
| `NINTENDO_Y` | `button_2` |
| `NINTENDO_X` | `button_3` |

## Common Aliases

| Alias | Equivalent | Common use |
| --- | --- | --- |
| `LB` / `L1` | `button_4` | Left shoulder |
| `RB` / `R1` | `button_5` | Right shoulder |
| `LT` / `L2` | `button_6` | Left trigger |
| `RT` / `R2` | `button_7` | Right trigger |
| `BACK` / `SELECT` / `SHARE` | `button_8` | Back, secondary menu |
| `START` / `MENU` / `OPTIONS` | `button_9` | Start, pause, confirm in menu |
| `L3` / `LEFT_STICK_BUTTON` | `button_10` | Left analog stick click |
| `R3` / `RIGHT_STICK_BUTTON` | `button_11` | Right analog stick click |
| `DPAD_UP` | `button_12` | Up |
| `DPAD_DOWN` | `button_13` | Down |
| `DPAD_LEFT` | `button_14` | Left |
| `DPAD_RIGHT` | `button_15` | Right |

## Axes

| Alias | Equivalent |
| --- | --- |
| `LEFT_STICK_LEFT` | `axis_0_negative` |
| `LEFT_STICK_RIGHT` | `axis_0_positive` |
| `LEFT_STICK_UP` | `axis_1_negative` |
| `LEFT_STICK_DOWN` | `axis_1_positive` |
| `RIGHT_STICK_LEFT` | `axis_2_negative` |
| `RIGHT_STICK_RIGHT` | `axis_2_positive` |
| `RIGHT_STICK_UP` | `axis_3_negative` |
| `RIGHT_STICK_DOWN` | `axis_3_positive` |
| `LeftX` / `LEFT_X` | `axis_0` |
| `LeftY` / `LEFT_Y` | `axis_1` |
| `RightX` / `RIGHT_X` | `axis_2` |
| `RightY` / `RIGHT_Y` | `axis_3` |

## Direct Engine API

`Input` polls the browser every frame, including controllers connected before the game starts. Some browsers hide a controller until the first button is pressed; pressing any button activates the controller without disconnecting any cables.

```js
Input.IsGamepadConnected(0);
Input.GetGamepadButton(0, "A");
Input.GetGamepadButtonDown(0, "A");
Input.GetGamepadButtonUp(0, "A");
Input.GetGamepadAxis(0, "LeftX");
Input.GetGamepadAxis(0, "LeftY");
```

## Per-Game Extension

Define your own game-specific names in `input.gamepadAliases`:

```json
{
  "input": {
    "gamepadProfile": "xbox",
    "gamepadAliases": {
      "LIGHT_ATTACK": "X",
      "HEAVY_ATTACK": "Y",
      "SPECIAL": "RB"
    },
    "actionMappings": {
      "ATTACK": [
        { "device": "gamepad", "input": "LIGHT_ATTACK" }
      ]
    }
  }
}
```

In this example, `LIGHT_ATTACK` resolves to `X`, and `X` resolves to `button_2` under the Xbox profile.

## Raw Tokens

Using the browser's native format directly is still valid:

| Token | Xbox | PlayStation | Nintendo |
| --- | --- | --- | --- |
| `button_0` | A | X / Cross | B |
| `button_1` | B | Circle | A |
| `button_2` | X | Square | Y |
| `button_3` | Y | Triangle | X |
| `button_4` | LB | L1 | L |
| `button_5` | RB | R1 | R |
| `button_6` | LT | L2 | ZL |
| `button_7` | RT | R2 | ZR |
| `button_8` | View / Back | Share / Create | Minus |
| `button_9` | Menu / Start | Options | Plus |
| `button_12` | D-pad Up | D-pad Up | D-pad Up |
| `button_13` | D-pad Down | D-pad Down | D-pad Down |
| `button_14` | D-pad Left | D-pad Left | D-pad Left |
| `button_15` | D-pad Right | D-pad Right | D-pad Right |
