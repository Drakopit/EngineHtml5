# WorldEditor / WorldMaker

O WorldEditor e o Scene Editor 3D nao fazem mais parte do runtime da GameForgeJS. Eles vivem no aplicativo desktop separado:

```txt
../GameForgeJsEditor
```

Isso mantem a proposta da GameForgeJS: o framework/runtime continua em JavaScript puro e sem dependencias externas. Ferramentas de autoria podem usar Tauri/Rust, .NET, C++ ou outra tecnologia.

## Como Rodar

```sh
cd ../GameForgeJsEditor
npm run dev
```

No app desktop, clique em `Abrir projeto` e selecione qualquer pasta existente, ou use `Novo projeto` para inicializar uma pasta. O contrato primario de autoria e `game.workspace.json`; projetos legados sao inferidos a partir de `resources.json` apenas para gerar esse arquivo no primeiro salvamento.

- `resources.json`
- manifests JSON soltos
- imagens `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`
- catálogos/atlases existentes
- layers como `objects`, `platforms`, `enemies`, `units`, `parallax.layers`, `tilemap`

`game.workspace.json` nao e usado pelo runtime GameForgeJS. Ele informa ao editor quais JSONs compoem cada level; o runtime continua carregando `resources.json`. `Novo projeto` cria o contrato padrao:

```txt
game.workspace.json
resources.json
Assets/Manifests/editor/level_1/stage.json
Assets/Manifests/editor/level_1/player.json
Assets/Manifests/editor/level_1/enemies.json
```

O botao `+ Level` cria outro conjunto em `Assets/Manifests/editor/<level>/` e registra todos os manifests no `resources.json`.

```json
{
  "schemaVersion": 1,
  "kind": "GameForgeJS.Workspace",
  "resources": "resources.json",
  "resourcePrefix": "Demos/MyGame/",
  "levels2D": [
    {
      "id": "level_1",
      "documents": {
        "stage": "Assets/Manifests/editor/level_1/stage.json",
        "player": "Assets/Manifests/editor/level_1/player.json",
        "enemies": "Assets/Manifests/editor/level_1/enemies.json"
      }
    }
  ],
  "scenes3D": []
}
```

Os projetos 2D declarados podem ser validados contra os arquivos de imagem
registrados:

```sh
npm run check:editor-assets
```

O comando verifica arquivos ausentes, recortes de tiles/sprites/animacoes fora
dos limites da imagem e divergencias em que o runtime desenharia uma imagem
inteira enquanto o catalogo do editor a recortaria.

## Contrato De Atores 2D

Um `player.json` editavel guarda a aparencia no proprio `player`; somente a
posicao inicial vive em `spawn`:

```json
{
  "player": {
    "asset": "hero_idle",
    "frame": { "x": 0, "y": 0, "width": 96, "height": 84, "frames": 7 },
    "runAsset": "hero_run",
    "runFrame": { "x": 0, "y": 0, "width": 96, "height": 84, "frames": 8 },
    "scale": 1,
    "bodySize": { "width": 32, "height": 48 },
    "spawn": { "x": 100, "y": 300 }
  }
}
```

Em `enemies.json`, as propriedades visuais compartilhadas ficam em
`enemyDefaults`, com posicoes e overrides planos nas instancias:

```json
{
  "enemyDefaults": {
    "asset": "enemy_idle",
    "frame": { "x": 0, "y": 0, "width": 148, "height": 96, "frames": 6 },
    "scale": 1,
    "bodySize": { "width": 64, "height": 64 }
  },
  "enemies": [
    { "id": "enemy_01", "x": 420, "y": 300 }
  ]
}
```

`asset` deve apontar para um nome em `resources.json.images`. `frame` e o
primeiro recorte da spritesheet e `frames` informa quantos quadros horizontais
podem ser animados. O editor aceita projetos antigos que guardem overrides em
`config`, mas novos overrides sao gravados diretamente na instancia. Os demos
`DemoAdvanced` e `DemoTacticalRPG` usam este formato.

## Recursos

- Abrir qualquer pasta do disco.
- Importar imagem para `Assets/Imported`.
- Gerar atlas como `Tileset`, `AutoTile` ou `Sprites`.
- Aplicar atlas como `TileMap`.
- Pintar tiles no canvas.
- Adicionar objetos a partir de catalogo/spritesheet.
- Marcar sprite selecionado como Player.
- Criar inimigo usando o sprite selecionado.
- Editar JSON ativo manualmente.
- Salvar os JSONs editados de volta na pasta escolhida.
- Alternar para o Scene Editor 3D, que abre projetos e salva manifests `.scene.json` registrados em `resources.json`.

## Separacao

O arquivo `WorldEditor_v4.html` na raiz da GameForgeJS virou apenas uma pagina informativa. O editor oficial deve ser mantido no projeto separado `GameForgeJsEditor`.
