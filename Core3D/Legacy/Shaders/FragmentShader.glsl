precision mediump float;

varying highp vec2 vTextureCoord;
varying highp vec3 vNormal;

uniform sampler2D uSampler;
uniform vec3 uLightDirection;
uniform vec3 uLightColor;
uniform float uLightIntensity;
uniform float uAmbientStrength;

void main(void) {
    vec3 normal = normalize(vNormal);
    vec3 lightDirection = normalize(uLightDirection);
    float diffuse = max(dot(normal, lightDirection), 0.0);
    float light = clamp(uAmbientStrength + diffuse * uLightIntensity, 0.0, 1.5);
    vec4 textureColor = texture2D(uSampler, vTextureCoord);

    gl_FragColor = vec4(textureColor.rgb * uLightColor * light, textureColor.a);
}
