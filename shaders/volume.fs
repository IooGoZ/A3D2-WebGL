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
vec4 colorRamp(float t) {
    vec4 c1 = vec4(0.0, 0.0, 1.0, 1.0);
    vec4 c2 = vec4(0.0, 1.0, 0.0, 1.0);
    vec4 c3 = vec4(1.0, 0.0, 0.0, 1.0);
    vec4 c4 = vec4(1.0, 1.0, 0.0, 1.0);
    vec4 c5 = vec4(1.0, 1.0, 1.0, 1.0);

    if (t < 0.15) {
        return mix(c1, c2, t / 0.2);
    } else if (t < 0.20) {
        return mix(c2, c3, (t - 0.2) / 0.2);
    } else if (t < 0.25) {
        return mix(c3, c4, (t - 0.4) / 0.2);
    } else if (t < 0.30) {
        return mix(c4, c5, (t - 0.6) / 0.2);
    } else {
        return c5;
    }
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
            if (intensity > 0.1) {
                break;
            } else {
                discard;
            }
        }

        float grayLvl = getGrayLevel(P);
        if (grayLvl > 0.1)
            finalColor += colorRamp(grayLvl) * grayLvl * grayLvl;

            if (grayLvl > 0.3) {
                hit = true;
                break;
            }

        // Vérification de la hauteur
        // if (grayLvl > 0.3) {
        //     finalColor = vec4(1.0, 0.0, 0.0, grayLvl);
        //     hit = true;
        //     break;
        // } 
        // else if (grayLvl > 0.5) {
        //     finalColor = vec4(0.0, 1.0, 0.0, grayLvl);
        //     hit = true;
        //     break;
        // } 
        // else if (grayLvl > 0.1) {
        //     finalColor = vec4(0.0, 0.0, 1.0, grayLvl);
        //     startShadowP = P;
        //     hit = true;
        //     break;
        // }
        
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
        vec4 col = uClearColor - finalColor;
        fragColor = vec4(col.rgb, 1.0);
        // discard;
    } else {
        fragColor = vec4(finalColor.rgb, 1.0);
    }
}
