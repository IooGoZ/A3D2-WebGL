precision mediump float;

uniform mat4 uRMatrix;//
uniform sampler2D uNormalMap;
uniform bool uUseNormalMap;

uniform vec3 uLightPos;//
uniform float uShininess;
uniform vec4 uLightColor;//
uniform vec4 uAmbientColor;//

varying vec3 vColor;
varying vec4 vPos3D;
varying vec3 vNormal;
varying vec2 vTexCoords;

// ==============================================
void main(void)
{
    vec3 normal;
    if (uUseNormalMap) {
        normal = texture2D(uNormalMap, vTexCoords).xyz;
        normal = normalize(2.0 * normal - 1.0);
    } else {
        normal = normalize(vNormal);
    }

    normal = vec3(uRMatrix * vec4(normal, 1.0));

    vec3 lightDir = normalize(uLightPos - vPos3D.xyz);

    float weight = max(dot(normal, lightDir), 0.0);

    vec3 viewDir = -vPos3D.xyz;

    // Calcul du speculaire
    vec3 h = normalize(lightDir + viewDir);
    float spec = pow(max(dot(normal, h), 0.0), uShininess);

    vec3 ambient = vec3(uAmbientColor) * vec3(vColor);
    vec3 diffuse = (vColor * weight) * vec3(uLightColor) * (2.0 / 3.1415);
    vec3 color = ambient + diffuse + spec * vec3(uLightColor);

    gl_FragColor = vec4(color, 1.0);
}