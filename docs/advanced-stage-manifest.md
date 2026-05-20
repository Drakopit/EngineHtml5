# Advanced Stage Manifest

`Demos/DemoAdvanced/Assets/Manifests/advanced.level.json` e um indice de composicao. Ele junta manifests menores sem acoplar layout ao codigo do level.

## Organizacao

O manifest da fase fica dividido por dominio:

- `advanced/stage-default.json`: tela, colisao, background, audio base e defaults comuns.
- `advanced/core.json`: mundo, vitoria e overrides especificos da fase.
- `advanced/stage.json`: parallax, materiais, plataformas e objetos.
- `advanced/player.json`: spawn, movimento, stats, combate e combo.
- `advanced/enemies.json`: defaults e spawns dos inimigos.
- `advanced/effects.json`: textos flutuantes e efeitos visuais.
- `advanced/ui.json`: HUD e janela de status.

As fases novas seguem o mesmo padrao:

- `advanced.second.level.json`: indice da segunda fase.
- `advanced.boss.level.json`: indice da fase de boss.
- `advanced/second-*.json`: mundo, cenario e inimigos da segunda fase.
- `advanced/boss-*.json`: arena, condicao de vitoria e inimigos do boss.

O indice usa `compose`:

```json
{
  "id": "advanced_snow_demo",
  "compose": [
    "advanced_stage_default",
    "advanced_core",
    "advanced_stage",
    "advanced_player",
    "advanced_enemies",
    "advanced_effects",
    "advanced_ui"
  ]
}
```

O fluxo da campanha e `AdvancedDemoMenu -> AdvancedDemoPhaseSelector -> fase escolhida`. A progressao fica em `localStorage`; apenas `first` nasce liberada, `first` libera `second`, e `second` libera `boss`.

As telas finais tambem sao levels:

- `AdvancedDemoGameOver`: destino de derrota ou queda fora da fase; volta ao menu ao confirmar.
- `AdvancedDemoCongratulations`: destino ao concluir o boss; mostra creditos e volta ao menu ao confirmar.

## Progressao do Player

O player tambem carrega sistemas opcionais pelo manifest:

- `player.inventory`: slots iniciais, itens, efeitos e recompensas por inimigo derrotado.
- `player.skillTree`: pontos iniciais, nos, custo, requisitos e efeitos aplicados ao player.
- `ui.progressHud`: posicao do resumo e do painel de inventario/skills.

Os inputs ficam no `Demos/DemoAdvanced/advanced.config.json`: `INVENTORY` abre a bag e `SKILL_TREE` abre a arvore. Enquanto um painel esta aberto, a fase pausa as entidades de gameplay.

## Camera Shake

`advanced/effects.json` define `cameraShake.light`, `cameraShake.strong` e `cameraShake.playerDamage`. A implementacao fica em `Core2D/Camera/Camera.js`, entao outros levels 2D podem usar `camera.Shake(duration, intensity, frequency)`.

## Snow Pack

Os assets do Snow Pack sao registrados em `Demos/DemoAdvanced/resources.json` com nomes como:

- `snow_sky`
- `snow_mountain_01`
- `snow_mountain_02`
- `snow_tileset`
- `snow_vegetation`
- `snow_objects`
- `snow_standards`

O catalogo `Demos/DemoAdvanced/Assets/Manifests/snow.pack.json` tambem e um indice. Ele compoe:

- `snow/backgrounds.json`
- `snow/terrain.json`
- `snow/vegetation.json`
- `snow/objects.json`
- `snow/standards.json`

Esses arquivos dao nomes para recortes de atlas. Exemplos:

- `terrain: "snow_ground"` em plataformas com bordas e preenchimento.
- `spriteRef: "pine_large"` em objetos estaticos.
- `animationRef: "blue_flag"` em objetos animados.

## Parallax

Camadas de parallax ficam em `parallax.layers`.

```json
{
  "id": "mountain_near",
  "sprite": "snow_mountain_01",
  "x": 0,
  "y": 165,
  "width": 638,
  "height": 176,
  "scrollRatioX": 0.18,
  "scrollRatioY": 0.04,
  "repeatX": true
}
```

Quanto menor o `scrollRatioX`, mais distante a camada parece estar.

## Plataformas

Plataformas podem usar terrain sets nomeados do catalogo:

```json
{
  "id": "ground_left",
  "x": 0,
  "y": 500,
  "width": 600,
  "height": 100,
  "solid": true,
  "visible": true,
  "material": "ground",
  "terrain": "snow_ground"
}
```

Um `terrain` escolhe automaticamente topo esquerdo, topo meio, topo direito, preenchimento e laterais. Para casos simples, ainda e possivel usar `tile: "nome_do_tile"` com `renderMode: "tile"`.

Tambem e possivel usar `sprite`, `pos_x`, `pos_y`, `tileWidth` e `tileHeight` diretamente quando o recorte ainda nao estiver no catalogo.

## Objetos

Objetos decorativos ou interativos ficam em `objects`.

```json
{
  "id": "blue_flag_01",
  "animationRef": "blue_flag",
  "x": 1835,
  "y": 436,
  "width": 44,
  "height": 64,
  "visible": true,
  "solid": false,
  "zIndex": 35
}
```

Se `solid` for `true`, o objeto tambem entra na lista de colisao da fase.
