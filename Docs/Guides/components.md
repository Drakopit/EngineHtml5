# Componentization

`GameObject` still supports classic inheritance, but can now also be assembled from small components. The goal is to make entities more modular without breaking existing demos.

## Available Components

| Component | Usage |
| --- | --- |
| `TransformComponent` | Position, rotation, and scale, synchronized with `owner.position`. |
| `VelocityComponent` | Movement via velocity, gravity, friction, and speed limits. |
| `BoundsComponent` | Reusable AABB box for collision, selection, and hit testing. |
| `HealthComponent` | HP, damage, healing, brief invulnerability, and `OnDamage`/`OnDeath` callbacks. |
| `LifetimeComponent` | Temporary objects such as effects, floating texts, and projectiles. |
| `ActionInputComponent` | Reads actions from `ActionManager` within an entity. |

## Example

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

## Direction

This model is not a pure ECS. It is an intentional middle ground:

- `GameObject` stays simple.
- Components carry reusable behavior.
- Demos can migrate gradually.
- WorldEditor may eventually serialize entities as a list of components.

A data-driven prefab could look like this:

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

## Playable Example

The `Demos/DemoAdventure2D` demo uses this model more fully:

- `AdventurePlayer` combines `TransformComponent`, `BoundsComponent`, `HealthComponent`, `ActionInputComponent`, top-down movement, melee attack, and a renderer.
- `Slime` combines `TransformComponent`, `BoundsComponent`, `HealthComponent`, `WanderComponent`, and a renderer.
- `CameraRig` uses `RoomCameraComponent` to handle smooth transitions between rooms.

Open with:

```txt
http://localhost:8080/Main.html?demo=adventure2d
```
