import { GameObject } from "../../Core2D/Objects/GameObject.js";
import { Vector2D } from "../../CoreCross/Math/Vector2D.js";
import { Draw } from "../../Core2D/Graphics/Draw.js";

export class Coin extends GameObject {
    constructor(screen) {
        super();
        this.name = "Coin";
        this.size = new Vector2D(20, 20); // Tamanho da caixa de colisão
        this.draw = new Draw(screen);
        this.Respawn();
    }

    Respawn() {
        // Nasce em uma posição aleatória dentro da tela
        const randomX = Math.floor(Math.random() * 580) + 20;
        const randomY = Math.floor(Math.random() * 420) + 20;
        this.position = new Vector2D(randomX, randomY);
    }

    OnDrawn() {
        // Desenha a moeda como um círculo amarelo
        this.draw.Color = "#FFD700";
        // DrawCircle precisa do centro, então somamos metade do tamanho (10)
        this.draw.DrawCircle(this.position.x + 10, this.position.y + 10, 10);
    }
}