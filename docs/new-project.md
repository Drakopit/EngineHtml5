# Novo Formato De Projeto GameForgeJS

Este formato mantem a engine sem dependencias externas. O projeto declara sua entrada, sua configuracao, seus manifests de assets e seus levels iniciais.

## Estrutura Sugerida Dentro Do Repositorio

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

## Entrada

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

`gameforge.config.json` fica na raiz e contem defaults da engine. `MyGame/mygame.config.json` pertence ao jogo e deve conter titulo, tela, comandos e qualquer configuracao especifica.

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

## Config De Input

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

Durante o desenvolvimento, `Main.html` sem query string abre o Admin Mode:

```txt
http://localhost:8080/Main.html
```

Para abrir direto:

```txt
http://localhost:8080/Main.html?demo=advanced
http://localhost:8080/Main.html?demo=fighting2d
http://localhost:8080/Main.html?demo=online
```

## Servidor Local Opcional

```sh
npm run start
```

O comando usa apenas `server.js` para servir arquivos locais e evitar CORS. A engine em si continua independente de Node.js.
