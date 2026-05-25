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

## Teste entre Computadores

Para jogar em duas maquinas na mesma rede, sirva o cliente GameForgeJS normalmente:

```sh
npm run start
```

Em outro terminal, inicie um backend externo de teste. O projeto irmao `GameForgeJsTools` contem um exemplo Node isolado, com seu proprio `package.json`:

```sh
cd ../GameForgeJsTools/NodeWebSocketRelay
npm install
npm start
```

Descubra o IP local da maquina que esta executando o comando, por exemplo com `hostname -I` no Linux. Se o IP for `192.168.1.20`, ambos os jogadores podem abrir links como:

```txt
http://192.168.1.20:8080/Main.html?demo=online&room=terra&name=Ana&server=ws%3A%2F%2F192.168.1.20%3A3000
http://192.168.1.20:8080/Main.html?demo=online&room=terra&name=Beto&server=ws%3A%2F%2F192.168.1.20%3A3000
```

O parametro `server` pertence ao jogo/demo e aponta para qualquer backend WebSocket compativel. Os jogadores precisam escolher o mesmo valor de `room`.

Se a porta `8080` estiver ocupada, o servidor informa outra porta no terminal; substitua `8080` nos links pelo numero exibido. Se o acesso falhar, libere as portas TCP do servidor web e `3000` no firewall da maquina que esta hospedando.

O exemplo `NodeWebSocketRelay` apenas encaminha envelopes na mesma sala. Sua dependencia `ws` nao pertence ao runtime GameForgeJS, e esse relay nao e um servidor MMO de producao.

## Arquitetura Para Um MMO

`GameForgeJS` deve permanecer como runtime do cliente: renderizacao, input, UI, audio, predicao/interpolacao e o adaptador que transporta mensagens. Um MMO real exige um aplicativo servidor externo e autoritativo.

- O cliente envia intencoes, como mover, atacar, interagir e conversar.
- O servidor autentica sessoes, valida comandos, simula regras e decide o estado verdadeiro do mundo.
- O servidor distribui snapshots/eventos apenas aos jogadores relevantes, usando salas, mapas ou interest management espacial.
- Persistencia de contas, personagens, inventario, guildas e mundo fica em banco/servicos do backend.
- Escala, logs, moderacao, seguranca e anti-cheat pertencem a infraestrutura do jogo.

Esse backend pode ser escrito em Node.js, .NET, Java, Go, Rust, C++ ou outra tecnologia. O contrato com GameForgeJS e o protocolo de mensagens que o cliente consome por `WebSocketClientAdapter`, e nao uma dependencia instalada dentro da engine.

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

Para hospedar pela internet ou usar outra infraestrutura, forneca um relay externo e substitua somente o adaptador:

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

`Tools/server.js` serve arquivos locais apenas. O backend WebSocket e uma aplicacao separada; regras autoritativas e persistencia devem pertencer ao servidor do jogo.
