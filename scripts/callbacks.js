// Autor: Léna PROUST & Tom BOIREAU (sur la base d'un code fourni par Nicolas COURILLEAU)

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

		var maxRotX = degToRad(55); 
		var minRotX = degToRad(-80);

		rotX = Math.max(minRotX, Math.min(maxRotX, rotX));

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

function hexToRgb(hex) {
    hex = hex.replace("#", "");
    return [
        parseInt(hex.substring(0, 2), 16) / 255,
        parseInt(hex.substring(2, 4), 16) / 255,
        parseInt(hex.substring(4, 6), 16) / 255
    ];
}

function invertColor(rgb) {
    return rgb.map(c => 1 - c);
}

function rgbToLab(r, g, b) {
    // Helper function to convert RGB to XYZ
    function rgbToXyz(r, g, b) {
        r = r / 255;
        g = g / 255;
        b = b / 255;

        r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
        g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
        b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

        r = r * 100;
        g = g * 100;
        b = b * 100;

        // Observer. = 2°, Illuminant = D65
        const x = r * 0.4124 + g * 0.3576 + b * 0.1805;
        const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
        const z = r * 0.0193 + g * 0.1192 + b * 0.9505;

        return [x, y, z];
    }

    // Helper function to convert XYZ to LAB
    function xyzToLab(x, y, z) {
        const refX =  95.047;
        const refY = 100.000;
        const refZ = 108.883;

        x = x / refX;
        y = y / refY;
        z = z / refZ;

        x = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x) + (16 / 116);
        y = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y) + (16 / 116);
        z = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z) + (16 / 116);

        const l = (116 * y) - 16;
        const a = 500 * (x - y);
        const b = 200 * (y - z);

        return [l, a, b];
    }

    const [x, y, z] = rgbToXyz(r, g, b);
    return xyzToLab(x, y, z);
}

// =====================================================
// UPDATE
// =====================================================

// ==========================================
function tick() {
	requestAnimFrame(tick);
	drawScene();
}