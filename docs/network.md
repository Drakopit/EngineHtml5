# CoreNetwork

`CoreNetwork` e a camada de rede nativa da GameForgeJS. Ela usa `WebSocket` do navegador, mensagens JSON e eventos, sem dependencias externas e sem impor um servidor especifico.

O `server.js` de desenvolvimento tambem oferece uma sala WebSocket em `/gameforge-network`. Para testar com duas instancias:

```txt
http://localhost:8080/Main.html?demo=online
http://localhost:8080/Main.html?demo=online
```

Use `?room=nome-da-sala` para separar mundos:

```txt
http://localhost:8080/Main.html?demo=online&room=terra
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
