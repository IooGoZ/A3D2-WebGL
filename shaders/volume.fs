precision mediump float;

uniform mat4 uRMatrix;
// uniform sampler2D uNormalMap;
// uniform bool uUseNormalMap;

uniform vec3 uCameraParams;
// uniform vec3 uLightPos;
// uniform float uShininess;
// uniform vec4 uLightColor;
// uniform vec4 uAmbientColor;
uniform vec3 uColor;
// uniform sampler2D uHeightmap;
// uniform bool uUseTexture;
// uniform float uAmplitude;
// uniform sampler2D uSampler;
// uniform sampler2D uHeightSampler;
// uniform float uWaterLevel;

varying vec4 vPos3D;
varying vec4 vPosCam;
varying mat4 vRiMatrix;
varying mat4 vMVMatrix;

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
        height = 0.2;

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
        gl_FragColor = vec4(uColor, 1.0);
    }
}
