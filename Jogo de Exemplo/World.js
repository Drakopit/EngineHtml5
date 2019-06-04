import { Screen } from "../Scripts/Window/Screen.js";
import { Scene } from "../Scripts/Root/Scene.js";
import { Player } from "./Entities/Player.js";
import { NPC } from "./Entities/NPC.js";
import { Collide2D } from "../Scripts/Math/Collide2D.js";
import { Physic2D } from "../Scripts/Math/Physic2D.js";
import { Menu } from "../Scripts/GUI/Menu.js";

var Objects = new Array();
var p = document.createElement('p');
document.body.appendChild(p);

export class World {
    constructor() {
        // Configurações do ambiente
        this.screen = new Screen("PrimeiraFase", 640, 480);
        this.screen.Init("Fase01");

        this.scene = new Scene("PrimeiraFase", this.screen);
        this.scene.CallScene("PrimeiraFase", "Fase_01");
        
        // Entidades
        this.jogador = new Player(this.screen);
        this.npc = new NPC(this.screen);

        // Adiciona objetos à lista
        Objects.push(this.jogador, this.npc);
    }

    Loop(dt) {
        this.screen.Refresh();
        // Adiciona todos os objetos da cena
        for (let i = 0; i <= Objects.length; i++) {
            for (let j = i+1; j < Objects.length; j++) {
                let colidido = Objects[i];
                let colisor = Objects[j];
                if (Collide2D.isCollidingAABB(colidido, colisor)) {
                    Physic2D.reactinCollision(colidido, colisor);
                    p.innerText = "Esta colidindo!";
                    p.style.color = "red";
                } else {
                    p.innerText = "Não esta colidindo!";
                    p.style.color = "blue";
                }
            }
        }
        for (const object of Objects) {
            object.Update();
            object.FixedUpdate(dt);
            object.DrawSelf(dt);
            object.OnGUI(dt);
        }
    }
}