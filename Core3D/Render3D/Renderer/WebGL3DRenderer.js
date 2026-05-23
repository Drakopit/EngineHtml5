import { Mat4 } from "../../../CoreCross/Math/Mat4.js";
import { Texture } from "../Texture/Texture.js";
import { Shader } from "../Shader/Shader.js";
import { STANDARD_FRAGMENT_SHADER, STANDARD_VERTEX_SHADER } from "../Shader/StandardShader.js";
import { UNLIT_FRAGMENT_SHADER, UNLIT_VERTEX_SHADER } from "../Shader/UnlitShader.js";
import { SHADOW_FRAGMENT_SHADER, SHADOW_VERTEX_SHADER } from "../Shader/ShadowShader.js";
import { CELESTIAL_FRAGMENT_SHADER, CELESTIAL_VERTEX_SHADER } from "../Shader/CelestialShader.js";
import { AssetManager } from "../../../CoreCross/Assets/AssetManager.js";

const ATTRIBUTE = Object.freeze({
    position: 0,
    normal: 1,
    uv: 2,
    tangent: 3,
});

const MAX_POINT_LIGHTS = 4;
const MAX_SPOT_LIGHTS = 2;

export class WebGL3DRenderer {
    constructor(canvasOrScreen, {
        clearColor = [0.03, 0.04, 0.07, 1],
        antialias = true,
    } = {}) {
        this.canvas = canvasOrScreen?.Canvas ?? canvasOrScreen;
        if (!this.canvas) {
            throw new Error("WebGL3DRenderer requires a canvas or Screen3D.");
        }

        this.gl = this.canvas.getContext("webgl2", { antialias });
        if (!this.gl) {
            throw new Error("GameForgeJS Render3D requires WebGL2.");
        }

        this.clearColor = [...clearColor];
        this.geometryCache = new WeakMap();
        this.textureCache = new Map();
        this.shadowCache = new WeakMap();
        this.lightViewProjection = Mat4.create();

        const customCelestialVs = AssetManager.instance?.shaders?.["celestial_vs"];
        const customCelestialFs = AssetManager.instance?.shaders?.["celestial_fs"];

        this.standardShader = new Shader(this.gl, STANDARD_VERTEX_SHADER, STANDARD_FRAGMENT_SHADER, "StandardShader");
        this.unlitShader = new Shader(this.gl, UNLIT_VERTEX_SHADER, UNLIT_FRAGMENT_SHADER, "UnlitShader");
        this.shadowShader = new Shader(this.gl, SHADOW_VERTEX_SHADER, SHADOW_FRAGMENT_SHADER, "ShadowShader");
        this.celestialShader = new Shader(this.gl, customCelestialVs || CELESTIAL_VERTEX_SHADER, customCelestialFs || CELESTIAL_FRAGMENT_SHADER, "CelestialShader");

        this.#configureState();
        this.#createFallbackTextures();
    }

    Render(scene, camera = scene?.camera) {
        if (!scene) throw new Error("WebGL3DRenderer.Render requires a Scene3D.");
        if (!camera) throw new Error("WebGL3DRenderer.Render requires a PerspectiveCamera.");

        this.#resize();
        camera.UpdateProjection(this.canvas.width / Math.max(1, this.canvas.height));
        camera.UpdateView();

        const shadowState = this.#renderShadowPass(scene, camera);
        this.#beginMainPass(scene.backgroundColor ?? this.clearColor);

        const objects = scene.GetRenderableObjects();
        for (const mesh of objects) {
            this.#drawMesh(mesh, scene, camera, shadowState);
        }
    }

    Dispose() {
        this.standardShader.Dispose();
        this.unlitShader.Dispose();
        this.shadowShader.Dispose();
        this.celestialShader.Dispose();
        this.geometryCache = new WeakMap();
        this.textureCache.clear();
        this.shadowCache = new WeakMap();
    }

