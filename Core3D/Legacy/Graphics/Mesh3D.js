// ============================================================
// 2. MESH3D — Renderizador genérico (substitui DrawCube)
//    Recebe qualquer ParsedModel e envia para a GPU
// ============================================================

import { Mat4 } from '../../../CoreCross/Math/Mat4.js';
import { AssetManager } from '../../../CoreCross/Assets/AssetManager.js';
import { Deprecation } from '../../../CoreCross/Deprecation.js';

/** @deprecated Use `Mesh` with `ModelMeshFactory` from `Core3D/index.js`. */
export class Mesh3D {
	/**
	 * @param {WebGLRenderingContext} gl - Contexto WebGL da Screen3D
	 * @param {object} parsedModel       - Resultado de ModelLoader.Load()[n]
	 */
	constructor(gl, parsedModel) {
		Deprecation.WarnOnce("Mesh3D", "Mesh + ModelMeshFactory");
		this.gl = gl;
		this.model = parsedModel;
		this._buffers = {};
		this.texture = null;

		this.gl.getExtension('OES_element_index_uint');


		this._initShaders();
		this._uploadToGPU();
		this._loadTexture();
	}

	// ----------------------------------------------------------
	// Shaders — Adiciona suporte a normais além de posição e UV
	// ----------------------------------------------------------
	_initShaders() {
		const gl = this.gl;

		const vsSource = AssetManager.instance.GetShader("MeshVertexShader");

		// Lighting simples: luz ambiente + direcional
		const fsSource = AssetManager.instance.GetShader("MeshFragmentShader");

		const vert = this._compile(gl.VERTEX_SHADER, vsSource);
		const frag = this._compile(gl.FRAGMENT_SHADER, fsSource);

		this.program = gl.createProgram();
		gl.attachShader(this.program, vert);
		gl.attachShader(this.program, frag);
		gl.linkProgram(this.program);

		if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
			throw new Error("Mesh3D: Falha no link do shader: " + gl.getProgramInfoLog(this.program));
		}

