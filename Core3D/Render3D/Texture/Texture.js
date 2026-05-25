/**
 * Lazy WebGL texture resource created from an image or URL.
 *
 * @param {string|HTMLImageElement|HTMLCanvasElement|null} [source=null] - Texture source.
 * @param {Object} [options] - Upload and sampling options.
 * @param {boolean} [options.flipY=true] - Flip source image vertically on upload.
 * @param {boolean} [options.generateMipmaps=true] - Generate mip levels.
 * @param {number} [options.anisotropy=1] - Requested anisotropic filtering amount.
 */
export class Texture {
    constructor(source = null, {
        flipY = true,
        generateMipmaps = true,
        wrapS = null,
        wrapT = null,
        minFilter = null,
        magFilter = null,
        anisotropy = 1,
    } = {}) {
        this.source = source;
        this.flipY = flipY;
        this.generateMipmaps = generateMipmaps;
        this.wrapS = wrapS;
        this.wrapT = wrapT;
        this.minFilter = minFilter;
        this.magFilter = magFilter;
        this.anisotropy = anisotropy;
        this.glTexture = null;
        this.ready = false;
        this.loading = null;
    }

    /**
     * Creates a lazily loaded URL texture.
     * @param {string} source - Image URL.
     * @param {Object} [options={}] - Texture options.
     * @returns {Texture} Texture resource.
     */
    static Load(source, options = {}) {
        return new Texture(source, options);
    }

    static FromImage(image, options = {}) {
        return new Texture(image, options);
    }

    /**
     * Uploads or begins loading the source when first required by a renderer.
     * @param {WebGL2RenderingContext} gl - Active graphics context.
     * @param {WebGLTexture|null} [fallbackTexture=null] - Temporary texture while loading.
     * @returns {WebGLTexture|null} Current GPU texture or fallback.
     */
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

        if (this.anisotropy > 1) {
            const extension = gl.getExtension("EXT_texture_filter_anisotropic")
                ?? gl.getExtension("WEBKIT_EXT_texture_filter_anisotropic")
                ?? gl.getExtension("MOZ_EXT_texture_filter_anisotropic");
            if (extension) {
                const maximum = gl.getParameter(extension.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
                gl.texParameterf(
                    gl.TEXTURE_2D,
                    extension.TEXTURE_MAX_ANISOTROPY_EXT,
                    Math.min(this.anisotropy, maximum)
                );
            }
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
