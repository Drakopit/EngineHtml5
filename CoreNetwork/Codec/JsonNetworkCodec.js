import { NetworkMessage } from "../NetworkMessage.js";

export class JsonNetworkCodec {
    get binaryType() {
        return "arraybuffer";
    }

    Encode(message) {
        return NetworkMessage.Serialize(message);
    }

    Decode(data) {
        return NetworkMessage.Parse(data);
    }
}
