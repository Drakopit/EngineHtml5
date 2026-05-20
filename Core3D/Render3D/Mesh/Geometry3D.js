export class Geometry3D {
    constructor({
        positions = [],
        normals = [],
        uvs = [],
        tangents = [],
        indices = null,
    } = {}) {
        this.positions = positions instanceof Float32Array ? positions : new Float32Array(positions);
        this.normals = normals instanceof Float32Array ? normals : new Float32Array(normals);
        this.uvs = uvs instanceof Float32Array ? uvs : new Float32Array(uvs);
        this.tangents = tangents instanceof Float32Array ? tangents : new Float32Array(tangents);
        this.indices = normalizeIndices(indices);
        this.vertexCount = this.positions.length / 3;
    }

    EnsureNormals(defaultNormal = [0, 1, 0]) {
        if (this.normals.length) return this;

        const normals = [];
        for (let i = 0; i < this.vertexCount; i++) {
            normals.push(defaultNormal[0], defaultNormal[1], defaultNormal[2]);
        }
        this.normals = new Float32Array(normals);
        return this;
    }

    EnsureUvs() {
        if (this.uvs.length) return this;

        const uvs = [];
        for (let i = 0; i < this.vertexCount; i++) {
            uvs.push(0, 0);
        }
        this.uvs = new Float32Array(uvs);
        return this;
    }

    EnsureTangents(defaultTangent = [1, 0, 0, 1]) {
        if (this.tangents.length) return this;

        const tangents = [];
        for (let i = 0; i < this.vertexCount; i++) {
            tangents.push(defaultTangent[0], defaultTangent[1], defaultTangent[2], defaultTangent[3]);
        }
        this.tangents = new Float32Array(tangents);
        return this;
    }
}

function normalizeIndices(indices) {
    if (!indices) return null;
    if (indices instanceof Uint16Array || indices instanceof Uint32Array) return indices;

    const max = Math.max(...indices);
    return max > 65535 ? new Uint32Array(indices) : new Uint16Array(indices);
}
