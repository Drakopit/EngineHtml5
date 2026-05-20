precision mediump float;
varying highp vec3 vTextureCoord;
uniform samplerCube uSampler;

void main(void) {
    gl_FragColor = textureCube(uSampler, normalize(vTextureCoord));
}