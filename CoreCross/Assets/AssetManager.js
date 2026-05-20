import { Logger } from "../Logger.js";
import { AudioManager } from "../Audio/AudioManager.js"; // <-- IMPORTANTE: Ajuste o caminho se necessário


/**
 * @doc Class AssetManager
 * @namespace Root
 * @class AssetManager
 * @summary Preloader para imagens, áudios e dados JSON. Evita travamentos durante o gameplay.
 */
export class AssetManager {
    constructor() {
        this.images = {};
        this.audioQueue = [];
        this.audios = {};
        this.shaders = {};
        this.models = {};
        this.jsons = {};
        this.promises = []; // Guarda as promessas de imagens e shaders

        // Singleton
        if (!AssetManager.instance) {
            AssetManager.instance = this;
        }
        return AssetManager.instance;
    }

    // Coloca o áudio na fila
    QueueAudio(name, path) {
        this.audioQueue.push({ name, path });
    }

    // Pega o áudio decodificado da memória
    GetAudio(name) {
        if (!this.audios[name]) console.warn(`AssetManager: Áudio '${name}' não encontrado.`);
        return this.audios[name];
    }

    // Processa a fila de áudios separadamente
    async LoadAudioQueue() {
        if (this.audioQueue.length === 0) return;

        // Precisamos garantir que o AudioManager instanciou o context para decodificar
        AudioManager.instance.Initialize();
        const context = AudioManager.instance.context;

        // Cria as promessas, mas não joga no this.promises. Vamos resolver elas aqui mesmo.
        const audioPromises = this.audioQueue.map(async (item) => {
            try {
                const response = await fetch(item.path);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await context.decodeAudioData(arrayBuffer);
                this.audios[item.name] = audioBuffer;
            } catch (error) {
                console.error(`GameForgeJS: Erro ao carregar áudio ${item.name} no caminho ${item.path}`, error);
            }
        });

        // Aguarda todos os áudios terminarem de baixar e decodificar
        await Promise.all(audioPromises);
    }

    /**
     * @description Coloca uma imagem na fila de carregamento
     */
    QueueImage(name, src) {
        const promise = new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.images[name] = img;
                resolve(img);
            };
            img.onerror = () => reject(new Error(`Falha ao carregar imagem: ${src}`));
            img.src = src;
        });
        this.promises.push(promise);
    }

    /**
     * @function QueueShader
     * @description Coloca um shader na fila de carregamento
     */
    QueueShader(name, url) {
        const promise = fetch(url)
            .then(response => {
                if (!response.ok) throw new Error(`Erro no shader: ${url}`);
                return response.text(); // Pega o código fonte do shader como texto
            })
            .then(sourceCode => {
                this.shaders[name] = sourceCode; // Salva na memória
            });

        this.promises.push(promise);
    }

    QueueModel(name, url) {
        const promise = this.LoadModel(url);

        this.promises.push(
            promise.then(meshes => { this.models[name] = meshes; })
        );
    }

    async LoadModel(url) {
        const [{ OBJLoader }, { ModelLoader }] = await Promise.all([
            import("../../Core3D/Assets/OBJLoader.js"),
            import("../../Core3D/Assets/ModelLoader.js"),
        ]);

        return url.endsWith(".obj")
            ? OBJLoader.Load(url)
            : ModelLoader.Load(url);
    }

    QueueJson(name, url) {
        const promise = fetch(url)
            .then(response => {
                if (!response.ok) throw new Error(`Erro no JSON: ${url}`);
                return response.json();
            })
            .then(json => {
                this.jsons[name] = json;
            });

        this.promises.push(promise);
    }

    GetModel(name) {
        if (!this.models?.[name]) console.warn(`AssetManager: Modelo '${name}' não encontrado.`);
        return this.models?.[name] ?? null;
    }

    /**
     * @description Retorna o código fonte do shader solicitado
     */
    GetShader(name) {
        if (!this.shaders[name]) console.warn(`AssetManager: Shader '${name}' não encontrado.`);
        return this.shaders[name];
    }

    /**
     * @description Aguarda todos os assets serem carregados
     */
    async LoadAll() {
        // 1. Primeiro dispara o carregamento de todos os áudios e espera terminar
        await this.LoadAudioQueue();

        // 2. Depois espera todas as imagens e shaders terminarem
        await Promise.all(this.promises);

        // 3. Limpa as filas para não carregar de novo caso chame LoadAll futuramente
        this.promises = [];
        this.audioQueue = [];

        Logger.log("info", "AssetManager: Todos os assets (Imagens, Shaders e Áudios) foram carregados com sucesso!");
    }

    GetImage(name) {
        if (!this.images[name]) console.warn(`AssetManager: Imagem '${name}' não encontrada.`);
        return this.images[name];
    }

    HasImage(name) {
        return Boolean(this.images[name]);
    }

    GetJson(name) {
        if (!this.jsons[name]) console.warn(`AssetManager: JSON '${name}' nao encontrado.`);
        return this.jsons[name];
    }
}
