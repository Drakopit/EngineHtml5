attribute vec4 aVertexPosition;
attribute vec2 aTextureCoord;
attribute vec3 aVertexNormal;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uNormalMatrix;

varying highp vec2 vTextureCoord;
varying highp vec3 vNormal;

void main(void) {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    vTextureCoord = aTextureCoord;
    vNormal = normalize(vec3(uNormalMatrix * vec4(aVertexNormal, 0.0)));
}
