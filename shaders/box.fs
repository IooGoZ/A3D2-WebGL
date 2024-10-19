precision mediump float;

uniform mat4 uRMatrix;
uniform sampler2D uNormalMap;
uniform bool uUseNormalMap;

uniform vec3 uCameraParams;
uniform vec3 uLightPos;
uniform float uShininess;
uniform vec4 uLightColor;
uniform vec4 uAmbientColor;
uniform vec3 uColor;
uniform sampler2D uHeightmap;
uniform bool uUseTexture;
uniform float uAmplitude;
uniform sampler2D uSampler;
uniform sampler2D uHeightSampler;
uniform float uWaterLevel;

varying vec4 vPos3D;
varying vec4 vPosCam;
varying mat4 vRiMatrix;
varying mat4 vMVMatrix;

// Fonctions utilitaires
vec3 rgbToXYZ(vec3 rgb) {
    vec3 linearRGB = vec3(
        (rgb.r > 0.04045) ? pow((rgb.r + 0.055) / 1.055, 2.4) : rgb.r / 12.92,
        (rgb.g > 0.04045) ? pow((rgb.g + 0.055) / 1.055, 2.4) : rgb.g / 12.92,
        (rgb.b > 0.04045) ? pow((rgb.b + 0.055) / 1.055, 2.4) : rgb.b / 12.92
    );

    const mat3 rgbToXYZMat = mat3(
        0.4124, 0.3576, 0.1805,
        0.2126, 0.7152, 0.0722,
        0.0193, 0.1192, 0.9505
    );
    
    return rgbToXYZMat * linearRGB;
}

float f(float t) {
    const float delta = 6.0 / 29.0;
    if (t > pow(delta, 3.0)) {
        return pow(t, 1.0 / 3.0);
    } else {
        return (t / (3.0 * pow(delta, 2.0))) + (4.0 / 29.0);
    }
}

vec3 xyzToLab(vec3 xyz) {
    const vec3 whiteRef = vec3(95.047, 100.000, 108.883);
    vec3 normXYZ = xyz / whiteRef;

    float L = 116.0 * f(normXYZ.y) - 16.0;
    float a = 500.0 * (f(normXYZ.x) - f(normXYZ.y));
    float b = 200.0 * (f(normXYZ.y) - f(normXYZ.z));

    return vec3(L, a, b);
}

vec3 rgbToLab(vec3 rgb) {
    vec3 xyz = rgbToXYZ(rgb);
    return xyzToLab(xyz);
}

// ==============================================
void main(void)
{
    vec2 pix = vPosCam.xy / vPosCam.w;
    float aspectRatio = uCameraParams.x / uCameraParams.y;
    float fovY = radians(uCameraParams.z);
    float focalLength = 1.0 / tan(fovY / 2.0);

    vec3 dirCam = normalize(vec3(pix.x * aspectRatio, pix.y, -focalLength));
    vec3 dir = (vRiMatrix * vec4(dirCam, -1.0)).xyz;

    vec3 P = vPos3D.xyz;
    float height = 0.0;
    vec2 texCoord = vec2(0.0, 0.0);
    bool hit = false;
    bool waterable = false;

    for (float t = 0.0; t < 5.0 ; t += 0.01) {
        P = vPos3D.xyz + dir * t;
        if (P.x < -1.0 || P.x > 1.0 || P.y < -1.0 || P.y > 1.0) {
            discard;
        } else {
            texCoord = vec2(0.5, 0.5) + vec2(P.x, -P.y) * 0.5;
            height = rgbToLab(texture2D(uHeightmap, texCoord).rgb).x;
            if (uUseNormalMap) {
                height = height * uAmplitude < uWaterLevel ? uWaterLevel / uAmplitude  : height;
                waterable = (height * uAmplitude) <= uWaterLevel;
            }

            if (P.z < height * uAmplitude) {
                hit = true;
                break;
            }
        }
    }

    if (!hit) {
        discard;
    } else {
        vec4 color = vec4(uColor, 1.0);
        if (uUseTexture) {
            vec2 heightTexCoord = vec2((1.0 - P.z * 2.0), (1.0 - P.z * 2.0));
            vec3 colHeight = texture2D(uHeightSampler, heightTexCoord).rgb;
            vec3 colText = texture2D(uSampler, texCoord).rgb;
            color = vec4(mix(colHeight, colText, 0.5), 1.0);
        }

        // Initialisation de la normale
        vec3 N = normalize(vec3(0.0, 0.0, 1.0));
        if (uUseNormalMap && waterable) {
            N = normalize(texture2D(uNormalMap, texCoord).rgb * 2.0 - 1.0);
        } else {
            // Calcul de la normale à partir de la heightmap
            float heightL = rgbToLab(texture2D(uHeightmap, texCoord + vec2(-0.01, 0.0)).rgb).x;
            float heightR = rgbToLab(texture2D(uHeightmap, texCoord + vec2(0.01, 0.0)).rgb).x;
            float heightD = rgbToLab(texture2D(uHeightmap, texCoord + vec2(0.0, -0.01)).rgb).x;
            float heightU = rgbToLab(texture2D(uHeightmap, texCoord + vec2(0.0, 0.01)).rgb).x;

            vec3 dX = vec3(0.02, 0.0, (heightR - heightL) * uAmplitude);
            vec3 dY = vec3(0.0, 0.02, (heightU - heightD) * uAmplitude);
            N = normalize(cross(dX, dY));
        }

        // Normalisation de la normale
        vec3 normal = normalize(N);

        // Nouvelle direction de la lumière : influencée par uLightPos et la position de la caméra
        vec3 lightDir = normalize(uLightPos - P);  // Le décalage est contrôlé par uLightPos

        // Calcul de la lumière diffuse et spéculaire
        float weight = max(dot(normal, lightDir), 0.0);
        vec3 viewDir = normalize(vPosCam.xyz-P);
        vec3 h = normalize(lightDir + viewDir);


        bool inShadow = false;
        vec3 shadowP;
        for (float st = 0.01; st < 1.0; st += 0.01) {
            shadowP = P + lightDir * st;
            vec2 shadowTexCoord = vec2(0.5, 0.5) + vec2(shadowP.x, -shadowP.y) * 0.5;
            float shadowHeight = rgbToLab(texture2D(uHeightmap, shadowTexCoord).rgb).x;

            if (shadowP.z < shadowHeight * uAmplitude) {
                inShadow = true;
                break;
            }
        }
        

        // Calcul des couleurs finale (ambiant, diffuse, spéculaire)
        vec3 ambient = vec3(uAmbientColor.rgb) * color.rgb;
        vec3 final_color = ambient;

        if (!inShadow) {
            vec3 diffuse = (color.rgb * weight) * vec3(uLightColor.rgb);
            final_color += diffuse;
        }

        if (waterable) {
            float spec = pow(max(dot(normal, h), 0.0), uShininess);
            final_color += spec * vec3(uLightColor.rgb);
        }

        gl_FragColor = vec4(final_color, 1.0);

    }
}
