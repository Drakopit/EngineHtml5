/**
 * @doc Class ModelLoader
 * @namespace Graphic
 * @class ModelLoader
 * @author Sugestão para GameForgeJS
 * @summary Carrega modelos 3D no formato GLTF/GLB e os prepara para renderização WebGL.
 * @description Integra-se ao AssetManager existente via QueueModel/GetModel.
 *              Suporta geometria, UVs, normais e texturas embutidas (GLB).
 */

// ============================================================
// 1. MODEL LOADER — Integra ao AssetManager
//    Uso: assets.QueueModel("nave", "./Assets/Models/nave.glb")
// ============================================================

export class ModelLoader {

	/**
	 * Carrega um arquivo GLTF (.gltf + .bin) ou GLB (binário tudo-em-um).
	 * @param {string} url - Caminho para o arquivo .gltf ou .glb
	 * @returns {Promise<ParsedModel>} - Dados prontos para o WebGL
	 */
	static async Load(url) {
		const isGLB = url.toLowerCase().endsWith(".glb");
		return isGLB ? this._loadGLB(url) : this._loadGLTF(url);
	}

	// ----------------------------------------------------------
	// GLTF (JSON + .bin separados)
	// ----------------------------------------------------------
	static async _loadGLTF(url) {
		const baseUrl = url.substring(0, url.lastIndexOf("/") + 1);
		const response = await fetch(url);
		if (!response.ok) throw new Error(`ModelLoader: Falha ao buscar ${url}`);
		const gltf = await response.json();

		// Carrega todos os buffers binários referenciados pelo JSON
		const buffers = await Promise.all(
			gltf.buffers.map(buf => {
				const bufUrl = buf.uri.startsWith("data:")
					? buf.uri
					: baseUrl + buf.uri;
				return fetch(bufUrl).then(r => r.arrayBuffer());
			})
		);

		return this._parse(gltf, buffers);
	}

	// ----------------------------------------------------------
	// GLB (binário com JSON embutido — formato preferido)
	// ----------------------------------------------------------
	static async _loadGLB(url) {
		const response = await fetch(url);
		if (!response.ok) throw new Error(`ModelLoader: Falha ao buscar ${url}`);
		const arrayBuffer = await response.arrayBuffer();
		const view = new DataView(arrayBuffer);

		// Cabeçalho GLB: magic (4), version (4), length (4)
		const magic = view.getUint32(0, true);
		if (magic !== 0x46546C67) throw new Error("ModelLoader: Arquivo GLB inválido.");

		let offset = 12; // Pula o cabeçalho

		let jsonChunk = null;
		let binChunk = null;

		// Lê os chunks: chunk 0 = JSON, chunk 1 = BIN
		while (offset < arrayBuffer.byteLength) {
			const chunkLength = view.getUint32(offset, true);
			const chunkType = view.getUint32(offset + 4, true);
			offset += 8;

			const chunkData = arrayBuffer.slice(offset, offset + chunkLength);
			if (chunkType === 0x4E4F534A) { // "JSON"
				jsonChunk = JSON.parse(new TextDecoder().decode(chunkData));
			} else if (chunkType === 0x004E4942) { // "BIN\0"
				binChunk = chunkData;
			}
			offset += chunkLength;
		}

		if (!jsonChunk) throw new Error("ModelLoader: Chunk JSON não encontrado no GLB.");
		return this._parse(jsonChunk, binChunk ? [binChunk] : []);
	}

	// ----------------------------------------------------------
	// Parse do GLTF — Extrai vértices, UVs, normais e texturas
	// ----------------------------------------------------------
	static _parse(gltf, buffers) {
		const models = [];

		// Itera sobre as meshes do arquivo
		for (const mesh of gltf.meshes) {
			for (const primitive of mesh.primitives) {
				const attrs = primitive.attributes;

				const positions = this._readAccessor(gltf, buffers, attrs.POSITION);
				const uvs = attrs.TEXCOORD_0 != null
					? this._readAccessor(gltf, buffers, attrs.TEXCOORD_0)
					: null;
				const normals = attrs.NORMAL != null
					? this._readAccessor(gltf, buffers, attrs.NORMAL)
					: null;
				const indices = primitive.indices != null
					? this._readAccessor(gltf, buffers, primitive.indices)
					: null;

				// Extrai textura embutida (se existir material)
				let textureImage = null;
				if (primitive.material != null) {
					textureImage = this._extractTexture(gltf, buffers, primitive.material);
				}

				models.push({
					name: mesh.name || "mesh",
					positions,   // Float32Array  — XYZ por vértice
					uvs,         // Float32Array  — UV por vértice (ou null)
					normals,     // Float32Array  — XYZ normal por vértice (ou null)
					indices,     // Uint16Array   — índices dos triângulos (ou null)
					textureImage // HTMLImageElement pronto pra CreateTexture (ou null)
				});
			}
		}

		return models; // Array de ParsedModel
	}

	// ----------------------------------------------------------
	// Lê um Accessor do GLTF e retorna o TypedArray correto
	// ----------------------------------------------------------
	static _readAccessor(gltf, buffers, accessorIndex) {
		const accessor = gltf.accessors[accessorIndex];
		const bufferView = gltf.bufferViews[accessor.bufferView];
		const buffer = buffers[bufferView.buffer];

		const byteOffset = (bufferView.byteOffset || 0) + (accessor.byteOffset || 0);
		const componentCount = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 }[accessor.type];

		// Tipo de componente WebGL → TypedArray
		switch (accessor.componentType) {
			case 5126: return new Float32Array(buffer, byteOffset, accessor.count * componentCount);
			case 5123: return new Uint16Array(buffer, byteOffset, accessor.count * componentCount);
			case 5125: return new Uint32Array(buffer, byteOffset, accessor.count * componentCount);
			case 5121: return new Uint8Array(buffer, byteOffset, accessor.count * componentCount);
			default: throw new Error(`ModelLoader: componentType ${accessor.componentType} não suportado.`);
		}
	}

	// ----------------------------------------------------------
	// Extrai a textura base do material (se embutida no GLB)
	// ----------------------------------------------------------
	static _extractTexture(gltf, buffers, materialIndex) {
		const material = gltf.materials?.[materialIndex];
		const textureIndex = material?.pbrMetallicRoughness?.baseColorTexture?.index;
		if (textureIndex == null) return null;

		const imageIndex = gltf.textures[textureIndex].source;
		const imageInfo = gltf.images[imageIndex];

		if (imageInfo.uri) {
			// Textura externa (GLTF) — retorna a URI para carregar depois
			return { type: "uri", uri: imageInfo.uri };
		}

		if (imageInfo.bufferView != null) {
			// Textura embutida (GLB) — converte o buffer em blob e cria um HTMLImageElement
			const bufferView = gltf.bufferViews[imageInfo.bufferView];
			const buffer = buffers[bufferView.buffer];
			const slice = buffer.slice(bufferView.byteOffset, bufferView.byteOffset + bufferView.byteLength);
			const blob = new Blob([slice], { type: imageInfo.mimeType || "image/png" });
			const url = URL.createObjectURL(blob);

			// Retorna uma Promise<HTMLImageElement> — resolve quando a imagem carregar
			return new Promise((resolve) => {
				const img = new Image();
				img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
				img.src = url;
			});
		}

		return null;
	}
}