    #configureState() {
        const gl = this.gl;
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);
        gl.frontFace(gl.CCW);
        gl.clearColor(...this.clearColor);
    }

    #createFallbackTextures() {
        this.whiteTexture = this.#createSolidTexture([255, 255, 255, 255]);
        this.normalTexture = this.#createSolidTexture([128, 128, 255, 255]);
        this.blackTexture = this.#createSolidTexture([0, 0, 0, 255]);
    }

    #createSolidTexture(color) {
        const gl = this.gl;
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(color));
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        return texture;
    }

    #resize() {
        const displayWidth = this.canvas.clientWidth || this.canvas.width || 1;
        const displayHeight = this.canvas.clientHeight || this.canvas.height || 1;

        if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
            this.canvas.width = displayWidth;
            this.canvas.height = displayHeight;
        }
    }

    #beginMainPass(clearColor) {
        const gl = this.gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.colorMask(true, true, true, true);
        gl.clearColor(clearColor[0], clearColor[1], clearColor[2], clearColor[3] ?? 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }

    #drawMesh(mesh, scene, camera, shadowState) {
        const material = mesh.material ?? {};
        const shader = this.#getShaderForMaterial(material);
        const gl = this.gl;
        const geometry = this.#getGeometryState(mesh.geometry);
        const model = mesh.transform.GetMatrix(Mat4.create());

        shader.Use();
        gl.bindVertexArray(geometry.vao);

        this.#setMatrix(shader, "uModel", model);
        this.#setMatrix(shader, "uView", camera.viewMatrix);
        this.#setMatrix(shader, "uProjection", camera.projectionMatrix);

        if (material.transparent) {
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        } else {
            gl.disable(gl.BLEND);
        }

        if (material.type === "unlit") {
            this.#bindUnlitMaterial(shader, material);
        } else if (material.type === "celestial") {
            const normalMatrix = Mat4.create();
            Mat4.copy(normalMatrix, model);
            if (Mat4.invert(normalMatrix, normalMatrix)) {
                Mat4.transpose(normalMatrix, normalMatrix);
            }

            this.#setMatrix(shader, "uNormalMatrix", normalMatrix);
            this.#setVec3(shader, "uCameraPosition", camera.position);
            this.#bindCelestialMaterial(shader, material, scene);
        } else {
            const normalMatrix = Mat4.create();
            Mat4.copy(normalMatrix, model);
            if (Mat4.invert(normalMatrix, normalMatrix)) {
                Mat4.transpose(normalMatrix, normalMatrix);
            }

            this.#setMatrix(shader, "uNormalMatrix", normalMatrix);
            this.#setMatrix(shader, "uLightViewProjection", shadowState?.matrix ?? this.lightViewProjection);
            this.#setVec3(shader, "uCameraPosition", camera.position);
            this.#bindStandardMaterial(shader, material, mesh, shadowState);
            this.#bindLights(shader, scene, shadowState);
        }

        if (geometry.indexed) {
            gl.drawElements(gl.TRIANGLES, geometry.count, geometry.indexType, 0);
        } else {
            gl.drawArrays(gl.TRIANGLES, 0, geometry.count);
        }

        gl.bindVertexArray(null);
    }

    #getShaderForMaterial(material) {
        if (material.type === "unlit") return this.unlitShader;
        if (material.type === "celestial") return this.celestialShader;
        return this.standardShader;
    }

    #bindUnlitMaterial(shader, material) {
        this.#setVec4(shader, "uAlbedoColor", material.albedoColor ?? [1, 1, 1, 1]);
        this.#bindTexture(shader, 0, "uAlbedoMap", "uHasAlbedoMap", material.albedoMap, this.whiteTexture);
    }

    #bindStandardMaterial(shader, material, mesh, shadowState) {
        this.#setVec4(shader, "uAlbedoColor", material.albedoColor ?? [1, 1, 1, 1]);
        this.#setVec3(shader, "uEmissiveColor", material.emissiveColor ?? [0, 0, 0]);
        this.#set1f(shader, "uRoughness", material.roughness ?? 0.72);
        this.#set1f(shader, "uMetallic", material.metallic ?? 0);

        this.#bindTexture(shader, 0, "uAlbedoMap", "uHasAlbedoMap", material.albedoMap, this.whiteTexture);
        this.#bindTexture(shader, 1, "uNormalMap", "uHasNormalMap", material.normalMap, this.normalTexture);
        this.#bindTexture(shader, 2, "uRoughnessMap", "uHasRoughnessMap", material.roughnessMap, this.whiteTexture);
        this.#bindTexture(shader, 3, "uAoMap", "uHasAoMap", material.aoMap, this.whiteTexture);
        this.#bindTexture(shader, 4, "uEmissiveMap", "uHasEmissiveMap", material.emissiveMap, this.blackTexture);

        const useShadow = Boolean(shadowState?.texture && material.receiveShadow !== false && mesh.receiveShadow !== false);
        this.#set1i(shader, "uUseShadowMap", useShadow ? 1 : 0);
        this.#bindTextureObject(shader, 5, "uShadowMap", shadowState?.texture ?? this.whiteTexture);
    }

    #bindCelestialMaterial(shader, material, scene) {
        const pointLight = scene.GetLights("point")[0];
        this.#setVec3(shader, "uLightPosition", pointLight?.position ?? [0, 0, 0]);
        this.#setVec3(shader, "uBaseColor", material.baseColor ?? [0.25, 0.46, 1.0]);
        this.#setVec3(shader, "uSecondaryColor", material.secondaryColor ?? [0.95, 0.88, 0.55]);
        this.#setVec3(shader, "uAtmosphereColor", material.atmosphereColor ?? [0.45, 0.74, 1.0]);
        this.#setVec3(shader, "uNightColor", material.nightColor ?? [0.02, 0.025, 0.06]);
        this.#setVec3(shader, "uEmissiveColor", material.emissiveColor ?? [0, 0, 0]);
        this.#set1f(shader, "uRoughness", material.roughness ?? 0.62);
        this.#set1f(shader, "uSeed", material.seed ?? 1);
        this.#set1f(shader, "uCloudStrength", material.cloudStrength ?? 0.35);
        this.#set1f(shader, "uAtmosphereStrength", material.atmosphereStrength ?? 0.55);
        this.#set1f(shader, "uEmissiveStrength", material.emissiveStrength ?? 0);
        this.#set1f(shader, "uTime", performance.now() / 1000);
        this.#bindTexture(shader, 0, "uAlbedoMap", "uHasAlbedoMap", material.albedoMap, this.whiteTexture);
    }

    #bindLights(shader, scene, shadowState) {
        const ambient = scene.GetLights("ambient")[0];
        const hemisphere = scene.GetLights("hemisphere")[0];
        const directional = scene.GetLights("directional")[0];
        const points = scene.GetLights("point").slice(0, MAX_POINT_LIGHTS);
        const spots = scene.GetLights("spot").slice(0, MAX_SPOT_LIGHTS);

        this.#setVec3(shader, "uAmbientColor", ambient?.color ?? [1, 1, 1]);
        this.#set1f(shader, "uAmbientIntensity", ambient?.intensity ?? 0.12);
        this.#setVec3(shader, "uHemisphereSkyColor", hemisphere?.skyColor ?? [0, 0, 0]);
        this.#setVec3(shader, "uHemisphereGroundColor", hemisphere?.groundColor ?? [0, 0, 0]);
        this.#set1f(shader, "uHemisphereIntensity", hemisphere?.intensity ?? 0);

        this.#set1i(shader, "uHasDirectionalLight", directional ? 1 : 0);
        this.#setVec3(shader, "uDirectionalDirection", directional?.direction ?? [0, -1, 0]);
        this.#setVec3(shader, "uDirectionalColor", directional?.color ?? [1, 1, 1]);
        this.#set1f(shader, "uDirectionalIntensity", directional?.intensity ?? 0);
        this.#set1f(shader, "uShadowBias", shadowState?.light?.shadowBias ?? 0.0012);
        this.#set1f(shader, "uShadowStrength", shadowState?.light?.shadowStrength ?? 0.55);

        this.#set1i(shader, "uPointLightCount", points.length);
        points.forEach((light, index) => {
            this.#setVec3(shader, `uPointLightPositions[${index}]`, light.position);
            this.#setVec3(shader, `uPointLightColors[${index}]`, light.color);
            this.#set1f(shader, `uPointLightIntensities[${index}]`, light.intensity);
            this.#set1f(shader, `uPointLightRanges[${index}]`, light.range);
        });

        this.#set1i(shader, "uSpotLightCount", spots.length);
        spots.forEach((light, index) => {
            this.#setVec3(shader, `uSpotLightPositions[${index}]`, light.position);
            this.#setVec3(shader, `uSpotLightDirections[${index}]`, light.direction);
            this.#setVec3(shader, `uSpotLightColors[${index}]`, light.color);
            this.#set1f(shader, `uSpotLightIntensities[${index}]`, light.intensity);
            this.#set1f(shader, `uSpotLightRanges[${index}]`, light.range);
            this.#set1f(shader, `uSpotLightInnerCos[${index}]`, Math.cos(light.innerAngle));
            this.#set1f(shader, `uSpotLightOuterCos[${index}]`, Math.cos(light.outerAngle));
        });
    }

    #renderShadowPass(scene, camera) {
        const light = scene.GetLights("directional").find(candidate => candidate.castShadow);
        Mat4.identity(this.lightViewProjection);

        if (!light) {
            return { light: null, texture: null, matrix: this.lightViewProjection };
        }

        const shadow = this.#getShadowState(light);
        const matrix = this.#calculateDirectionalLightMatrix(light, camera);
        const gl = this.gl;
        const objects = scene.GetRenderableObjects().filter(mesh => mesh.castShadow !== false);

        gl.bindFramebuffer(gl.FRAMEBUFFER, shadow.framebuffer);
        gl.viewport(0, 0, shadow.size, shadow.size);
        gl.colorMask(false, false, false, false);
        gl.clear(gl.DEPTH_BUFFER_BIT);

        this.shadowShader.Use();
        this.#setMatrix(this.shadowShader, "uLightViewProjection", matrix);

        for (const mesh of objects) {
            const geometry = this.#getGeometryState(mesh.geometry);
            const model = mesh.transform.GetMatrix(Mat4.create());
            this.#setMatrix(this.shadowShader, "uModel", model);
            gl.bindVertexArray(geometry.vao);

            if (geometry.indexed) {
                gl.drawElements(gl.TRIANGLES, geometry.count, geometry.indexType, 0);
            } else {
                gl.drawArrays(gl.TRIANGLES, 0, geometry.count);
            }
        }

        gl.bindVertexArray(null);
        gl.colorMask(true, true, true, true);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        this.lightViewProjection = matrix;
        return { light, texture: shadow.depthTexture, matrix };
    }

    #calculateDirectionalLightMatrix(light, camera) {
        const center = camera.target ?? [0, 0, 0];
        const direction = light.direction ?? [0, -1, 0];
        const distance = light.shadowDistance ?? 16;
        const radius = distance * 0.72;
        const eye = [
            center[0] - direction[0] * distance,
            center[1] - direction[1] * distance,
            center[2] - direction[2] * distance,
        ];
        const up = Math.abs(direction[1]) > 0.92 ? [0, 0, 1] : [0, 1, 0];
        const view = Mat4.create();
        const projection = Mat4.create();
        const result = Mat4.create();

        Mat4.lookAt(view, eye, center, up);
        Mat4.orthographic(projection, -radius, radius, -radius, radius, 0.1, distance * 3);
        Mat4.multiply(result, projection, view);
        return result;
    }

    #getShadowState(light) {
        const cached = this.shadowCache.get(light);
        if (cached && cached.size === light.shadowMapSize) return cached;

        const gl = this.gl;
        const size = light.shadowMapSize ?? 1024;
        const framebuffer = gl.createFramebuffer();
        const depthTexture = gl.createTexture();

        gl.bindTexture(gl.TEXTURE_2D, depthTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, size, size, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, 0);
        gl.drawBuffers([gl.NONE]);
        gl.readBuffer(gl.NONE);

        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            console.warn("Render3D: shadow framebuffer is incomplete; shadows will be disabled.");
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        const state = { framebuffer, depthTexture, size };
        this.shadowCache.set(light, state);
        return state;
    }

    #getGeometryState(geometry) {
        if (!geometry) throw new Error("Render3D mesh requires geometry.");
        const cached = this.geometryCache.get(geometry);
        if (cached) return cached;

        const gl = this.gl;
        geometry.EnsureNormals();
        geometry.EnsureUvs();
        geometry.EnsureTangents();

        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        this.#uploadAttribute(ATTRIBUTE.position, 3, geometry.positions);
        this.#uploadAttribute(ATTRIBUTE.normal, 3, geometry.normals);
        this.#uploadAttribute(ATTRIBUTE.uv, 2, geometry.uvs);
        this.#uploadAttribute(ATTRIBUTE.tangent, 4, geometry.tangents);

        let indexed = false;
        let indexType = gl.UNSIGNED_SHORT;
        let count = geometry.vertexCount;

        if (geometry.indices) {
            const indexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometry.indices, gl.STATIC_DRAW);
            indexed = true;
            count = geometry.indices.length;
            indexType = geometry.indices instanceof Uint32Array ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT;
        }

        gl.bindVertexArray(null);

        const state = { vao, indexed, indexType, count };
        this.geometryCache.set(geometry, state);
        return state;
    }

    #uploadAttribute(location, size, data) {
        const gl = this.gl;
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(location);
        gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
    }

    #bindTexture(shader, unit, samplerName, hasName, textureLike, fallbackTexture) {
        const texture = this.#resolveTexture(textureLike);
        this.#set1i(shader, hasName, texture ? 1 : 0);
        this.#bindTextureObject(shader, unit, samplerName, texture?.EnsureGPU(this.gl, fallbackTexture) ?? fallbackTexture);
    }

    #bindTextureObject(shader, unit, samplerName, texture) {
        const gl = this.gl;
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        this.#set1i(shader, samplerName, unit);
    }

    #resolveTexture(textureLike) {
        if (!textureLike) return null;
        if (textureLike instanceof Texture) return textureLike;
        if (this.textureCache.has(textureLike)) return this.textureCache.get(textureLike);

        const texture = new Texture(textureLike);
        this.textureCache.set(textureLike, texture);
        return texture;
    }

    #setMatrix(shader, name, value) {
        this.gl.uniformMatrix4fv(shader.GetUniform(name), false, value);
    }

    #setVec3(shader, name, value) {
        this.gl.uniform3fv(shader.GetUniform(name), value);
    }

    #setVec4(shader, name, value) {
        this.gl.uniform4fv(shader.GetUniform(name), value);
    }

    #set1f(shader, name, value) {
        this.gl.uniform1f(shader.GetUniform(name), value);
    }

    #set1i(shader, name, value) {
        this.gl.uniform1i(shader.GetUniform(name), value);
    }
}
