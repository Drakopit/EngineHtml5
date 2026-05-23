# CoreNetwork

`CoreNetwork` e a camada de rede nativa da GameForgeJS. Ela usa `WebSocket` do navegador, eventos e codecs plugaveis, sem dependencias externas e sem impor um servidor especifico.

A filosofia e manter o jogo simples por cima e deixar os detalhes de transporte em camadas:

- `NetworkClient`: conexao WebSocket, reconnect, eventos e requests.
- `NetworkRoomClient`: sala, perfil de jogador, snapshots remotos e helpers para estado/blocos/chat.
- `BinaryNetworkCodec`: pacotes frequentes em bytes/fixed-point, como posicao e velocidade de player.
- `JsonNetworkCodec`: mensagens raras e legiveis, como perfil, chat, welcome e alteracao de bloco.
- `NetworkSnapshotBuffer`: interpolacao de snapshots para suavizar outros jogadores.

O `server.js` de desenvolvimento tambem oferece uma sala WebSocket em `/gameforge-network`. Para testar com duas instancias:

```txt
http://localhost:8080/Main.html?demo=online
http://localhost:8080/Main.html?demo=online
```

Use `?room=nome-da-sala` para separar mundos:

```txt
http://localhost:8080/Main.html?demo=online&room=terra
```

Use `?name=Camello` para entrar com nome direto, ou deixe a demo perguntar e salvar no `localStorage`:

```txt
http://localhost:8080/Main.html?demo=online&room=terra&name=Camello
```

Para conectar em um servidor externo, informe `serverUrl` no config da demo ou passe `?server=` na URL. Use `wss://` em producao com HTTPS:

```json
{
  "network": {
    "serverUrl": "wss://meu-dominio.com/gameforge-network",
    "syncRate": 12,
    "interpolationDelay": 120
  }
}
```

```txt
http://localhost:8080/Main.html?demo=online&room=terra&server=wss%3A%2F%2Fmeu-dominio.com%2Fgameforge-network
```

## Cliente

```js
import { NetworkClient } from "../CoreNetwork/index.js";

const network = new NetworkClient({
    url: "ws://localhost:3000",
    autoReconnect: true,
});

network.on("open", () => {
    network.Send("player:join", { name: "Player" });
});

network.on("world:update", message => {
    console.log(message.payload);
});

network.Connect();
```

Para jogos por sala, prefira `NetworkRoomClient`:

```js
import { NetworkRoomClient } from "../CoreNetwork/index.js";

const room = new NetworkRoomClient({
    url: "wss://meu-dominio.com/gameforge-network?room=terra",
    name: "Camello",
    syncRate: 12,
});

room.on("room:welcome", welcome => {
    console.log(welcome.roomId);
});

room.Connect();

function updateNetwork() {
    room.SendPlayerState({ x: player.x, y: player.y, vx: player.vx, vy: player.vy });
}
```

Tambem e possivel criar pelo bloco `network` do `gameforge.config.json`:

```js
const network = NetworkClient.FromConfig();
```

## Estado

`NetworkStateSync` faz snapshots pequenos de objetos rastreados. O jogo decide autoridade, reconciliacao e validacao no servidor.

```js
import { NetworkClient, NetworkStateSync } from "../CoreNetwork/index.js";

const network = NetworkClient.FromConfig();
const sync = new NetworkStateSync({
    client: network,
    tickRate: 20,
});

sync.TrackObject("player", player.transform, ["position", "rotation"]);
sync.Start();
```
