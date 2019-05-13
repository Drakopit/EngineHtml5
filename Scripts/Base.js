class Base {
    constructor() {
        Awake();
    }
    
    // Sempre é chamado quando um objeto é criado
    static Awake() {
        // Cálcula o tempo de Runtime
        this.startTime;
        this.deltaTime = deltaTime || new Date().getTime();
        this.runTime = deltaTime - startTime;

        // Define o método de atualização da tela
        window.requestAnimationFrame = window.requestAnimationFrame // Padrão
        || window.mozRequestAnimationFrame // Mozilla
        || window.webkitRequestAnimationFrame // Chrome
        || window.msRequestAnimationFrame // Safari
        || function(f) {return setTimeout(f, 1000/60)} // Simula FPS 60
    }

    // Inicializa
    Start() {}

    // Atualiza Baseado em FPS
    Update(callBack) {
        requestAnimationFrame(() => callBack())
    }

    // Atualiza com uma taxa
    // baseada em segundos
    FixedUpdate(callBackFixed) {
        requestAnimationFrame(() => callBackFixed())
    }

    // Desenha algo na tela
    // Relativo a UI
    OnGUI() {
        this.Update(this.OnGUI());
    }
}