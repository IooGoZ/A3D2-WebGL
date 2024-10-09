attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;//
uniform mat4 uPMatrix;//

uniform vec3 uColor;//
uniform sampler2D uSampler;//
uniform bool uUseTexture;//

varying vec3 vColor;
varying vec4 vPos3D;
varying vec3 vNormal;
varying vec2 vTexCoords;

void main(void) {
	vPos3D = uMVMatrix * vec4(aVertexPosition,1.0);
	vNormal = aVertexNormal;
	vTexCoords = aTextureCoord;

	if (uUseTexture) {
		vColor = texture2D(uSampler, aTextureCoord).rgb;
	} else {
		vColor = uColor;
	}
  
	gl_Position = uPMatrix * vPos3D;
}
