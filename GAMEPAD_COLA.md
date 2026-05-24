# Cola De Gamepad

GameForgeJS aceita aliases legiveis em configs de gamepad. Tokens crus como `button_0` e `axis_0_positive` continuam funcionando, mas a recomendacao e usar aliases com `input.gamepadProfile`.

## Perfis

| Perfil | Botao sul | Botao direito | Botao esquerdo | Botao norte |
| --- | --- | --- | --- | --- |
| `xbox` | `A` | `B` | `X` | `Y` |
| `playstation` | `X` / `CROSS` | `CIRCLE` | `SQUARE` | `TRIANGLE` |
| `nintendo` | `B` | `A` | `Y` | `X` |

Exemplo Xbox:

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

## Aliases Explicitos

Use estes quando quiser remover ambiguidade entre marcas:

| Alias | Equivalente |
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

## Aliases Comuns

| Alias | Equivalente | Uso comum |
| --- | --- | --- |
| `LB` / `L1` | `button_4` | Ombro esquerdo |
| `RB` / `R1` | `button_5` | Ombro direito |
| `LT` / `L2` | `button_6` | Gatilho esquerdo |
| `RT` / `R2` | `button_7` | Gatilho direito |
| `BACK` / `SELECT` / `SHARE` | `button_8` | Voltar, menu secundario |
| `START` / `MENU` / `OPTIONS` | `button_9` | Start, pause, confirmar em menu |
| `L3` / `LEFT_STICK_BUTTON` | `button_10` | Clique do analogico esquerdo |
| `R3` / `RIGHT_STICK_BUTTON` | `button_11` | Clique do analogico direito |
| `DPAD_UP` | `button_12` | Cima |
| `DPAD_DOWN` | `button_13` | Baixo |
| `DPAD_LEFT` | `button_14` | Esquerda |
| `DPAD_RIGHT` | `button_15` | Direita |

## Eixos

| Alias | Equivalente |
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

## API Direta Da Engine

O `Input` faz polling do navegador a cada frame, inclusive para controles ligados antes do jogo iniciar. Alguns navegadores ocultam um controle ate o primeiro botao ser pressionado; isso ativa o controle sem desconectar cabos.

```js
Input.IsGamepadConnected(0);
Input.GetGamepadButton(0, "A");
Input.GetGamepadButtonDown(0, "A");
Input.GetGamepadButtonUp(0, "A");
Input.GetGamepadAxis(0, "LeftX");
Input.GetGamepadAxis(0, "LeftY");
```

## Extend Por Jogo

Crie nomes do proprio jogo em `input.gamepadAliases`:

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

Nesse exemplo, `LIGHT_ATTACK` resolve para `X`, e `X` resolve para `button_2` no perfil Xbox.

## Tokens Crus

Ainda e valido usar o padrao do navegador diretamente:

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
