attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;

uniform mat4 uRMatrix;
uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

uniform vec3 uColor;
uniform sampler2D uSampler;
uniform bool uUseTexture;

varying vec3 vColor;
varying vec4 pos3D;
varying vec3 N;

void main(void) {
	pos3D = uMVMatrix * vec4(aVertexPosition,1.0);
	N = vec3(uRMatrix * vec4(aVertexNormal,1.0));

	if (uUseTexture) {
		float heightFactor = (1.0 - aVertexPosition.z * 2.0) ;
		vec2 texCoord = vec2(heightFactor, heightFactor);
		vColor = texture2D(uSampler, texCoord).rgb;
	} else {
		vColor = uColor;
	}
	
	gl_Position = uPMatrix * pos3D;
}
