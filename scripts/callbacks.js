// Autor: Tom BOIREAU (sur la base d'un code fourni par Nicolas COURILLEAU)

// =====================================================
// Mouse management
// =====================================================
var mouseDown = false;
var lastMouseX = null;
var lastMouseY = null;
var rotY = 0;
var rotX = -1;

var update_per_second = 60;
var wheel_sensivity = -0.001;

// =====================================================
window.requestAnimFrame = (function()
{
	return window.requestAnimationFrame ||
         window.webkitRequestAnimationFrame ||
         window.mozRequestAnimationFrame ||
         window.oRequestAnimationFrame ||
         window.msRequestAnimationFrame ||
         function(/* function FrameRequestCallback */ callback,
									/* DOMElement Element */ element)
         {
            window.setTimeout(callback, 1000/update_per_second);
         };
})();

// =====================================================
function handleMouseWheel(event) {

	distCENTER[2] += event.deltaY*wheel_sensivity;
}

// =====================================================
function handleMouseDown(event) {
	mouseDown = true;
	lastMouseX = event.clientX;
	lastMouseY = event.clientY;
}


// =====================================================
function handleMouseUp(event) {
	mouseDown = false;
}


// =====================================================
function handleMouseMove(event) {
	
	if (!mouseDown) return;

	var newX = event.clientX;
	var newY = event.clientY;	
	var deltaX = newX - lastMouseX;
	var deltaY = newY - lastMouseY;
	
	if(event.shiftKey) {
		distCENTER[2] += deltaY/100.0;
	} else {

		rotY += degToRad(deltaX / 5);
		rotX += degToRad(deltaY / 5);

		mat4.identity(rotMatrix);
		mat4.rotate(rotMatrix, rotX, [1, 0, 0]);
		mat4.rotate(rotMatrix, rotY, [0, 0, 1]);
	}
	
	lastMouseX = newX
	lastMouseY = newY;
}

// =====================================================
// FONCTIONS DE CONVERSION
// =====================================================

// =====================================================
function degToRad(degrees) {
	return degrees * Math.PI / 180;
}

// =====================================================
function radToDeg(radians) {
	return radians * 180 / Math.PI;
}

// =====================================================
function rgbToHex(r, g, b) {
	r = Math.floor(r*255);
	g = Math.floor(g*255);
	b = Math.floor(b*255);
	return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// =====================================================
// UPDATE
// =====================================================

// ==========================================
function tick() {
	requestAnimFrame(tick);
	drawScene();
}