export const STANDARD_VERTEX_SHADER = `#version 300 es
precision highp float;

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec2 aUv;
layout(location = 3) in vec4 aTangent;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;
uniform mat4 uNormalMatrix;
uniform mat4 uLightViewProjection;

out vec3 vWorldPosition;
out vec3 vNormal;
out vec2 vUv;
out mat3 vTbn;
out vec4 vShadowCoord;

void main() {
    vec4 worldPosition = uModel * vec4(aPosition, 1.0);
    vec3 normal = normalize(mat3(uNormalMatrix) * aNormal);
    vec3 tangent = normalize(mat3(uModel) * aTangent.xyz);
    tangent = normalize(tangent - normal * dot(normal, tangent));
    vec3 bitangent = cross(normal, tangent) * aTangent.w;

    vWorldPosition = worldPosition.xyz;
    vNormal = normal;
    vUv = aUv;
    vTbn = mat3(tangent, bitangent, normal);
    vShadowCoord = uLightViewProjection * worldPosition;
    gl_Position = uProjection * uView * worldPosition;
}`;

export const STANDARD_FRAGMENT_SHADER = `#version 300 es
precision highp float;

#define MAX_POINT_LIGHTS 4
#define MAX_SPOT_LIGHTS 2

in vec3 vWorldPosition;
in vec3 vNormal;
in vec2 vUv;
in mat3 vTbn;
in vec4 vShadowCoord;

out vec4 outColor;

uniform vec3 uCameraPosition;
uniform vec4 uAlbedoColor;
uniform vec3 uEmissiveColor;
uniform float uRoughness;
uniform float uMetallic;

uniform sampler2D uAlbedoMap;
uniform sampler2D uNormalMap;
uniform sampler2D uRoughnessMap;
uniform sampler2D uAoMap;
uniform sampler2D uEmissiveMap;
uniform sampler2D uShadowMap;

uniform bool uHasAlbedoMap;
uniform bool uHasNormalMap;
uniform bool uHasRoughnessMap;
uniform bool uHasAoMap;
uniform bool uHasEmissiveMap;
uniform bool uUseShadowMap;

uniform vec3 uAmbientColor;
uniform float uAmbientIntensity;
uniform vec3 uHemisphereSkyColor;
uniform vec3 uHemisphereGroundColor;
uniform float uHemisphereIntensity;

uniform bool uHasDirectionalLight;
uniform vec3 uDirectionalDirection;
uniform vec3 uDirectionalColor;
uniform float uDirectionalIntensity;
uniform float uShadowBias;
uniform float uShadowStrength;

uniform int uPointLightCount;
uniform vec3 uPointLightPositions[MAX_POINT_LIGHTS];
uniform vec3 uPointLightColors[MAX_POINT_LIGHTS];
uniform float uPointLightIntensities[MAX_POINT_LIGHTS];
uniform float uPointLightRanges[MAX_POINT_LIGHTS];

uniform int uSpotLightCount;
uniform vec3 uSpotLightPositions[MAX_SPOT_LIGHTS];
uniform vec3 uSpotLightDirections[MAX_SPOT_LIGHTS];
uniform vec3 uSpotLightColors[MAX_SPOT_LIGHTS];
uniform float uSpotLightIntensities[MAX_SPOT_LIGHTS];
uniform float uSpotLightRanges[MAX_SPOT_LIGHTS];
uniform float uSpotLightInnerCos[MAX_SPOT_LIGHTS];
uniform float uSpotLightOuterCos[MAX_SPOT_LIGHTS];

float readShadow() {
    if (!uUseShadowMap) {
        return 1.0;
    }

    vec3 projection = vShadowCoord.xyz / vShadowCoord.w;
    projection = projection * 0.5 + 0.5;

    if (projection.x < 0.0 || projection.x > 1.0 ||
        projection.y < 0.0 || projection.y > 1.0 ||
        projection.z < 0.0 || projection.z > 1.0) {
        return 1.0;
    }

    vec2 texelSize = 1.0 / vec2(textureSize(uShadowMap, 0));
    float visibility = 0.0;

    for (int x = -1; x <= 1; x++) {
        for (int y = -1; y <= 1; y++) {
            float closestDepth = texture(uShadowMap, projection.xy + vec2(x, y) * texelSize).r;
            visibility += projection.z - uShadowBias > closestDepth ? 0.0 : 1.0;
        }
    }

    visibility /= 9.0;
    return mix(1.0 - uShadowStrength, 1.0, visibility);
}

vec3 applyLight(vec3 lightDirection, vec3 lightColor, float intensity, vec3 normal, vec3 viewDirection, vec3 albedo, float roughness, float metallic) {
    float diffuseAmount = max(dot(normal, lightDirection), 0.0);
    vec3 diffuse = albedo * lightColor * diffuseAmount * intensity;

    vec3 halfVector = normalize(lightDirection + viewDirection);
    float specularPower = mix(96.0, 12.0, clamp(roughness, 0.0, 1.0));
    float specularAmount = pow(max(dot(normal, halfVector), 0.0), specularPower) * (1.0 - roughness);
    vec3 specularColor = mix(vec3(0.04), albedo, clamp(metallic, 0.0, 1.0));
    vec3 specular = specularColor * lightColor * specularAmount * intensity;

    return diffuse + specular;
}

void main() {
    vec4 albedoSample = uHasAlbedoMap ? texture(uAlbedoMap, vUv) : vec4(1.0);
    vec4 baseColor = uAlbedoColor * albedoSample;

    vec3 normal = normalize(vNormal);
    if (uHasNormalMap) {
        vec3 mapNormal = texture(uNormalMap, vUv).xyz * 2.0 - 1.0;
        normal = normalize(vTbn * mapNormal);
    }

    float roughness = clamp(uRoughness, 0.02, 1.0);
    if (uHasRoughnessMap) {
        roughness *= texture(uRoughnessMap, vUv).r;
    }

    float ao = uHasAoMap ? texture(uAoMap, vUv).r : 1.0;
    vec3 viewDirection = normalize(uCameraPosition - vWorldPosition);
    vec3 litColor = baseColor.rgb * uAmbientColor * uAmbientIntensity * ao;

    float hemiMix = normal.y * 0.5 + 0.5;
    vec3 hemisphere = mix(uHemisphereGroundColor, uHemisphereSkyColor, hemiMix);
    litColor += baseColor.rgb * hemisphere * uHemisphereIntensity * ao;

    if (uHasDirectionalLight) {
        vec3 lightDirection = normalize(-uDirectionalDirection);
        litColor += applyLight(
            lightDirection,
            uDirectionalColor,
            uDirectionalIntensity * readShadow(),
            normal,
            viewDirection,
            baseColor.rgb,
            roughness,
            uMetallic
        );
    }

    for (int i = 0; i < MAX_POINT_LIGHTS; i++) {
        if (i >= uPointLightCount) break;
        vec3 toLight = uPointLightPositions[i] - vWorldPosition;
        float distanceToLight = length(toLight);
        vec3 lightDirection = toLight / max(distanceToLight, 0.0001);
        float attenuation = clamp(1.0 - distanceToLight / uPointLightRanges[i], 0.0, 1.0);
        attenuation *= attenuation;
        litColor += applyLight(
            lightDirection,
            uPointLightColors[i],
            uPointLightIntensities[i] * attenuation,
            normal,
            viewDirection,
            baseColor.rgb,
            roughness,
            uMetallic
        );
    }

    for (int i = 0; i < MAX_SPOT_LIGHTS; i++) {
        if (i >= uSpotLightCount) break;
        vec3 toLight = uSpotLightPositions[i] - vWorldPosition;
        float distanceToLight = length(toLight);
        vec3 lightDirection = toLight / max(distanceToLight, 0.0001);
        float cone = dot(normalize(-uSpotLightDirections[i]), lightDirection);
        float coneFade = smoothstep(uSpotLightOuterCos[i], uSpotLightInnerCos[i], cone);
        float attenuation = clamp(1.0 - distanceToLight / uSpotLightRanges[i], 0.0, 1.0);
        attenuation *= attenuation * coneFade;
        litColor += applyLight(
            lightDirection,
            uSpotLightColors[i],
            uSpotLightIntensities[i] * attenuation,
            normal,
            viewDirection,
            baseColor.rgb,
            roughness,
            uMetallic
        );
    }

    vec3 emissive = uEmissiveColor;
    if (uHasEmissiveMap) {
        emissive += texture(uEmissiveMap, vUv).rgb;
    }

    outColor = vec4(litColor + emissive, baseColor.a);
}`;
