/**
 * @doc Class ObjectPool
 * @namespace Root
 * @class ObjectPool
 * @summary Recicla GameObjects (como Tiros e Partículas) para evitar vazamento de memória.
 */
export class ObjectPool {
    constructor(createFunc, initialSize = 20) {
        this.pool = [];
        this.createFunc = createFunc;

        // Pré-aloca os objetos na memória
        for (let i = 0; i < initialSize; i++) {
            let obj = this.createFunc();
            obj.active = false; // Flag para saber se está em uso
            this.pool.push(obj);
        }
    }

    /**
     * @description Pega um objeto livre do Pool
     */
    Get() {
        // Procura um objeto que não está sendo usado
        let obj = this.pool.find(item => !item.active);
        
        // Se a pool encher, expande ela dinamicamente
        if (!obj) {
            obj = this.createFunc();
            this.pool.push(obj);
        }

        obj.active = true;
        return obj;
    }

    /**
     * @description Devolve o objeto para o Pool
     */
    Release(obj) {
        obj.active = false;
        // Joga para fora da tela ou reseta propriedades
        if(obj.position) {
            obj.position.SetValue(-9999, -9999);
        }
    }
}