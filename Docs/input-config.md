# Configuracao De Input Por Jogo

Os comandos nao devem morar no `gameforge.config.json`. Esse arquivo e global da engine. Cada demo/jogo deve declarar seus proprios comandos no config local.

## ActionManager

Demos que usam `ActionManager` declaram `input.actionMappings`. O gamepad aceita tanto tokens crus (`button_0`, `axis_0_positive`) quanto aliases legiveis:

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

O `BootstrapGame` pode carregar uma lista de configs. Os ultimos arquivos sobrescrevem ou complementam os anteriores:

```js
BootstrapGame({
    configPath: ["gameforge.config.json", "MyGame/mygame.config.json"],
    levels: [
        new FirstLevel(),
    ],
});
```

## Perfis

`input.gamepadProfile` muda o significado dos nomes curtos `A`, `B`, `X` e `Y`:

| Perfil | Botao sul | Botao direito | Botao esquerdo | Botao norte |
| --- | --- | --- | --- | --- |
| `xbox` | `A` | `B` | `X` | `Y` |
| `playstation` | `X` / `CROSS` | `CIRCLE` | `SQUARE` | `TRIANGLE` |
| `nintendo` | `B` | `A` | `Y` | `X` |

Quando quiser remover qualquer ambiguidade, use aliases explicitos:

```json
{ "device": "gamepad", "input": "XBOX_A" }
{ "device": "gamepad", "input": "PS_CROSS" }
{ "device": "gamepad", "input": "NINTENDO_B" }
```

## Aliases Comuns

```txt
A / B / X / Y       dependem do gamepadProfile
LB / RB / LT / RT   ombros e gatilhos Xbox-style
L1 / R1 / L2 / R2   ombros e gatilhos PlayStation-style
BACK / START        botoes de menu
DPAD_UP             direcional para cima
DPAD_DOWN           direcional para baixo
DPAD_LEFT           direcional para esquerda
DPAD_RIGHT          direcional para direita
LEFT_STICK_UP       analogico esquerdo para cima
LEFT_STICK_DOWN     analogico esquerdo para baixo
LEFT_STICK_LEFT     analogico esquerdo para esquerda
LEFT_STICK_RIGHT    analogico esquerdo para direita
```

A cola completa fica em [`../GAMEPAD_COLA.md`](../GAMEPAD_COLA.md).

## Extend Por Jogo

Cada jogo pode criar aliases sem mexer na engine:

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

Aliases podem apontar para outros aliases. Por exemplo, `LIGHT_ATTACK -> X -> button_2` no perfil Xbox.

## Demo De Luta

A demo de luta usa uma configuracao propria em `fighting.controls`, porque possui dois jogadores, menu, arcade e versus. Ela tambem resolve aliases de gamepad:

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

Assim o controle de cada jogo fica no proprio jogo, sem vazar para outras demos.
