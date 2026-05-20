export class Shader {
    constructor(gl, vertexSource, fragmentSource, label = "Shader") {
        this.gl = gl;
        this.label = label;
        this.program = this.#createProgram(vertexSource, fragmentSource);
        this.uniforms = new Map();
    }

    Use() {
        this.gl.useProgram(this.program);
    }

    GetUniform(name) {
        if (!this.uniforms.has(name)) {
            this.uniforms.set(name, this.gl.getUniformLocation(this.program, name));
        }
        return this.uniforms.get(name);
    }

    Dispose() {
        this.gl.deleteProgram(this.program);
    }

    #createProgram(vertexSource, fragmentSource) {
        const gl = this.gl;
        const vertex = this.#compile(gl.VERTEX_SHADER, vertexSource);
        const fragment = this.#compile(gl.FRAGMENT_SHADER, fragmentSource);
        const program = gl.createProgram();

        gl.attachShader(program, vertex);
        gl.attachShader(program, fragment);
        gl.linkProgram(program);
        gl.deleteShader(vertex);
        gl.deleteShader(fragment);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const info = gl.getProgramInfoLog(program);
            gl.deleteProgram(program);
            throw new Error(`${this.label}: program link failed: ${info}`);
        }

        return program;
    }

    #compile(type, source) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const info = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw new Error(`${this.label}: shader compile failed: ${info}`);
        }

        return shader;
    }
}
