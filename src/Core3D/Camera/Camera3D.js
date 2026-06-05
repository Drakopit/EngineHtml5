import { Mat4 } from "../../CoreCross/Math/Mat4.js";
import { Deprecation } from "../../CoreCross/Deprecation.js";

/** @deprecated Use `PerspectiveCamera` from `Core3D/index.js`. */
export class Camera3D {
    constructor(screen) {
        Deprecation.WarnOnce("Camera3D", "PerspectiveCamera");
        this.screen = screen;
        
        // Posição da câmera no mundo (X, Y, Z)
        this.position = [0, 5, 10]; 
        
        // Para onde a câmera está olhando (Alvo)
        this.target = [0, 0, 0];
        
        // Qual direção é "para cima" (Geralmente o eixo Y positivo)
        this.up = [0, 1, 0];

        this.viewMatrix = Mat4.create();
        this.projectionMatrix = Mat4.create();

        this.CalculateProjection();
    }

    CalculateProjection() {
        // Calcula a perspectiva da lente (FOV de 45 graus)
        const aspect = (this.screen.width || this.screen.Width) / (this.screen.height || this.screen.Height);
        Mat4.perspective(this.projectionMatrix, (45 * Math.PI) / 180, aspect, 0.1, 100.0);
    }

    /**
     * Atualiza a matriz de visualização a cada frame
     */
    Update() {
        // Cria a matriz de câmera olhando da 'position' para o 'target'
        Mat4.lookAt(this.viewMatrix, this.position, this.target, this.up);
    }

    /**
     * Faz a câmera seguir um objeto dinamicamente
     * @param {GameObject3D} targetObject 
     */
    Follow(targetObject) {
        const objPos = targetObject.transform.position;

        // O alvo para o qual olhamos é a posição do objeto
        this.target = [objPos[0], objPos[1], objPos[2]];

        // A posição da câmera fica um pouco atrás e acima do objeto (Câmera em 3ª pessoa)
        // Ex: Eixo Y (Altura) + 3 unidades, Eixo Z (Distância) + 6 unidades
        this.position = [objPos[0], objPos[1] + 3.0, objPos[2] + 12.0];
    }
}
