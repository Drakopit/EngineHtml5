import { Mat4 } from '../../CoreCross/Math/Mat4.js';
import { AssetManager } from '../../CoreCross/Assets/AssetManager.js';

export class Shapes3D {
    constructor(screen) {
        this.gl = screen.Context;
        this.screen = screen;
        this.programInfo = {};
        this.textures = [];

        this.initShaders();
        this.initBuffers();
        this.defaultTexture = this.CreateSolidTexture([255, 255, 255, 255]);
    }

    initShaders() {
        const vsSource = AssetManager.instance.GetShader("vertexShader");
        const fsSource = AssetManager.instance.GetShader("fragmentShader");

        const vertexShader = this.loadShader(this.gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this.loadShader(this.gl.FRAGMENT_SHADER, fsSource);

        this.shaderProgram = this.gl.createProgram();
        this.gl.attachShader(this.shaderProgram, vertexShader);
        this.gl.attachShader(this.shaderProgram, fragmentShader);
        this.gl.linkProgram(this.shaderProgram);

        if (!this.gl.getProgramParameter(this.shaderProgram, this.gl.LINK_STATUS)) {
            throw new Error("Shapes3D shader link error: " + this.gl.getProgramInfoLog(this.shaderProgram));
        }

        this.programInfo = {
            attribLocations: {
                vertexPosition: this.gl.getAttribLocation(this.shaderProgram, 'aVertexPosition'),
                textureCoord: this.gl.getAttribLocation(this.shaderProgram, 'aTextureCoord'),
                vertexNormal: this.gl.getAttribLocation(this.shaderProgram, 'aVertexNormal'),
            },
            uniformLocations: {
                projectionMatrix: this.gl.getUniformLocation(this.shaderProgram, 'uProjectionMatrix'),
                modelViewMatrix: this.gl.getUniformLocation(this.shaderProgram, 'uModelViewMatrix'),
                normalMatrix: this.gl.getUniformLocation(this.shaderProgram, 'uNormalMatrix'),
                uSampler: this.gl.getUniformLocation(this.shaderProgram, 'uSampler'),
                lightDirection: this.gl.getUniformLocation(this.shaderProgram, 'uLightDirection'),
                lightColor: this.gl.getUniformLocation(this.shaderProgram, 'uLightColor'),
                lightIntensity: this.gl.getUniformLocation(this.shaderProgram, 'uLightIntensity'),
                ambientStrength: this.gl.getUniformLocation(this.shaderProgram, 'uAmbientStrength'),
            },
        };
    }

    loadShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source || "");
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            const typeName = type === this.gl.VERTEX_SHADER ? "vertex" : "fragment";
            const info = this.gl.getShaderInfoLog(shader);
            this.gl.deleteShader(shader);
            throw new Error(`Shapes3D ${typeName} shader error: ${info}`);
        }

        return shader;
    }

    initBuffers() {
        const positions = [
            -1.0, -1.0,  1.0,    1.0, -1.0,  1.0,    1.0,  1.0,  1.0,   -1.0,  1.0,  1.0,
            -1.0, -1.0, -1.0,   -1.0,  1.0, -1.0,    1.0,  1.0, -1.0,    1.0, -1.0, -1.0,
            -1.0,  1.0, -1.0,   -1.0,  1.0,  1.0,    1.0,  1.0,  1.0,    1.0,  1.0, -1.0,
            -1.0, -1.0, -1.0,    1.0, -1.0, -1.0,    1.0, -1.0,  1.0,   -1.0, -1.0,  1.0,
             1.0, -1.0, -1.0,    1.0,  1.0, -1.0,    1.0,  1.0,  1.0,    1.0, -1.0,  1.0,
            -1.0, -1.0, -1.0,   -1.0, -1.0,  1.0,   -1.0,  1.0,  1.0,   -1.0,  1.0, -1.0,
        ];
        this.positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);

        const textureCoordinates = [
            0.0, 0.0,  1.0, 0.0,  1.0, 1.0,  0.0, 1.0,
            0.0, 0.0,  1.0, 0.0,  1.0, 1.0,  0.0, 1.0,
            0.0, 0.0,  1.0, 0.0,  1.0, 1.0,  0.0, 1.0,
            0.0, 0.0,  1.0, 0.0,  1.0, 1.0,  0.0, 1.0,
            0.0, 0.0,  1.0, 0.0,  1.0, 1.0,  0.0, 1.0,
            0.0, 0.0,  1.0, 0.0,  1.0, 1.0,  0.0, 1.0,
        ];
        this.textureCoordBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.textureCoordBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), this.gl.STATIC_DRAW);

        const normals = [
             0.0,  0.0,  1.0,    0.0,  0.0,  1.0,    0.0,  0.0,  1.0,    0.0,  0.0,  1.0,
             0.0,  0.0, -1.0,    0.0,  0.0, -1.0,    0.0,  0.0, -1.0,    0.0,  0.0, -1.0,
             0.0,  1.0,  0.0,    0.0,  1.0,  0.0,    0.0,  1.0,  0.0,    0.0,  1.0,  0.0,
             0.0, -1.0,  0.0,    0.0, -1.0,  0.0,    0.0, -1.0,  0.0,    0.0, -1.0,  0.0,
             1.0,  0.0,  0.0,    1.0,  0.0,  0.0,    1.0,  0.0,  0.0,    1.0,  0.0,  0.0,
            -1.0,  0.0,  0.0,   -1.0,  0.0,  0.0,   -1.0,  0.0,  0.0,   -1.0,  0.0,  0.0,
        ];
        this.normalBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normalBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(normals), this.gl.STATIC_DRAW);

        const indices = [
            0,  1,  2,      0,  2,  3,
            4,  5,  6,      4,  6,  7,
            8,  9,  10,     8,  10, 11,
            12, 13, 14,     12, 14, 15,
            16, 17, 18,     16, 18, 19,
            20, 21, 22,     20, 22, 23,
        ];
        this.indexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), this.gl.STATIC_DRAW);
    }

    CreateTexture(imageElement) {
        const texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, imageElement);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);

        this.textures.push(texture);
        return texture;
    }

    CreateSolidTexture(color) {
        const texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.texImage2D(
            this.gl.TEXTURE_2D,
            0,
            this.gl.RGBA,
            1,
            1,
            0,
            this.gl.RGBA,
            this.gl.UNSIGNED_BYTE,
            new Uint8Array(color),
        );
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.textures.push(texture);
        return texture;
    }

    DrawCube(position, rotation, scale, camera, webglTexture, lighting = null) {
        this.gl.useProgram(this.shaderProgram);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.vertexAttribPointer(this.programInfo.attribLocations.vertexPosition, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexPosition);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.textureCoordBuffer);
        this.gl.vertexAttribPointer(this.programInfo.attribLocations.textureCoord, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.programInfo.attribLocations.textureCoord);

        if (this.programInfo.attribLocations.vertexNormal >= 0) {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normalBuffer);
            this.gl.vertexAttribPointer(this.programInfo.attribLocations.vertexNormal, 3, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexNormal);
        }

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, webglTexture || this.defaultTexture);
        this.gl.uniform1i(this.programInfo.uniformLocations.uSampler, 0);

        const modelMatrix = Mat4.create();
        Mat4.translate(modelMatrix, modelMatrix, position);
        Mat4.rotate(modelMatrix, modelMatrix, rotation.x, [1, 0, 0]);
        Mat4.rotate(modelMatrix, modelMatrix, rotation.y, [0, 1, 0]);
        Mat4.rotate(modelMatrix, modelMatrix, rotation.z, [0, 0, 1]);
        Mat4.scale(modelMatrix, modelMatrix, scale);

        const modelViewMatrix = Mat4.create();
        Mat4.multiply(modelViewMatrix, camera.viewMatrix, modelMatrix);

        const normalMatrix = Mat4.create();
        if (Mat4.invert(normalMatrix, modelMatrix)) {
            Mat4.transpose(normalMatrix, normalMatrix);
        }

        const light = lighting?.GetUniforms ? lighting.GetUniforms() : (lighting || {});
        const lightDirection = light.direction ?? [0.5, 1.0, 0.75];
        const lightColor = light.color ?? [1.0, 1.0, 1.0];
        const lightIntensity = light.intensity ?? 0.7;
        const ambientStrength = light.ambientStrength ?? 0.3;

        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.projectionMatrix, false, camera.projectionMatrix);
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.normalMatrix, false, normalMatrix);
        this.gl.uniform3fv(this.programInfo.uniformLocations.lightDirection, lightDirection);
        this.gl.uniform3fv(this.programInfo.uniformLocations.lightColor, lightColor);
        this.gl.uniform1f(this.programInfo.uniformLocations.lightIntensity, lightIntensity);
        this.gl.uniform1f(this.programInfo.uniformLocations.ambientStrength, ambientStrength);

        this.gl.drawElements(this.gl.TRIANGLES, 36, this.gl.UNSIGNED_SHORT, 0);
    }

    Dispose() {
        [
            this.positionBuffer,
            this.textureCoordBuffer,
            this.normalBuffer,
            this.indexBuffer,
        ].forEach(buffer => {
            if (buffer) this.gl.deleteBuffer(buffer);
        });

        this.textures.forEach(texture => {
            if (texture) this.gl.deleteTexture(texture);
        });
        this.textures = [];

        if (this.shaderProgram) {
            this.gl.deleteProgram(this.shaderProgram);
        }
    }
}
