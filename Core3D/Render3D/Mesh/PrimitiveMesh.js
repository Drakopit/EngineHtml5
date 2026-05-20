import { Geometry3D } from "./Geometry3D.js";

export class PrimitiveMesh {
    static Cube(size = 1) {
        const half = size / 2;
        const faces = [
            { normal: [0, 0, 1], tangent: [1, 0, 0, 1], corners: [[-half, -half, half], [half, -half, half], [half, half, half], [-half, half, half]] },
            { normal: [0, 0, -1], tangent: [-1, 0, 0, 1], corners: [[half, -half, -half], [-half, -half, -half], [-half, half, -half], [half, half, -half]] },
            { normal: [0, 1, 0], tangent: [1, 0, 0, 1], corners: [[-half, half, half], [half, half, half], [half, half, -half], [-half, half, -half]] },
            { normal: [0, -1, 0], tangent: [1, 0, 0, 1], corners: [[-half, -half, -half], [half, -half, -half], [half, -half, half], [-half, -half, half]] },
            { normal: [1, 0, 0], tangent: [0, 0, -1, 1], corners: [[half, -half, half], [half, -half, -half], [half, half, -half], [half, half, half]] },
            { normal: [-1, 0, 0], tangent: [0, 0, 1, 1], corners: [[-half, -half, -half], [-half, -half, half], [-half, half, half], [-half, half, -half]] },
        ];
        const positions = [];
        const normals = [];
        const uvs = [];
        const tangents = [];
        const indices = [];
        const faceUvs = [[0, 0], [1, 0], [1, 1], [0, 1]];

        faces.forEach((face, faceIndex) => {
            const offset = faceIndex * 4;
            face.corners.forEach((corner, cornerIndex) => {
                positions.push(...corner);
                normals.push(...face.normal);
                uvs.push(...faceUvs[cornerIndex]);
                tangents.push(...face.tangent);
            });
            indices.push(offset, offset + 1, offset + 2, offset, offset + 2, offset + 3);
        });

        return new Geometry3D({ positions, normals, uvs, tangents, indices });
    }

    static Plane(width = 1, depth = 1, { subdivisions = 1 } = {}) {
        const positions = [];
        const normals = [];
        const uvs = [];
        const tangents = [];
        const indices = [];
        const halfWidth = width / 2;
        const halfDepth = depth / 2;
        const steps = Math.max(1, subdivisions);

        for (let z = 0; z <= steps; z++) {
            for (let x = 0; x <= steps; x++) {
                const u = x / steps;
                const v = z / steps;
                positions.push(-halfWidth + width * u, 0, -halfDepth + depth * v);
                normals.push(0, 1, 0);
                uvs.push(u, v);
                tangents.push(1, 0, 0, 1);
            }
        }

        const row = steps + 1;
        for (let z = 0; z < steps; z++) {
            for (let x = 0; x < steps; x++) {
                const a = z * row + x;
                const b = a + 1;
                const c = a + row + 1;
                const d = a + row;
                indices.push(a, b, c, a, c, d);
            }
        }

        return new Geometry3D({ positions, normals, uvs, tangents, indices });
    }

    static Sphere(radius = 1, { widthSegments = 24, heightSegments = 12 } = {}) {
        const positions = [];
        const normals = [];
        const uvs = [];
        const tangents = [];
        const indices = [];
        const width = Math.max(3, widthSegments);
        const height = Math.max(2, heightSegments);

        for (let y = 0; y <= height; y++) {
            const v = y / height;
            const theta = v * Math.PI;
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);

            for (let x = 0; x <= width; x++) {
                const u = x / width;
                const phi = u * Math.PI * 2;
                const sinPhi = Math.sin(phi);
                const cosPhi = Math.cos(phi);
                const nx = cosPhi * sinTheta;
                const ny = cosTheta;
                const nz = sinPhi * sinTheta;

                positions.push(nx * radius, ny * radius, nz * radius);
                normals.push(nx, ny, nz);
                uvs.push(u, 1 - v);
                tangents.push(-sinPhi, 0, cosPhi, 1);
            }
        }

        const row = width + 1;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const a = y * row + x;
                const b = a + 1;
                const c = a + row + 1;
                const d = a + row;
                indices.push(a, b, c, a, c, d);
            }
        }

        return new Geometry3D({ positions, normals, uvs, tangents, indices });
    }

    static Ring(innerRadius = 1, outerRadius = 1.1, { segments = 96 } = {}) {
        const positions = [];
        const normals = [];
        const uvs = [];
        const tangents = [];
        const indices = [];
        const count = Math.max(12, segments);

        for (let i = 0; i <= count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);

            positions.push(cos * innerRadius, 0, sin * innerRadius);
            positions.push(cos * outerRadius, 0, sin * outerRadius);
            normals.push(0, 1, 0, 0, 1, 0);
            uvs.push(0, i / count, 1, i / count);
            tangents.push(1, 0, 0, 1, 1, 0, 0, 1);
        }

        for (let i = 0; i < count; i++) {
            const a = i * 2;
            const b = a + 1;
            const c = a + 3;
            const d = a + 2;
            indices.push(a, b, c, a, c, d);
        }

        return new Geometry3D({ positions, normals, uvs, tangents, indices });
    }
}
