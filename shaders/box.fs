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

int mod(int a, int b) {
    return a - b * int(a / b);
}



// ==============================================
void main(void) {

    float textureSize = 512.0;

    // Calcul des paramètres de caméra
    vec2 pix = vPosCam.xy / vPosCam.w;
    float aspectRatio = uCameraParams.x / uCameraParams.y;
    float fovY = radians(uCameraParams.z);
    float focalLength = 1.0 / tan(fovY / 2.0);

    vec3 dirCam = normalize(vec3(pix.x * aspectRatio, pix.y, -focalLength));
    vec3 dir = (vRiMatrix * vec4(dirCam, -1.0)).xyz;

    vec3 P = vPos3D.xyz;
    vec3 startShadowP = P;
    float height = 0.0;
    vec2 texCoord = vec2(0.0, 0.0);
    bool hit = false;
    bool waterable = false;

    // Initialisation du parcours de voxel
    vec3 voxel = (vPos3D.xyz + vec3(1, 1, -1)) * textureSize / 2.0;
    vec3 deltaDist = abs(1.0 / dir);
    vec3 step = sign(dir); // Récupération du signe de la direction
    
    vec3 maxDist = (floor(voxel) + step * 0.5 - voxel) * deltaDist;

    for (int i = 0; i < 1536; i++) {
        P = (voxel / (textureSize/ 2.0)) - vec3(1.0, 1.0, -1.0);

        // Vérification des limites de la bounding box
        if (P.x < -1.0 || P.x > 1.0 || P.y < -1.0 || P.y > 1.0 || P.z < 0.0 || P.z > 2.0) {
            discard; // Si on sort de la bounding box
        }

        // Calcul de la coordonnée de texture
        texCoord = vec2(voxel.x / textureSize, voxel.y / textureSize);
        height = rgbToLab(texture2D(uHeightmap, texCoord).rgb).x * uAmplitude;

        // Optionnel : ajustement de la hauteur avec la carte de normales
        if (uUseNormalMap) {
            height = height < uWaterLevel ? uWaterLevel : height;
            waterable = height<= uWaterLevel;
        }

        // Vérification de la hauteur
        if (P.z < height) {
            startShadowP = P;// + (1. / textureSize) * 2;  // Ajustement du point pour éviter les artefacts d’ombre
            hit = true;
            break;
        }
        
        if (maxDist.x <= maxDist.y && maxDist.x <= maxDist.z) {
            // Avance en x
            voxel.x += step.x;
            maxDist.x += deltaDist.x;
        } 
        else if (maxDist.y <= maxDist.z) {
            // Avance en y
            voxel.y += step.y;
            maxDist.y += deltaDist.y;
        } 
        else {
            // Avance en z
            voxel.z += step.z;
            maxDist.z += deltaDist.z;
        }
    }

    // Si on a pas touché la surface, on discard
    if (!hit) {
        discard;
    } else {

        // Sinon on calcule la couleur
        vec4 color = vec4(uColor, 1.0);
        if (uUseTexture) {
            // On reprend le principe de la heightmap pour la coloration
            vec2 heightTexCoord = vec2((1.0 - P.z * 2.0), (1.0 - P.z * 2.0));
            vec3 colHeight = texture2D(uHeightSampler, heightTexCoord).rgb;
            vec3 colText = texture2D(uSampler, texCoord).rgb;
            color = vec4(mix(colHeight, colText, 0.5), 1.0);
        }

        // Initialisation de la normale
        vec3 N = normalize(vec3(0.0, 0.0, 1.0));

        // Si on utilise la normal map pour l'eau, on la récupère
        if (uUseNormalMap && waterable) {
            N = normalize(texture2D(uNormalMap, texCoord).rgb * 2.0 - 1.0);
        } else {
            // Calcul de la normale à partir de la heightmap
            float step = 0.0068;
            float heightL = rgbToLab(texture2D(uHeightmap, texCoord + vec2(-step, 0.0)).rgb).x;
            float heightR = rgbToLab(texture2D(uHeightmap, texCoord + vec2(step, 0.0)).rgb).x;
            float heightD = rgbToLab(texture2D(uHeightmap, texCoord + vec2(0.0, -step)).rgb).x;
            float heightU = rgbToLab(texture2D(uHeightmap, texCoord + vec2(0.0, step)).rgb).x;

            vec3 dX = vec3(0.5, 0.0, (heightR - heightL));
            vec3 dY = vec3(0.0, 0.5, (heightU - heightD));
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


        // Calcul de l'ombre
        bool inShadow = false;
        vec3 shadowP;
        
        vec3 shadowDir = normalize(uLightPos - startShadowP);
        vec3 shadowVoxel = (startShadowP + vec3(1, 1, -1)) * textureSize / 2.0;
        vec3 shadowDeltaDist = abs(1.0 / shadowDir);
        vec3 shadowStep = sign(shadowDir); // Récupération du signe de la direction
        vec3 shadowMaxDist = (floor(shadowVoxel) + shadowStep * 0.5 - shadowVoxel) * shadowDeltaDist;

        for (int i = 0; i < 1536; i++) {

            if (i != 0) {
                shadowP = (shadowVoxel / (textureSize/ 2.0)) - vec3(1.0, 1.0, -1.0);

                
                if (shadowP.x < -1.0 || shadowP.x > 1.0 || shadowP.y < -1.0 || shadowP.y > 1.0) {
                    break;
                } else {
                    vec2 shadowTexCoord = vec2(shadowVoxel.x / textureSize, shadowVoxel.y / textureSize);
                    float shadowHeight = rgbToLab(texture2D(uHeightmap, shadowTexCoord).rgb).x * uAmplitude;
                    
                    if (shadowP.z < shadowHeight) {
                        inShadow = true;
                        break;
                    }
                }
            }
            
            if (shadowMaxDist.x <= shadowMaxDist.y && shadowMaxDist.x <= shadowMaxDist.z) {
                // Avance en x
                shadowVoxel.x += shadowStep.x;
                shadowMaxDist.x += shadowDeltaDist.x;
            } 
            else if (shadowMaxDist.y <= shadowMaxDist.z) {
                // Avance en y
                shadowVoxel.y += shadowStep.y;
                shadowMaxDist.y += shadowDeltaDist.y;
            } 
            else {
                // Avance en z
                shadowVoxel.z += shadowStep.z;
                shadowMaxDist.z += shadowDeltaDist.z;
            }
        }

        

        // Calcul des couleurs finale (ambiant, diffuse, spéculaire)
        vec3 ambient = vec3(uAmbientColor.rgb) * color.rgb;
        vec3 final_color = ambient;

        if (!inShadow) {
            vec3 diffuse = (color.rgb * weight) * vec3(uLightColor.rgb);
            final_color += diffuse;
        } else {
            final_color *= 1.5;
        }

        if (waterable) {
            float spec = pow(max(dot(normal, h), 0.0), uShininess);
            final_color += spec * vec3(uLightColor.rgb);
        }

        gl_FragColor = vec4(final_color, 1.0);

    }
}
