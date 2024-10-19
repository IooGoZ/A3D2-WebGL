// Author : Léna PROUST & Tom BOIREAU

// Ce fichier gère la sélection d'objets 3D, et permet de modifier leurs paramètres (position, rotation, couleur)

var sceneObjects = [];
var selectedObject = null;

const DEF_POSITION = vec3.create([0,0,0]);
const DEF_ROTATION = vec3.create([0,0,0]);
const DEF_COLOR = vec3.create([1,1,1]);

var selectorElem = null;
var posXElem = null;
var posYElem = null;
var posZElem = null;
var rotXElem = null;
var rotYElem = null;
var rotZElem = null;
var colorElem = null;
var wireframeElem = null; 

// =====================================================
// FONCTIONS GENERALES, INITIALISATIONS
// =====================================================

// =====================================================
function initSelector() {


    // Initialisation des éléments HTML
    selectorElem = document.getElementById("object-selector");
    posXElem = document.getElementById("posX");
    posYElem = document.getElementById("posY");
    posZElem = document.getElementById("posZ");
    rotXElem = document.getElementById("rotX");
    rotYElem = document.getElementById("rotY");
    rotZElem = document.getElementById("rotZ");
    colorElem = document.getElementById("color");
    wireframeElem = document.getElementById("wireframe");
    textureElem = document.getElementById("texture");
    normalElem = document.getElementById("normal");

    // Charger le système de heightmap
    initHeightmap();

    // Ajout des objets de la scène
    addObj("Plane", new plane());
    obj = addMeshObj('porsche.obj');

    //handleGeneratePerlin();
    //addHeightmapObj();

    addBoundingBox();
}

// =====================================================
function drawScene() {
	gl.clear(gl.COLOR_BUFFER_BIT);
	
    for (var i=0; i<sceneObjects.length; i++) {
        sceneObjects[i].draw();
    }
}

// =====================================================
// FONCTIONS DE SELECTION
// =====================================================

// =====================================================
function deselectAll() {
    for (var i=0; i<sceneObjects.length; i++) {
        sceneObjects[i].option.selected = false;
    }
}

// =====================================================
function select(obj) {
    // Désélection de tous les objets
    deselectAll();

    // Sélection de l'objet
    selectedObject = obj;
    obj.option.selected = true;

    // Mise à jour des champs de l'interface
    posXElem.value = obj.position[0];
    posYElem.value = obj.position[1];
    posZElem.value = obj.position[2];
    rotXElem.value = radToDeg(obj.rotation[0]);
    rotYElem.value = radToDeg(obj.rotation[1]);
    rotZElem.value = radToDeg(obj.rotation[2]);

    if (obj.color) {
        colorElem.value = rgbToHex(obj.color[0], obj.color[1], obj.color[2]);
        colorElem.disabled = false;
    } else {
        colorElem.value = "#FFFFFF";
        colorElem.disabled = true;
    }

    try {
        wireframeElem.checked = obj.getWireState();
        wireframeElem.disabled = false;
    } catch (e) {
        wireframeElem.checked = false;
        wireframeElem.disabled = true;
    }

    try {
        textureElem.checked = obj.getTextureState();
        textureElem.disabled = false;
    } catch (e) {
        textureElem.checked = false;
        textureElem.disabled = true;
    }

    try {
        normalElem.checked = obj.getNormalState();
        normalElem.disabled = false;
    } catch (e) {
        normalElem.checked = false;
        normalElem.disabled = true;
    }
}

// =====================================================
function addObj(objName, obj) {

    sceneObjects.push(obj);
    
    var option = document.createElement("option");
    option.text = objName;

    selectorElem.add(option);
    obj.option = option;

    select(obj);

    return obj;
}

// =====================================================
function addMeshObj(objName) {
    const obj = new objmesh(objName, DEF_POSITION, DEF_ROTATION, DEF_COLOR);

    return addObj(objName, obj);
}

// =====================================================
function addHeightmapObj(objName="Heightmap") {
    const obj = new map3D(getHeightmap(), position=DEF_POSITION, rotation=DEF_ROTATION, color=DEF_COLOR);

    return addObj(objName, obj);
}

// =====================================================
function addBoundingBox(objName="BoundingBox") {
    const obj = new BoundingBox(DEF_POSITION, DEF_ROTATION, DEF_COLOR);

    return addObj(objName, obj);
}

// =====================================================
function deleteSelected() {
    var index = sceneObjects.indexOf(selectedObject);
    if (index > -1) {
        sceneObjects.splice(index, 1);
        selectorElem.remove(selectedObject.option.index);
    }
}

// =====================================================
function changeObject() {
    var index = selectorElem.selectedIndex;
    select(sceneObjects[index]);
}

// =====================================================
function changePosition() {
	var posX = posXElem.value;
    var posY = posYElem.value;
    var posZ = posZElem.value;

	POSITION = vec3.create([posX, posY, posZ]);

	selectedObject.setPosition(POSITION);
}

// =====================================================
function changeRotation() {
	var rotX = rotXElem.value;
    var rotY = rotYElem.value;
    var rotZ = rotZElem.value;

	rotX = degToRad(rotX);
	rotY = degToRad(rotY);
	rotZ = degToRad(rotZ);

	ROTATION = vec3.create([rotX, rotY, rotZ]);

	selectedObject.setRotation(ROTATION);
}

// =====================================================
function changeColor() {
	var col = colorElem.value;
	var colR = parseInt(col.substring(1, 3), 16) / 255;
	var colG = parseInt(col.substring(3, 5), 16) / 255;
	var colB = parseInt(col.substring(5, 7), 16) / 255;

	COLOR = vec3.create([colR, colG, colB]);

	selectedObject.setColor(COLOR);
}

// =====================================================
function changeWireframe() {
    try {
        selectedObject.switchWireState();
        wireframeElem.checked = selectedObject.getWireState();
    } catch (e) {
        wireframeElem.checked = false;
    }
}

// =====================================================
function changeTexture() {
    try {
        selectedObject.switchTextureState();
        textureElem.checked = selectedObject.getTextureState();
    } catch (e) {
        textureElem.checked = false;
    }
}

// =====================================================
function changeNormal() {
    try {
        selectedObject.switchNormalState();
        normalElem.checked = selectedObject.getNormalState();
    } catch (e) {
        normalElem.checked = false;
    }
}