attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

uniform vec3 uColor;
uniform sampler2D uSampler;
uniform sampler2D uHeightSampler;
uniform float uWaterLevel;
uniform bool uUseTexture;

varying vec3 vColor;
varying vec4 vPos3D;
varying vec3 vNormal;
varying vec2 vTexCoords;
varying float vNormalMapCoeff;

void main(void) {

	vNormalMapCoeff = 0.0;

	vec3 tempPos = aVertexPosition;
	if (aVertexPosition.z < uWaterLevel) {
		tempPos.z = uWaterLevel;
		vNormalMapCoeff = 1.0;
	} else {
		vNormalMapCoeff = pow((1.0 - (aVertexPosition.z - uWaterLevel)), 60.0);
	}

	vPos3D = uMVMatrix * vec4(tempPos,1.0);
	vNormal = aVertexNormal;
	vTexCoords = aTextureCoord;

	if (uUseTexture) {
		float heightFactor = (1.0 - tempPos.z * 2.0) ;
		vec2 texCoord = vec2(heightFactor, heightFactor);

		vec3 colHeight = texture2D(uHeightSampler, texCoord).rgb;
		vec3 colText = texture2D(uSampler, aTextureCoord).rgb;

		vColor = colHeight * 0.6 + colText * 0.4;
	} else {
		vColor = uColor;
	}
  
	gl_Position = uPMatrix * vPos3D;
}
