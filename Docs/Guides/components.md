# Componentizacao

`GameObject` continua aceitando heranca classica, mas agora tambem pode ser montado por componentes pequenos. A ideia e deixar entidades mais modulares sem quebrar as demos atuais.

## Componentes Disponiveis

| Componente | Uso |
| --- | --- |
| `TransformComponent` | Posicao, rotacao e escala, sincronizando com `owner.position`. |
| `VelocityComponent` | Movimento por velocidade, gravidade, friccao e limite de velocidade. |
| `BoundsComponent` | Caixa AABB reutilizavel para colisao, selecao e hit test. |
| `HealthComponent` | HP, dano, cura, invulnerabilidade curta e callbacks `OnDamage`/`OnDeath`. |
| `LifetimeComponent` | Objetos temporarios, como efeitos, textos flutuantes e projeteis. |
| `ActionInputComponent` | Leitura de acoes do `ActionManager` dentro de uma entidade. |

## Exemplo

```js
import { GameObject } from "../Core2D/index.js";
import {
    ActionInputComponent,
    BoundsComponent,
    HealthComponent,
    TransformComponent,
    VelocityComponent,
} from "../CoreCross/index.js";

const player = new GameObject();

player.AddComponent(new TransformComponent({ x: 120, y: 220 }));
player.AddComponent(new BoundsComponent({ width: 32, height: 48 }));
player.AddComponent(new VelocityComponent({ gravity: 900, maxSpeedX: 180, maxSpeedY: 520 }));
player.AddComponent(new HealthComponent({ hp: 100, invulnerability: 0.45 }));
player.AddComponent(new ActionInputComponent({
    actions: {
        jump: "JUMP",
        attack: "ATTACK",
        left: "LEFT",
        right: "RIGHT",
    },
}));

player.OnUpdate = function OnUpdate(dt) {
    const input = this.GetComponent(ActionInputComponent);
    const velocity = this.GetComponent(VelocityComponent);

    if (input.IsHeld("left")) velocity.vx = -160;
    else if (input.IsHeld("right")) velocity.vx = 160;

    if (input.IsDown("jump")) velocity.vy = -420;
};
```

## Direcao

Este modelo ainda nao e um ECS puro. Ele e um meio-termo proposital:

- `GameObject` continua simples.
- Componentes carregam comportamento reutilizavel.
- As demos podem migrar aos poucos.
- O WorldEditor pode futuramente serializar entidades como uma lista de componentes.

Um prefab data-driven poderia ficar assim:

```json
{
  "name": "Slime",
  "components": [
    { "type": "TransformComponent", "x": 320, "y": 180 },
    { "type": "BoundsComponent", "width": 28, "height": 22 },
    { "type": "HealthComponent", "hp": 30 },
    { "type": "VelocityComponent", "gravity": 900 }
  ]
}
```

## Exemplo Jogavel

A demo `Demos/DemoAdventure2D` usa esse modelo de forma mais completa:

- `AdventurePlayer` combina `TransformComponent`, `BoundsComponent`, `HealthComponent`, `ActionInputComponent`, movimento top-down, ataque melee e renderer.
- `Slime` combina `TransformComponent`, `BoundsComponent`, `HealthComponent`, `WanderComponent` e renderer.
- `CameraRig` usa `RoomCameraComponent` para fazer transicao suave entre salas.

Abra com:

```txt
http://localhost:8080/Main.html?demo=adventure2d
```
