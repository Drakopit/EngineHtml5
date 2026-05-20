export class OBJLoader {
    static async Load(url) {
        const text = await fetch(url).then(r => r.text());
        const positions = [], uvs = [], normals = [], indices = [];
        const verts = [], uvList = [], normList = [];

        for (const line of text.split("\n")) {
            const parts = line.trim().split(/\s+/);
            if (parts[0] === "v") verts.push(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]));
            if (parts[0] === "vt") uvList.push(parseFloat(parts[1]), parseFloat(parts[2]));
            if (parts[0] === "vn") normList.push(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]));
            if (parts[0] === "f") {
                // Cada face tem 3+ tokens no formato: posição/uv/normal
                const faceVerts = parts.slice(1).map(token => token.split("/").map(Number));
                for (const [vi, ti, ni] of faceVerts) {
                    positions.push(verts[(vi - 1) * 3], verts[(vi - 1) * 3 + 1], verts[(vi - 1) * 3 + 2]);
                    if (ti) uvs.push(uvList[(ti - 1) * 2], uvList[(ti - 1) * 2 + 1]);
                    if (ni) normals.push(normList[(ni - 1) * 3], normList[(ni - 1) * 3 + 1], normList[(ni - 1) * 3 + 2]);
                    indices.push(indices.length);
                }
            }
        }

        return [{
            name: url.split("/").pop(),
            positions: new Float32Array(positions),
            uvs: uvs.length ? new Float32Array(uvs) : null,
            normals: normals.length ? new Float32Array(normals) : null,
            indices: new Uint16Array(indices),
            textureImage: null // .obj não embute textura — carregue separado pelo AssetManager
        }];
    }
}