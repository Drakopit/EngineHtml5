attribute vec3 aPosition;
attribute vec2 aTexCoord;
attribute vec3 aNormal;

uniform mat4 uProjection;
uniform mat4 uModelView;
uniform mat4 uNormalMatrix;

varying vec2 vTexCoord;
varying vec3 vNormal;

void main() {
    vTexCoord = aTexCoord;
    vNormal   = normalize(vec3(uNormalMatrix * vec4(aNormal, 0.0)));
    gl_Position = uProjection * uModelView * vec4(aPosition, 1.0);
}