		// Cache de locations para evitar getAttribLocation no loop de render
		this.locs = {
			aPosition: gl.getAttribLocation(this.program, "aPosition"),
			aTexCoord: gl.getAttribLocation(this.program, "aTexCoord"),
			aNormal: gl.getAttribLocation(this.program, "aNormal"),
			uProjection: gl.getUniformLocation(this.program, "uProjection"),
			uModelView: gl.getUniformLocation(this.program, "uModelView"),
			uNormalMatrix: gl.getUniformLocation(this.program, "uNormalMatrix"),
			uSampler: gl.getUniformLocation(this.program, "uSampler"),
			uLightDir: gl.getUniformLocation(this.program, "uLightDir"),
			uLightColor: gl.getUniformLocation(this.program, "uLightColor"),
			uBaseColor: gl.getUniformLocation(this.program, "uBaseColor"),
			uHasTexture: gl.getUniformLocation(this.program, "uHasTexture"),
			uLightIntensity: gl.getUniformLocation(this.program, "uLightIntensity"),
			uAmbientStrength: gl.getUniformLocation(this.program, "uAmbientStrength"),
		};
	}

	_compile(type, source) {
		const gl = this.gl;
		const shader = gl.createShader(type);
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			throw new Error("Mesh3D shader error: " + gl.getShaderInfoLog(shader));
		}
		return shader;
	}

	// ----------------------------------------------------------
	// Envia os dados do modelo para a GPU (uma única vez)
	// ----------------------------------------------------------
	_uploadToGPU() {
		const gl = this.gl;
		const m = this.model;

		this._buffers.position = this._createBuffer(gl.ARRAY_BUFFER, m.positions);

		if (m.uvs) {
			this._buffers.uv = this._createBuffer(gl.ARRAY_BUFFER, m.uvs);
		}
		if (m.normals) {
			this._buffers.normal = this._createBuffer(gl.ARRAY_BUFFER, m.normals);
		}
		if (m.indices) {
			this._buffers.index = this._createBuffer(gl.ELEMENT_ARRAY_BUFFER, m.indices);
			this._indexCount = m.indices.length;
			this._indexType = m.indices instanceof Uint32Array ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT;
		} else {
			this._vertexCount = m.positions.length / 3;
		}
	}

	_createBuffer(target, data) {
		const buf = this.gl.createBuffer();
		this.gl.bindBuffer(target, buf);
		this.gl.bufferData(target, data, this.gl.STATIC_DRAW);
		return buf;
	}

	// ----------------------------------------------------------
	// Carrega textura do modelo (embutida no GLB ou URI externa)
	// ----------------------------------------------------------
	async _loadTexture() {
		const gl = this.gl;
		const raw = this.model.textureImage;
		if (!raw) return;

		// Se for uma Promise (textura GLB embutida), aguarda
		const img = (raw instanceof Promise) ? await raw : raw;

		if (img instanceof HTMLImageElement) {
			this.texture = gl.createTexture();
			gl.bindTexture(gl.TEXTURE_2D, this.texture);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.generateMipmap(gl.TEXTURE_2D);
		}
	}

	// ----------------------------------------------------------
	// Draw — chamado a cada frame pelo GameObject3D.OnDrawn()
	// ----------------------------------------------------------
	/**
	 * @param {Transform3D} transform - transform.position, rotation, scale
	 * @param {Camera3D}    camera    - camera.viewMatrix, camera.projectionMatrix
	 * @param {object}      options   - { lightDir, baseColor }
	 */
	Draw(transform, camera, options = {}) {
		const gl = this.gl;
		const locs = this.locs;
		const lighting = options.lighting?.GetUniforms ? options.lighting.GetUniforms() : options;
		const lightDir = lighting.direction ?? options.lightDir ?? [0.5, 1.0, 0.75];
		const lightColor = lighting.color ?? [1.0, 1.0, 1.0];
		const lightIntensity = lighting.intensity ?? 0.7;
		const ambientStrength = lighting.ambientStrength ?? 0.3;
		const baseColor = options.baseColor ?? [0.8, 0.8, 0.8, 1.0];

		gl.useProgram(this.program);

		// --- Posições ---
		gl.bindBuffer(gl.ARRAY_BUFFER, this._buffers.position);
		gl.vertexAttribPointer(locs.aPosition, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(locs.aPosition);

		// --- UVs ---
		if (this._buffers.uv) {
			gl.bindBuffer(gl.ARRAY_BUFFER, this._buffers.uv);
			gl.vertexAttribPointer(locs.aTexCoord, 2, gl.FLOAT, false, 0, 0);
			gl.enableVertexAttribArray(locs.aTexCoord);
		}

		// --- Normais ---
		if (this._buffers.normal) {
			gl.bindBuffer(gl.ARRAY_BUFFER, this._buffers.normal);
			gl.vertexAttribPointer(locs.aNormal, 3, gl.FLOAT, false, 0, 0);
			gl.enableVertexAttribArray(locs.aNormal);
		}

		// --- Textura ---
		gl.uniform1f(locs.uHasTexture, this.texture ? 1.0 : 0.0);
		if (this.texture) {
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, this.texture);
			gl.uniform1i(locs.uSampler, 0);
		}
		gl.uniform4fv(locs.uBaseColor, baseColor);
		gl.uniform3fv(locs.uLightDir, lightDir);
		gl.uniform3fv(locs.uLightColor, lightColor);
		gl.uniform1f(locs.uLightIntensity, lightIntensity);
		gl.uniform1f(locs.uAmbientStrength, ambientStrength);

		// --- Matrizes ---
		const modelMatrix = Mat4.create();
		Mat4.translate(modelMatrix, modelMatrix, transform.position);
		Mat4.rotateX(modelMatrix, modelMatrix, transform.rotation.x);
		Mat4.rotateY(modelMatrix, modelMatrix, transform.rotation.y);
		Mat4.rotateZ(modelMatrix, modelMatrix, transform.rotation.z);
		Mat4.scale(modelMatrix, modelMatrix, transform.scale);

		const modelViewMatrix = Mat4.create();
		Mat4.multiply(modelViewMatrix, camera.viewMatrix, modelMatrix);

		// Normal matrix: inversa-transposta da model matrix (corrige distorção de normais com scale)
		const normalMatrix = Mat4.create();
		if (Mat4.invert(normalMatrix, modelMatrix)) {
			Mat4.transpose(normalMatrix, normalMatrix);
		}

		gl.uniformMatrix4fv(locs.uProjection, false, camera.projectionMatrix);
		gl.uniformMatrix4fv(locs.uModelView, false, modelViewMatrix);
		gl.uniformMatrix4fv(locs.uNormalMatrix, false, normalMatrix);

		// --- Draw Call ---
		if (this._buffers.index) {
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._buffers.index);
			gl.drawElements(gl.TRIANGLES, this._indexCount, this._indexType, 0);
		} else {
			gl.drawArrays(gl.TRIANGLES, 0, this._vertexCount);
		}
	}

	/**
	 * Libera todos os buffers e texturas da GPU.
	 * Chame em OnExit() do Level para evitar memory leak.
	 */
	Dispose() {
		const gl = this.gl;
		Object.values(this._buffers).forEach(buf => gl.deleteBuffer(buf));
		if (this.texture) gl.deleteTexture(this.texture);
		gl.deleteProgram(this.program);
	}
}
