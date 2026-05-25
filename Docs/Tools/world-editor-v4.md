# WorldEditor / WorldMaker

O WorldEditor nao faz mais parte do runtime da GameForgeJS. Ele agora vive como ferramenta desktop separada em:

```txt
C:\Projects\GameForgeJsEditor
```

Isso mantem a proposta da GameForgeJS: o framework/runtime continua em JavaScript puro e sem dependencias externas. Ferramentas de autoria podem usar Tauri/Rust, .NET, C++ ou outra tecnologia.

## Como Rodar

```sh
cd C:\Projects\GameForgeJsEditor
npm run dev
```

No app desktop, clique em `Escolher pasta` e selecione qualquer pasta. O editor tenta detectar:

- `resources.json`
- manifests JSON soltos
- imagens `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`
- catálogos/atlases existentes
- layers como `objects`, `platforms`, `enemies`, `units`, `parallax.layers`, `tilemap`

`gameforge.editor.json` e opcional. Se nao existir, o editor infere uma estrutura. Se a pasta estiver vazia ou nao tiver configuracao reconhecida, ele cria um projeto editavel em memoria e salva `stage.json`, `enemies.json` e `player.json` quando o usuario clicar em salvar.

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

## Separacao

O arquivo `WorldEditor_v4.html` na raiz da GameForgeJS virou apenas uma pagina informativa. O editor oficial deve ser mantido no projeto separado `GameForgeJsEditor`.
