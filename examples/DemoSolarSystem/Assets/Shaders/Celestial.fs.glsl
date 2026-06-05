#version 300 es
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

uniform sampler2D uAlbedoMap;
uniform int uHasAlbedoMap;

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
    for (int i = 0; i < 6; i++) {
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
    
    // Domain warping for realistic gas bands and terrain
    vec2 q = vec2(fbm(movingUv * 4.0 + uSeed), fbm(movingUv * 4.0 + vec2(5.2, 1.3) + uSeed));
    vec2 r = vec2(fbm(movingUv * 8.0 + 4.0*q + vec2(1.7, 9.2)), fbm(movingUv * 8.0 + 4.0*q + vec2(8.3, 2.8)));
    
    float terrain = fbm(movingUv * 6.0 + 4.0*r + uSeed * 5.31);
    float bands = sin((vUv.y + uSeed * 0.07) * 42.0 + r.x * 4.0);
    float clouds = smoothstep(0.4, 0.9, fbm(movingUv * 12.0 + q * 2.0 + vec2(uTime * 0.015)));
    
    float mask = clamp(terrain * 0.7 + bands * 0.3, 0.0, 1.0);
    
    // Blend procedural with texture map if available
    vec3 surface;
    if (uHasAlbedoMap == 1) {
        surface = texture(uAlbedoMap, vUv).rgb;
    } else {
        surface = mix(uBaseColor, uSecondaryColor, mask);
    }
    
    // Add realistic atmospheric scattering / clouds
    surface = mix(surface, vec3(1.0, 0.98, 0.95), clouds * uCloudStrength);
    vec3 lit = mix(uNightColor, surface, day);

    float specular = pow(max(dot(reflect(-lightDirection, normal), viewDirection), 0.0), mix(72.0, 8.0, uRoughness));
    lit += vec3(specular) * (1.0 - uRoughness) * day * 0.35;
    lit += uAtmosphereColor * rim * uAtmosphereStrength;

    // Sun Plasma Effect (active if highly emissive)
    if (uEmissiveStrength > 0.5) {
        vec2 plasmaUv = vUv * 6.0;
        float plasmaTime = uTime * 0.05;
        
        vec2 pq = vec2(fbm(plasmaUv + vec2(plasmaTime, plasmaTime * 0.5)), fbm(plasmaUv - vec2(plasmaTime * 0.4)));
        vec2 pr = vec2(fbm(plasmaUv * 2.0 + pq * 3.0 + plasmaTime), fbm(plasmaUv * 2.0 - pq * 2.0));
        float plasmaNoise = fbm(plasmaUv * 3.0 + pr * 4.0);
        
        float plasmaMask = smoothstep(0.2, 0.8, plasmaNoise);
        vec3 animatedEmissive = mix(uEmissiveColor, uSecondaryColor, plasmaMask);
        
        // Solar flares / bright spots
        float brightSpot = smoothstep(0.55, 1.0, fbm(plasmaUv * 10.0 + pr * 2.0 - plasmaTime * 2.0));
        animatedEmissive = mix(animatedEmissive, vec3(1.0, 0.95, 0.8), brightSpot * 0.9);
        
        // Add solar rim glow
        float solarRim = pow(rim, 1.5) * fbm(vUv * 15.0 - vec2(0.0, uTime * 0.2));
        
        lit = animatedEmissive * uEmissiveStrength;
        lit += uAtmosphereColor * (rim + solarRim) * uAtmosphereStrength;
    } else {
        lit += uEmissiveColor * uEmissiveStrength;
    }

    outColor = vec4(lit, 1.0);
}
