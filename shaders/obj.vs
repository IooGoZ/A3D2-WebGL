attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;

uniform mat4 uRMatrix;
uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

uniform vec3 uColor;

varying vec3 vColor;
varying vec4 pos3D;
varying vec3 N;

void main(void) {
	pos3D = uMVMatrix * vec4(aVertexPosition,1.0);
	N = vec3(uRMatrix * vec4(aVertexNormal,1.0));

	if (aVertexPosition.z < 0.005) vColor = vec3(0,0,1); 
	else if (aVertexPosition.z < 0.009) vColor = vec3(0.3,0.6,0.6); 
	else if (aVertexPosition.z < 0.013) vColor = vec3(0.8,0.6,0); 
	else if (aVertexPosition.z < 0.03) vColor = vec3(0.2,0.3,0); 
	else if (aVertexPosition.z < 0.1) vColor = vec3(0.1,0.3,0); 
	else if (aVertexPosition.z < 0.2) vColor = vec3(0.35,0.1,0.1); 
	else {vColor = vec3(1,1,1);}



	gl_Position = uPMatrix * pos3D;
}
