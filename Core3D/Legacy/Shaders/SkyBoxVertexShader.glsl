attribute vec4 aVertexPosition;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
varying highp vec3 vTextureCoord;

void main(void) {
    vTextureCoord = aVertexPosition.xyz;
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
}