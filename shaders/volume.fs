#version 300 es

precision lowp float;

uniform lowp sampler3D uVolumeSampler;


uniform mat4 uRMatrix;
// uniform sampler2D uNormalMap;
// uniform bool uUseNormalMap;

uniform vec3 uCameraParams;
uniform float uResolution;
// uniform vec3 uLightPos;
// uniform float uShininess;
// uniform vec4 uLightColor;
// uniform vec4 uAmbientColor;
uniform vec4 uClearColor;
// uniform sampler2D uHeightmap;
// uniform bool uUseTexture;
// uniform float uAmplitude;
// uniform sampler2D uSampler;
// uniform sampler2D uHeightSampler;
// uniform float uWaterLevel;
uniform vec4 uTransfertColor[256];
uniform float uMinThreshold;
uniform float uMaxThreshold;

in vec4 vPos3D;
in vec4 vPosCam;
in mat4 vRiMatrix;
in mat4 vMVMatrix;
out vec4 fragColor;

// ==============================================
// On suppose que vous avez un tableau de textures 2D
float getGrayLevel(vec3 P) {
    // Transforme P dans le range [0, 1]
    vec3 nP = vec3((P.x + 1.0) / 2.0, (P.y + 1.0) / 2.0, P.z / 2.0);

    // Utiliser sampler2DArray avec l'index dynamique
    vec3 col = texture(uVolumeSampler, nP).rgb;
    return max(col.r, max(col.g, col.b));
}

// ==============================================
void main(void) {

    float textureSize = uResolution;

    // Calcul des paramètres de caméra
    vec2 pix = vPosCam.xy / vPosCam.w;
    float aspectRatio = uCameraParams.x / uCameraParams.y;
    float fovY = radians(uCameraParams.z);
    float focalLength = 1.0 / tan(fovY / 2.0);

    vec3 dirCam = normalize(vec3(pix.x * aspectRatio, pix.y, -focalLength));
    vec3 dir = (vRiMatrix * vec4(dirCam, -1.0)).xyz;

    vec3 P = vPos3D.xyz;
    bool hit = false;

    // Initialisation du parcours de voxel
    vec3 voxel = (vPos3D.xyz + vec3(1, 1, -1)) * textureSize / 2.0;
    vec3 deltaDist = abs(1.0 / dir);
    vec3 step = sign(dir); // Récupération du signe de la direction
    
    vec3 maxDist = (floor(voxel) + step * 0.5 - voxel) * deltaDist;

    vec4 finalColor = vec4(0.0, 0.0, 0.0, 0.0);

    for (int i = 0; i < int(textureSize * 3.0); i++) {
        P = (voxel / (textureSize/ 2.0)) - vec3(1.0, 1.0, -1.0);

        // Vérification des limites de la bounding box
        if (P.x < -1.0 || P.x > 1.0 || P.y < -1.0 || P.y > 1.0 || P.z < 0.0 || P.z > 2.0) {
            float intensity = finalColor.r + finalColor.g + finalColor.b;
            if (intensity > uMinThreshold/3.0) {
                break;
            } else {
                discard;
            }
        }

        float grayLvl = getGrayLevel(P);
        if (grayLvl > uMinThreshold) {
            //finalColor += uTransfertColor[int(((grayLvl-uMinThreshold)/(uMaxThreshold-uMinThreshold))*255.0)];
            finalColor += uTransfertColor[int(grayLvl * 255.0)];
            if (grayLvl > uMaxThreshold) {
                hit = true;
                break;
            }
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
        vec4 col = finalColor;
        fragColor = vec4(col.rgb, 1.0);
        // discard;
    } else {
        fragColor = vec4(finalColor.rgb, 1.0);
    }
}
