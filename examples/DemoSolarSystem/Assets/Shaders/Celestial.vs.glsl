#version 300 es
precision highp float;

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec2 aUv;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;
uniform mat4 uNormalMatrix;

out vec3 vWorldPosition;
out vec3 vNormal;
out vec2 vUv;

void main() {
    vec4 worldPosition = uModel * vec4(aPosition, 1.0);
    vWorldPosition = worldPosition.xyz;
    vNormal = normalize(mat3(uNormalMatrix) * aNormal);
    vUv = aUv;
    gl_Position = uProjection * uView * worldPosition;
}
