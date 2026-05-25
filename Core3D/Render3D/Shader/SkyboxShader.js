export const SKYBOX_VERTEX_SHADER = `#version 300 es
precision highp float;

layout(location = 0) in vec3 aPosition;

uniform mat4 uView;
uniform mat4 uProjection;

out vec3 vDirection;

void main() {
    vDirection = aPosition;
    mat4 rotationView = mat4(mat3(uView));
    vec4 position = uProjection * rotationView * vec4(aPosition, 1.0);
    gl_Position = position.xyww;
}`;

export const SKYBOX_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec3 vDirection;
out vec4 outColor;

uniform samplerCube uSkybox;

void main() {
    outColor = texture(uSkybox, normalize(vDirection));
}`;
