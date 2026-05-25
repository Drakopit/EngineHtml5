# CoreNetwork

`CoreNetwork` fornece recursos online reutilizaveis sem definir o jogo e sem transformar o servidor local em backend.

## Responsabilidades

- `GameNetwork`: API simples de sala, peers e mensagens.
- `LocalNetworkAdapter`: conecta abas/janelas da mesma origem usando `BroadcastChannel`, ideal para a demo e prototipos.
- `WebSocketClientAdapter`: conecta a um relay WebSocket externo e opcional.
- `OnlinePlayerManager`: registra peers e suaviza estado remoto.
- `OnlineEntitySync`: envia estado de uma entidade em taxa controlada quando ele muda.
- `ChatManager`: envia mensagens e gera avisos de entrada/saida.

`Tools/server.js` serve arquivos e libera CORS apenas. Ele nao gerencia peers, chat, salas ou estado de jogo.

O chat visual da demo usa `Core2D/UI/ChatWindow.js`, composto com o `TextBox` da engine e desenhado no canvas. Nenhum painel HTML externo e criado.

## Demo Online

Inicie o servidor de arquivos e abra duas abas:

```txt
http://localhost:8080/Main.html?demo=online&room=terra&name=Ana
http://localhost:8080/Main.html?demo=online&room=terra&name=Beto
```

A sala padrao usa `LocalNetworkAdapter`, portanto funciona sem backend MMO. No chat canvas, `/name NovoNome` altera o nome do jogador.

O mapa, blocos, aparencia e regras ficam em `Demos/DemoOnlineMMO`, incluindo `data/OnlineWorldData.js`. Eventos de bloco sao mensagens que a propria demo escolhe interpretar.

## API Simples

```js
import {
    ChatManager,
    GameNetwork,
    LocalNetworkAdapter,
    OnlinePlayerManager,
} from "../CoreNetwork/index.js";

const network = new GameNetwork({
    adapter: new LocalNetworkAdapter({ roomId: "main" }),
    roomId: "main",
    peer: { name: "Player" },
});
const players = new OnlinePlayerManager(network);
const chat = new ChatManager(network);

network.onConnected(() => console.log("Connected"));
chat.onMessageReceived(message => console.log(message.playerName, message.text));

network.connect();
network.sendPlayerState({ x: player.x, y: player.y });
chat.sendMessage("Hello!");
```

## Relay Externo

Para jogar entre computadores, forneca um relay externo e substitua somente o adaptador:

```js
import { GameNetwork, WebSocketClientAdapter } from "../CoreNetwork/index.js";

const network = new GameNetwork({
    adapter: new WebSocketClientAdapter({
        url: "wss://example.com/relay",
        roomId: "main",
    }),
    roomId: "main",
    peer: { name: "Player" },
});
```

Na demo, tambem e possivel usar:

```txt
http://localhost:8080/Main.html?demo=online&server=wss%3A%2F%2Fexample.com%2Frelay
```

Esse relay nao faz parte de `Tools/server.js`: ele apenas deve encaminhar envelopes entre clientes da mesma sala. Regras, mapa, colisao e UI continuam pertencendo ao jogo.
