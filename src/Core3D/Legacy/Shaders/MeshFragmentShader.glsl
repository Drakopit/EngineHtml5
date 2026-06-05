precision mediump float;

varying vec2 vTexCoord;
varying vec3 vNormal;

uniform sampler2D uSampler;
uniform vec3 uLightDir;
uniform vec3 uLightColor;
uniform vec4 uBaseColor;
uniform float uHasTexture;
uniform float uLightIntensity;
uniform float uAmbientStrength;

void main() {
    vec3 lightDir = normalize(uLightDir);
    float diffuse = max(dot(normalize(vNormal), lightDir), 0.0);
    float light = clamp(uAmbientStrength + diffuse * uLightIntensity, 0.0, 1.5);

    vec4 color = (uHasTexture > 0.5)
        ? texture2D(uSampler, vTexCoord)
        : uBaseColor;

    gl_FragColor = vec4(color.rgb * uLightColor * light, color.a);
}
