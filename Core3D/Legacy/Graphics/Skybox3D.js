import { Mat4 } from '../../../CoreCross/Math/Mat4.js';
import { Shapes3D } from "./Shape3D.js"; // <-- Importamos a classe pai
import { AssetManager } from '../../../CoreCross/Assets/AssetManager.js';

export class Skybox3D extends Shapes3D { // <-- Herança aplicada (Clean Architecture)
    constructor(screen, image) {
        super(screen); 
        
        // Mantemos apenas a criação da textura exclusiva
        this.texture = this.createCubeMapFromCross(image);
    }

    initShaders() {
        const vsSource = AssetManager.instance.GetShader("SkyVertexShader");
        const fsSource = AssetManager.instance.GetShader("SkyFragmentShader");

        const vertexShader = this.loadShader(this.gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this.loadShader(this.gl.FRAGMENT_SHADER, fsSource);

        this.shaderProgram = this.gl.createProgram();
        this.gl.attachShader(this.shaderProgram, vertexShader);
        this.gl.attachShader(this.shaderProgram, fragmentShader);
        this.gl.linkProgram(this.shaderProgram);

        this.programInfo = {
            attribLocations: {
                vertexPosition: this.gl.getAttribLocation(this.shaderProgram, 'aVertexPosition'),
            },
            uniformLocations: {
                projectionMatrix: this.gl.getUniformLocation(this.shaderProgram, 'uProjectionMatrix'),
                modelViewMatrix: this.gl.getUniformLocation(this.shaderProgram, 'uModelViewMatrix'),
                uSampler: this.gl.getUniformLocation(this.shaderProgram, 'uSampler'),
            },
        };
    }

    createCubeMapFromCross(image) {
        const texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, texture);

        const faceSize = image.width / 4;
        const canvas = document.createElement("canvas");
        canvas.width = faceSize;
        canvas.height = faceSize;
        const ctx = canvas.getContext("2d");

        const faces = [
            { target: this.gl.TEXTURE_CUBE_MAP_POSITIVE_X, col: 2, row: 1 },
            { target: this.gl.TEXTURE_CUBE_MAP_NEGATIVE_X, col: 0, row: 1 },
            { target: this.gl.TEXTURE_CUBE_MAP_POSITIVE_Y, col: 1, row: 0 },
            { target: this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, col: 1, row: 2 },
            { target: this.gl.TEXTURE_CUBE_MAP_POSITIVE_Z, col: 1, row: 1 },
            { target: this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, col: 3, row: 1 }
        ];

        faces.forEach(face => {
            ctx.clearRect(0, 0, faceSize, faceSize);
            ctx.drawImage(image, face.col * faceSize, face.row * faceSize, faceSize, faceSize, 0, 0, faceSize, faceSize);
            this.gl.texImage2D(face.target, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, canvas);
        });

        this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);

        return texture;
    }

    OnDrawn(camera) {
        this.gl.useProgram(this.shaderProgram);

        // Aproveitamos os Buffers que a classe pai criou!
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.vertexAttribPointer(this.programInfo.attribLocations.vertexPosition, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexPosition);

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.texture);
        this.gl.uniform1i(this.programInfo.uniformLocations.uSampler, 0);

        const viewMatrix = Mat4.clone(camera.viewMatrix);
        viewMatrix[12] = 0;
        viewMatrix[13] = 0;
        viewMatrix[14] = 0;

        const modelMatrix = Mat4.create();
        Mat4.scale(modelMatrix, modelMatrix, [50.0, 50.0, 50.0]);

        const modelViewMatrix = Mat4.create();
        Mat4.multiply(modelViewMatrix, viewMatrix, modelMatrix);

        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.projectionMatrix, false, camera.projectionMatrix);
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);

        this.gl.depthMask(false);
        this.gl.drawElements(this.gl.TRIANGLES, 36, this.gl.UNSIGNED_SHORT, 0);
        this.gl.depthMask(true);
    }
}
