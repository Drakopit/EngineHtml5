export const UNLIT_VERTEX_SHADER = `#version 300 es
precision highp float;

layout(location = 0) in vec3 aPosition;
layout(location = 2) in vec2 aUv;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;

out vec2 vUv;

void main() {
    vUv = aUv;
    gl_Position = uProjection * uView * uModel * vec4(aPosition, 1.0);
}`;

export const UNLIT_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 outColor;

uniform vec4 uAlbedoColor;
uniform sampler2D uAlbedoMap;
uniform bool uHasAlbedoMap;

void main() {
    vec4 albedo = uHasAlbedoMap ? texture(uAlbedoMap, vUv) : vec4(1.0);
    outColor = uAlbedoColor * albedo;
}`;
