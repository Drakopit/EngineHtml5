export const CELESTIAL_VERTEX_SHADER = `#version 300 es
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
}`;

export const CELESTIAL_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec3 vWorldPosition;
in vec3 vNormal;
in vec2 vUv;

out vec4 outColor;

uniform vec3 uCameraPosition;
uniform vec3 uLightPosition;
uniform vec3 uBaseColor;
uniform vec3 uSecondaryColor;
uniform vec3 uAtmosphereColor;
uniform vec3 uNightColor;
uniform vec3 uEmissiveColor;
uniform float uRoughness;
uniform float uSeed;
uniform float uCloudStrength;
uniform float uAtmosphereStrength;
uniform float uEmissiveStrength;
uniform float uTime;

float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 5; i++) {
        value += amplitude * noise(p);
        p *= 2.03;
        amplitude *= 0.5;
    }
    return value;
}

void main() {
    vec3 normal = normalize(vNormal);
    vec3 lightDirection = normalize(uLightPosition - vWorldPosition);
    vec3 viewDirection = normalize(uCameraPosition - vWorldPosition);

    float day = smoothstep(-0.2, 0.95, dot(normal, lightDirection));
    float rim = pow(1.0 - max(dot(normal, viewDirection), 0.0), 2.4);

    vec2 movingUv = vUv + vec2(uTime * 0.006, 0.0);
    float bands = sin((vUv.y + uSeed * 0.07) * 42.0 + fbm(movingUv * 4.0 + uSeed) * 4.0);
    float terrain = fbm(movingUv * 6.0 + uSeed * 5.31);
    float clouds = smoothstep(0.48, 0.86, fbm(movingUv * 10.0 + vec2(uSeed * 2.0, uTime * 0.025)));
    float mask = clamp(terrain * 0.78 + bands * 0.22, 0.0, 1.0);

    vec3 surface = mix(uBaseColor, uSecondaryColor, mask);
    surface = mix(surface, vec3(1.0), clouds * uCloudStrength);
    vec3 lit = mix(uNightColor, surface, day);

    float specular = pow(max(dot(reflect(-lightDirection, normal), viewDirection), 0.0), mix(72.0, 8.0, uRoughness));
    lit += vec3(specular) * (1.0 - uRoughness) * day * 0.35;
    lit += uAtmosphereColor * rim * uAtmosphereStrength;
    lit += uEmissiveColor * uEmissiveStrength;

    outColor = vec4(lit, 1.0);
}`;
