attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;//
uniform mat4 uPMatrix;//

varying vec4 vPos3D;
varying vec4 vPosCam;
varying mat4 vRiMatrix;
varying mat4 vMVMatrix;

mat4 transpose(mat4 m) {
	return mat4(
		vec4(m[0][0], m[1][0], m[2][0], m[3][0]),
		vec4(m[0][1], m[1][1], m[2][1], m[3][1]),
		vec4(m[0][2], m[1][2], m[2][2], m[3][2]),
		vec4(m[0][3], m[1][3], m[2][3], m[3][3])
	);
}

void main(void) {
	vPos3D = vec4(aVertexPosition, 1.0);

	vMVMatrix = uMVMatrix;
	vRiMatrix = transpose(uMVMatrix);

	vPosCam = uPMatrix * uMVMatrix * vPos3D;
	gl_Position = vPosCam;
	vPosCam.z /= vPosCam.w;
}
