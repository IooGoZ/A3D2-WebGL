// Autor: Léna PROUST & Tom BOIREAU (sur la base d'un code fourni par Nicolas COURILLEAU)

// =====================================================
var gl;
var canvas;

// =====================================================
var mvMatrix = mat4.create();
var pMatrix = mat4.create();
var rotMatrix = mat4.create();
var distCENTER;

// =====================================================
// FONCTIONS GENERALES, INITIALISATIONS
// =====================================================

// =====================================================
function initGL(canvas)
{
	try {
		gl = canvas.getContext("webgl2");
		gl.viewportWidth = canvas.width;
		gl.viewportHeight = canvas.height;
		gl.viewport(0, 0, canvas.width, canvas.height);

		gl.clearColor(0.9, 0.95, 1.0, 1.0);
		gl.enable(gl.DEPTH_TEST);
		gl.enable(gl.CULL_FACE);
		gl.cullFace(gl.BACK); 
	} catch (e) {}
	if (!gl) {
		console.log("Could not initialise WebGL");
	}
}

// =====================================================
function webGLStart() {
	
	canvas = document.getElementById("WebGL-test");

	canvas.onmousedown = handleMouseDown;
	document.onmouseup = handleMouseUp;
	document.onmousemove = handleMouseMove;
	canvas.onwheel = handleMouseWheel;

	initGL(canvas);

	mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
	mat4.identity(rotMatrix);
	mat4.rotate(rotMatrix, rotX, [1, 0, 0]);
	mat4.rotate(rotMatrix, rotY, [0, 0, 1]);

	distCENTER = vec3.create([0,0,-3]);

	console.log(gl.getParameter(gl.MAX_ELEMENT_INDEX));
	console.log(gl.getParameter(gl.MAX_ELEMENTS_VERTICES));
	console.log(gl.getParameter(gl.MAX_ELEMENTS_INDICES));
	
	initSelector();
	
	
	tick();
}