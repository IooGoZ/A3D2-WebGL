precision mediump float;

uniform mat4 uRMatrix;
uniform sampler2D uNormalMap;
uniform bool uUseNormalMap;

uniform vec3 uLightPos;
uniform float uShininess;
uniform vec4 uLightColor;
uniform vec4 uAmbientColor;

varying vec3 vColor;
varying vec4 vPos3D;
varying vec3 vNormal;
varying vec2 vTexCoords;
varying float vNormalMapCoeff;

// ==============================================
void main(void)
{
    vec3 lightColor = vec3(0.8, 0.8, 0.8);

    vec3 normal;
    if (uUseNormalMap) {
        normal = texture2D(uNormalMap, vTexCoords).xyz;
        normal = normalize((2.0 * normal - 1.0) * vNormalMapCoeff + vNormal * (1.0 - vNormalMapCoeff));
    } else {
        normal = normalize(vNormal);
    }

    normal = vec3(uRMatrix * vec4(normal, 1.0));

    vec3 lightDir = normalize(uLightPos - vPos3D.xyz);

    float weight = max(dot(normal, lightDir), 0.0);

    vec3 viewDir = -vPos3D.xyz;

	float shininess = uShininess;
	if (vNormalMapCoeff > 0.5) {
		shininess = uShininess / 50.0;
	}

    // Calcul du speculaire
    vec3 h = normalize(lightDir + viewDir);
    float spec = pow(max(dot(normal, h), 0.0), shininess);

	vec3 ambient = vec3(uAmbientColor) * vec3(vColor);
    vec3 diffuse = (vColor * weight) * vec3(uLightColor) * (2.0 / 3.1415);
    vec3 color = ambient + diffuse + spec * vec3(uLightColor) * vNormalMapCoeff;

    gl_FragColor = vec4(color, 1.0);
}
