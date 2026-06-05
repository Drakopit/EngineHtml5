import { Vector2D } from "../../../src/CoreCross/Math/Vector2D.js";

export class HitBox {
    constructor(owner, offsetX, offsetY, width, height) {
        this.owner = owner; 
        this.offsetX = offsetX; 
        this.offsetY = offsetY; 
        
        // Propriedades compatíveis com o seu Collide2D!
        this.size = new Vector2D(width, height);
        this.position = new Vector2D(0, 0); 
        
        this.active = false; // Só fica true no momento do golpe da espada/soco
    }

    Update() {
        if (!this.active) return;

        // Verifica a direção do dono (1 para direita, -1 para esquerda)
        let dir = this.owner.facingRight ? 1 : -1;
        
        // A posição inicial é o centro do dono + o deslocamento multiplicado pela direção
        this.position.x = this.owner.position.x + (this.owner.size.x / 2) + (this.offsetX * dir);
        
        // Se estiver virado para a esquerda, precisamos empurrar a caixa para trás
        // pela própria largura dela, para que ela cresça para o lado certo.
        if (!this.owner.facingRight) {
            this.position.x -= this.size.x;
        }

        // O Y apenas soma o offset a partir do topo do personagem
        this.position.y = this.owner.position.y + this.offsetY;
    }
}