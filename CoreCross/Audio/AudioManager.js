// Arquivo: Root/AudioManager.js

export class AudioManager {
    // Padrão Singleton: Só existe uma instância no jogo inteiro
    static instance = new AudioManager();

    constructor() {
        if(!AudioManager.instance) AudioManager.instance = this;

        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        this.context = null;

        // Nodos Globais
        this.masterGain = null;
        this.analyserNode = null;

        // Controle de BGM (Música de Fundo)
        this.currentBGM = null;
        this.isInitialized = false;
    }

    // A inicialização deve ser chamada no primeiro clique/interação do usuário
    Initialize() {
        if (this.isInitialized) return;

        try {
            this.context = new AudioContext();

            // Lida com as políticas chatas de Autoplay do Chrome/Firefox
            if (this.context.state === 'suspended') {
                const resumeAudio = () => {
                    this.context.resume().then(() => {
                        console.log('GameForgeJS: AudioContext retomado com sucesso.');
                        document.removeEventListener('click', resumeAudio);
                        document.removeEventListener('keydown', resumeAudio);
                    });
                };
                document.addEventListener('click', resumeAudio);
                document.addEventListener('keydown', resumeAudio);
            }

            // --- SETUP DA ROTA DE ÁUDIO (Gain -> Analyser -> Caixas de Som) ---
            this.masterGain = this.context.createGain();
            this.masterGain.gain.value = 1.0; // Volume Global (1.0 = 100%, 0.5 = 50%)

            this.analyserNode = this.context.createAnalyser();
            this.analyserNode.fftSize = 256; // Tamanho do buffer para análise de espectro

            // Conecta o Volume no Analisador, e o Analisador no Destino Final
            this.masterGain.connect(this.analyserNode);
            this.analyserNode.connect(this.context.destination);

            this.isInitialized = true;
            console.log('GameForgeJS: AudioManager inicializado.');
        } catch (ex) {
            console.error('Erro ao inicializar AudioManager:', ex);
        }
    }

    SetGlobalVolume(volume) {
        if (this.masterGain) {
            // value = Math.max(0, Math.min(1, volume)) para travar entre 0 e 1
            this.masterGain.gain.value = volume;
        }
    }

    /**
     * Toca um Efeito Sonoro (SFX). Fire and Forget!
     * Cria uma instância nova, toca e o próprio navegador limpa da memória depois.
     */
    PlaySFX(audioBuffer, localVolume = 1.0) {
        if (!this.context || !audioBuffer) return;

        // Cria o reprodutor para ESTE som específico
        const source = this.context.createBufferSource();
        source.buffer = audioBuffer;

        // Cria um controle de volume individual para este tiro/pulo
        const sfxGain = this.context.createGain();
        sfxGain.gain.value = localVolume;

        // Rota: Som -> Volume Local -> Volume Global
        source.connect(sfxGain);
        sfxGain.connect(this.masterGain);

        source.start(0); // Toca imediatamente
    }

    /**
     * Toca Música de Fundo (BGM). Loop automático e permite pausar.
     */
    PlayBGM(audioBuffer, localVolume = 0.5) {
        if (!this.context || !audioBuffer) return;

        this.StopBGM(); // Para a música atual antes de tocar a nova

        this.currentBGM = this.context.createBufferSource();
        this.currentBGM.buffer = audioBuffer;
        this.currentBGM.loop = true;

        const bgmGain = this.context.createGain();
        bgmGain.gain.value = localVolume;

        this.currentBGM.connect(bgmGain);
        bgmGain.connect(this.masterGain);

        this.currentBGM.start(0);
    }

    StopBGM() {
        if (this.currentBGM) {
            try {
                // Tenta parar a música. Se ela estiver "suspended" pelo navegador, 
                // isso pode dar erro, então o catch ignora o erro e continua a limpeza.
                this.currentBGM.stop();
            } catch (e) {
                console.warn("GameForgeJS: BGM parada antes de ser iniciada pelo usuário.");
            }

            // Garante que o nó seja desconectado e apagado da memória
            this.currentBGM.disconnect();
            this.currentBGM = null;
        }
    }
}