export class Texture {
    constructor(source = null, {
        flipY = true,
        generateMipmaps = true,
        wrapS = null,
        wrapT = null,
        minFilter = null,
        magFilter = null,
    } = {}) {
        this.source = source;
        this.flipY = flipY;
        this.generateMipmaps = generateMipmaps;
        this.wrapS = wrapS;
        this.wrapT = wrapT;
        this.minFilter = minFilter;
        this.magFilter = magFilter;
        this.glTexture = null;
        this.ready = false;
        this.loading = null;
    }

    static Load(source, options = {}) {
        return new Texture(source, options);
    }

    static FromImage(image, options = {}) {
        return new Texture(image, options);
    }

    EnsureGPU(gl, fallbackTexture = null) {
        if (this.glTexture) return this.glTexture;
        if (!this.source) return fallbackTexture;

        const isImageBitmap = typeof ImageBitmap !== "undefined" && this.source instanceof ImageBitmap;
        if (this.source instanceof HTMLImageElement || this.source instanceof HTMLCanvasElement || isImageBitmap) {
            this.Upload(gl, this.source);
            return this.glTexture;
        }

        if (typeof this.source === "string") {
            this.LoadImage(gl);
        }

        return fallbackTexture;
    }

    LoadImage(gl) {
        if (this.loading) return this.loading;

        this.loading = new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => {
                this.Upload(gl, image);
                resolve(this);
            };
            image.onerror = () => reject(new Error(`Texture: failed to load ${this.source}`));
            image.src = this.source;
        }).catch(error => {
            console.warn(error.message);
            return this;
        });

        return this.loading;
    }

    Upload(gl, image) {
        this.glTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.glTexture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, this.flipY);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, this.wrapS ?? gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, this.wrapT ?? gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.minFilter ?? gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.magFilter ?? gl.LINEAR);

        if (this.generateMipmaps) {
            gl.generateMipmap(gl.TEXTURE_2D);
        }

        gl.bindTexture(gl.TEXTURE_2D, null);
        this.ready = true;
        return this.glTexture;
    }

    Dispose(gl) {
        if (this.glTexture) {
            gl.deleteTexture(this.glTexture);
            this.glTexture = null;
            this.ready = false;
        }
    }
}
