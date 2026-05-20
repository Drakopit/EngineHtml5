# Hitbox Manifest 2D

Hitboxes, hurtboxes e collisionboxes podem ser declaradas como JSON e carregadas pelo `resources.json`.

```json
{
  "version": 1,
  "origin": "entity-top-left",
  "collisionboxes": {
    "*": [{ "name": "body", "x": 0, "y": 0, "w": 44, "h": 63 }]
  },
  "hurtboxes": {
    "*": [{ "name": "torso", "x": 5, "y": 6, "w": 34, "h": 52 }]
  },
  "hitboxes": {
    "Attack_1": [
      {
        "name": "slash",
        "frames": [2, 3],
        "x": 32,
        "y": 18,
        "w": 52,
        "h": 28,
        "damage": 10,
        "hitStop": 0.06,
        "hitStun": 0.14,
        "stagger": false,
        "knockback": { "x": 430, "y": -350 },
        "oncePerTarget": true
      }
    ]
  }
}
```

As coordenadas sao locais ao `position` da entidade. Quando `owner.facingRight` for `false`, as caixas sao espelhadas automaticamente usando `owner.size.x`. Use `"mirror": false` em uma caixa especifica para desativar isso.

Carregamento:

```json
{
  "jsons": [
    { "name": "player_boxes", "path": "Demos/DemoAdvanced/Assets/Manifests/player.boxes.json" }
  ]
}
```

Uso:

```js
this.boxes = new BoxController2D(this, AssetManager.instance.GetJson("player_boxes"));
this.boxes.DrawDebug(this.draw);
```

`damage`, `knockback`, `hitStop`, `hitStun` e `stagger` sao copiados para o evento de impacto gerado pelo `CombatResolver2D`. A demo Advanced usa esse evento para aplicar dano, gerar texto flutuante e chamar `Engine.HitStop()`. Use `stagger: false` em golpes iniciais de combo quando o inimigo deve parar por um instante sem ser empurrado, e deixe `stagger: true` no finalizador.

Combos ficam fora do manifest de caixas. Use `ComboController` para definir a sequencia de animacoes e o frame minimo em que cada ataque pode encadear o proximo:

```js
this.combo = new ComboController(this, [
  { animation: "Attack_1", chainFromFrame: 3 },
  { animation: "Attack_2", chainFromFrame: 2 },
  { animation: "Attack_3", chainFromFrame: 3 }
]);
```
