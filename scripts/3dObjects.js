// Autor: Léna PROUST & Tom BOIREAU (sur la base d'un code fourni par Nicolas COURILLEAU)

var shadersFolder = 'shaders/';
var objFolder = 'objects/';

// =====================================================
// FONCTIONS ASYNCHRONES (Merci Javascript de ne pas les permettre dans les classes)
// =====================================================

// =====================================================
function loadObjFile(Obj3D) {

	const url = objFolder + Obj3D.objFname;

	var xhttp = new XMLHttpRequest();

	xhttp.onreadystatechange = function() {
		if (xhttp.readyState == 4 && xhttp.status == 200) {
			var tmpMesh = new OBJ.Mesh(xhttp.responseText);
			OBJ.initMeshBuffers(gl,tmpMesh);
			Obj3D.mesh=tmpMesh;
			try { Obj3D.endLoad();} catch(e) {}
		}
	}

	xhttp.open("GET", url, true);
	xhttp.send();
}

// =====================================================
function loadShaders(Obj3D, shaderName = null) {
	loadShaderText(Obj3D,'.vs', shaderName);
	loadShaderText(Obj3D,'.fs', shaderName);
}

// =====================================================
function loadShaderText(Obj3D,ext, shaderName) {   // lecture asynchrone...
  var xhttp = new XMLHttpRequest();
  
  if(shaderName==null) shaderName = Obj3D.shaderName;
  const url = shadersFolder + shaderName + ext;

  xhttp.onreadystatechange = function() {
	if (xhttp.readyState == 4 && xhttp.status == 200) {
		if(ext=='.vs') { Obj3D.vsTxt = xhttp.responseText; Obj3D.loaded ++; }
		if(ext=='.fs') { Obj3D.fsTxt = xhttp.responseText; Obj3D.loaded ++; }
		if(Obj3D.loaded==2) {
			Obj3D.loaded ++;
			compileShaders(Obj3D);
			Obj3D.loaded ++;
		}
	}
  }
  
  Obj3D.loaded = 0;
  xhttp.open("GET", url, true);
  xhttp.send();
}


// =====================================================
function downloadImageFromUint8Array(data, width, height, channels = 4, filename = 'image.png') {
    // Vérification des dimensions
    if (data.length !== width * height * channels) {
        throw new Error('La taille du tableau Uint8Array ne correspond pas aux dimensions spécifiées.');
    }

    // Création d'un canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Création d'une image Data
    const imageData = ctx.createImageData(width, height);

    // Copie des données
    for (let i = 0; i < data.length; i++) {
        imageData.data[i] = data[i];
    }

    // Dessiner les données sur le canvas
    ctx.putImageData(imageData, 0, 0);

    // Convertir le canvas en URL de données
    canvas.toBlob((blob) => {
        // Créer un lien pour télécharger l'image
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;

        // Simuler un clic pour déclencher le téléchargement
        link.click();

        // Nettoyer l'URL de blob
        URL.revokeObjectURL(link.href);
    }, 'image/png');
}


// =====================================================
async function loadRawFile(url, width, height, depth) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const buffer = await response.arrayBuffer();
    const data = new Uint8Array(buffer);

	const expectedSize = width * height * depth;
    if (data.length !== expectedSize) {
        console.error(`Taille des données incorrecte : attendue ${expectedSize}, reçue ${data.length}`);
        return null;
    }

	const texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_3D, texture);

	gl.texImage3D(gl.TEXTURE_3D, 0, gl.R8, width, height, depth, 0, gl.RED, gl.UNSIGNED_BYTE, data); // 1 canal, 8 bits par pixel, donc on utilise gl.R8 et gl.RED

	gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
	
	gl.bindTexture(gl.TEXTURE_3D, null);

    return texture;
}


// =====================================================
function compileShaders(Obj3D)
{
	Obj3D.vshader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(Obj3D.vshader, Obj3D.vsTxt);
	gl.compileShader(Obj3D.vshader);
	if (!gl.getShaderParameter(Obj3D.vshader, gl.COMPILE_STATUS)) {
		console.log("Vertex Shader FAILED... "+Obj3D.shaderName+".vs");
		console.log(gl.getShaderInfoLog(Obj3D.vshader));
	}

	Obj3D.fshader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(Obj3D.fshader, Obj3D.fsTxt);
	gl.compileShader(Obj3D.fshader);
	if (!gl.getShaderParameter(Obj3D.fshader, gl.COMPILE_STATUS)) {
		console.log("Fragment Shader FAILED... "+Obj3D.shaderName+".fs");
		console.log(gl.getShaderInfoLog(Obj3D.fshader));
	}

	Obj3D.shader = gl.createProgram();
	gl.attachShader(Obj3D.shader, Obj3D.vshader);
	gl.attachShader(Obj3D.shader, Obj3D.fshader);
	gl.linkProgram(Obj3D.shader);
	if (!gl.getProgramParameter(Obj3D.shader, gl.LINK_STATUS)) {
		console.log("Could not initialise shaders");
		console.log(gl.getShaderInfoLog(Obj3D.shader));
	}
}

// =====================================================
// Code from https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
function load2DTextureBufferFromURL(url) {
	var texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);

	const level = 0;
	const internalFormat = gl.RGBA;
	const width = 1;
	const height = 1;
	const border = 0;
	const srcFormat = gl.RGBA;
	const srcType = gl.UNSIGNED_BYTE;
	const pixel = new Uint8Array([0, 0, 255, 255]); // opaque blue
	gl.texImage2D(
		gl.TEXTURE_2D,
		level,
		internalFormat,
		width,
		height,
		border,
		srcFormat,
		srcType,
		pixel,
	);

	const image = new Image();
	image.onload = () => {
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(
		gl.TEXTURE_2D,
		level,
		internalFormat,
		srcFormat,
		srcType,
		image,
		);

		gl.generateMipmap(gl.TEXTURE_2D);
	};

	

	image.src = url;

	return texture;
}


function load2DTextureBufferFromImage(image) {
	var texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);

	const level = 0;
	const internalFormat = gl.RGBA;
	const width = 1;
	const height = 1;
	const border = 0;
	const srcFormat = gl.RGBA;
	const srcType = gl.UNSIGNED_BYTE;
	const pixel = new Uint8Array([0, 0, 255, 255]); // opaque blue
	gl.texImage2D(
		gl.TEXTURE_2D,
		level,
		internalFormat,
		width,
		height,
		border,
		srcFormat,
		srcType,
		pixel,
	);

	if (image) {

		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(
			gl.TEXTURE_2D,
			level,
			internalFormat,
			srcFormat,
			srcType,
			image,
		);

		gl.generateMipmap(gl.TEXTURE_2D);
	}

	return texture;
}
		


// =====================================================
// OBJET 3D, classe de base
// =====================================================

class ThreeDObject {

	constructor(position, rotation, shaderName = 'obj') {
		this.shaderName = shaderName;
		this.position = position;
		this.rotation = rotation;
		
		this.shader = null;
		this.loaded = -1;
		this.mesh = null;
	}

	// --------------------------------------------
	setShadersParams() {
		console.warn('setShadersParams not implemented');
	}

	// --------------------------------------------
	setMatrixUniforms() {
		mat4.identity(mvMatrix);
		mat4.translate(mvMatrix, distCENTER);
		mat4.multiply(mvMatrix, rotMatrix);

		mat4.translate(mvMatrix, this.position);

		mat4.rotate(mvMatrix, this.rotation[0], [1, 0, 0]);
		mat4.rotate(mvMatrix, this.rotation[1], [0, 1, 0]);
		mat4.rotate(mvMatrix, this.rotation[2], [0, 0, 1]);

		gl.uniformMatrix4fv(this.shader.rMatrixUniform, false, rotMatrix);
		gl.uniformMatrix4fv(this.shader.mvMatrixUniform, false, mvMatrix);
		gl.uniformMatrix4fv(this.shader.pMatrixUniform, false, pMatrix);
	}

	// --------------------------------------------
	draw() {
		if(this.shader && this.loaded==4 && this.mesh != null) {
			this.setShadersParams();
			this.setMatrixUniforms();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.mesh.indexBuffer);
			gl.drawElements(gl.TRIANGLES, this.mesh.indexBuffer.numItems, gl.UNSIGNED_INT, 0);
		}
	}

	setPosition(pos) {
		this.position = pos;
	}

	setRotation(rot) {
		this.rotation = rot;
	}
}

// =====================================================
// Abstract : Wireframe 3D Object
// =====================================================
class WireframeObject extends ThreeDObject {
	constructor(position = [0,0,0], rotation = [0,0,0], shaderName = 'obj', wireShaderName = 'wire') {
		super(position, rotation, shaderName);
		this.wireShaderName = wireShaderName;
		this.wireActive = false;
	}

	switchWireState() {
		this.wireActive = !this.wireActive;
		if (this.wireActive) {
			loadShaders(this, this.wireShaderName);
		} else {
			loadShaders(this);
		}
	}

	getWireState() {
		return this.wireActive;
	}

	setShadersParams() {
		gl.useProgram(this.shader);

		this.shader.vAttrib = gl.getAttribLocation(this.shader, "aVertexPosition");
		gl.enableVertexAttribArray(this.shader.vAttrib);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.vertexBuffer);
		gl.vertexAttribPointer(this.shader.vAttrib, this.mesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

		this.shader.rMatrixUniform = gl.getUniformLocation(this.shader, "uRMatrix");
		this.shader.mvMatrixUniform = gl.getUniformLocation(this.shader, "uMVMatrix");
		this.shader.pMatrixUniform = gl.getUniformLocation(this.shader, "uPMatrix");
	}

	draw() {
		if (this.wireActive) {
			this.setShadersParams();
			this.setMatrixUniforms();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.mesh.indexBuffer);
			gl.drawElements(gl.LINES, this.mesh.indexBuffer.numItems, gl.UNSIGNED_INT, 0);
		} else {
			super.draw();
		}
	}
}

// =====================================================
// PLAN 3D
// =====================================================

class plane extends ThreeDObject{
	
	// --------------------------------------------
	constructor(x=-1, y=-1, z=0, dx=2.0, dy=2.0, position = [0,0,0], rotation = [0,0,0]) {
		super(position, rotation, 'plane');
		this.x = x;
		this.y = y;
		this.z = z;
		this.dx = dx;
		this.dy = dy;
		this.loaded=-1;
		this.shader=null;
		this.mesh = {};

		this.initAll();
		loadShaders(this);
	}
		
	// --------------------------------------------
	initAll() {
		var vertices = [
			this.x, this.y, this.z,
			this.x+this.dx, this.y, this.z,
			this.x+this.dx, this.y+this.dy, this.z,
			this.x, this.y+this.dy, this.z
		];

		var texcoords = [
			0.0,0.0,
			0.0,1.0,
			1.0,1.0,
			1.0,0.0
		];

		this.mesh.vertexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
		this.mesh.vertexBuffer.itemSize = 3;
		this.mesh.vertexBuffer.numItems = 4;

		this.mesh.normalBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.normalBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);
		this.mesh.normalBuffer.itemSize = 2;
		this.mesh.normalBuffer.numItems = 4;
	}
	
	
	// --------------------------------------------
	setShadersParams() {
		gl.useProgram(this.shader);

		this.shader.vAttrib = gl.getAttribLocation(this.shader, "aVertexPosition");
		gl.enableVertexAttribArray(this.shader.vAttrib);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.vertexBuffer);
		gl.vertexAttribPointer(this.shader.vAttrib, this.mesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

		this.shader.tAttrib = gl.getAttribLocation(this.shader, "aTexCoords");
		gl.enableVertexAttribArray(this.shader.tAttrib);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.normalBuffer);
		gl.vertexAttribPointer(this.shader.tAttrib,this.mesh.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);

		this.shader.pMatrixUniform = gl.getUniformLocation(this.shader, "uPMatrix");
		this.shader.mvMatrixUniform = gl.getUniformLocation(this.shader, "uMVMatrix");
	}

	// --------------------------------------------
	draw() {
		if(this.shader && this.loaded==4) {		
			this.setShadersParams();
			this.setMatrixUniforms();
			
			gl.drawArrays(gl.TRIANGLE_FAN, 0, this.mesh.vertexBuffer.numItems);
			gl.drawArrays(gl.LINE_LOOP, 0, this.mesh.vertexBuffer.numItems);
		}
	}

}


// =====================================================
// OBJET 3D, lecture fichier obj
// =====================================================
class objmesh extends WireframeObject {

	// --------------------------------------------
	constructor(objFname, position = [0,0,0], rotation = [0,0,0], color = [1,1,1], lightPos = [0.0,0.0,0.0], ambientLight = [0.2,0.2,0.2,1.0], lightColor = [1.0,1.0,1.0,1.0], shininess = 320.0) {
		super(position, rotation);

		this.objFname = objFname;
		this.color = color;
		
		this.lightPos = lightPos;
		this.ambientLight = ambientLight;
		this.lightColor = lightColor;
		this.shininess = shininess;
		this.useTexture = true;
		
		this.initAll();
		loadShaders(this);
	}

	initAll() {
		loadObjFile(this);
	}

	endLoad() {
		this.mesh.textureImage = load2DTextureBufferFromURL('textures/obj_texture.png');
	}

	setShadersParams() {
		if (this.wireActive) {
			super.setShadersParams();
			return;
		}

		gl.useProgram(this.shader);

		this.shader.vAttrib = gl.getAttribLocation(this.shader, "aVertexPosition");
		gl.enableVertexAttribArray(this.shader.vAttrib);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.vertexBuffer);
		gl.vertexAttribPointer(this.shader.vAttrib, this.mesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

		this.shader.nAttrib = gl.getAttribLocation(this.shader, "aVertexNormal");
		gl.enableVertexAttribArray(this.shader.nAttrib);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.normalBuffer);
		gl.vertexAttribPointer(this.shader.nAttrib, this.mesh.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);

		this.shader.tAttrib = gl.getAttribLocation(this.shader, "aTextureCoord");
		gl.enableVertexAttribArray(this.shader.tAttrib);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.textureBuffer);
		gl.vertexAttribPointer(this.shader.tAttrib, this.mesh.textureBuffer.itemSize, gl.FLOAT, false, 0, 0);
		
		this.shader.rMatrixUniform = gl.getUniformLocation(this.shader, "uRMatrix");
		this.shader.mvMatrixUniform = gl.getUniformLocation(this.shader, "uMVMatrix");
		this.shader.pMatrixUniform = gl.getUniformLocation(this.shader, "uPMatrix");
		this.shader.uColor = gl.getUniformLocation(this.shader, "uColor");
		this.shader.uUseTexture = gl.getUniformLocation(this.shader, "uUseTexture");
		this.shader.uSampler = gl.getUniformLocation(this.shader, "uSampler");
		this.shader.uLightPos = gl.getUniformLocation(this.shader, "uLightPos");
		this.shader.uAmbientColor = gl.getUniformLocation(this.shader, "uAmbientColor");
		this.shader.uLightColor = gl.getUniformLocation(this.shader, "uLightColor");
		this.shader.uShininess = gl.getUniformLocation(this.shader, "uShininess");
		this.shader.uUseNormalMap = gl.getUniformLocation(this.shader, "uUseNormalMap");
		this.shader.uNormalMap = gl.getUniformLocation(this.shader, "uNormalMap");

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.mesh.textureImage);
		gl.uniform1i(this.shader.uSampler, 0);
	}
	
	// --------------------------------------------
	setMatrixUniforms() {
		super.setMatrixUniforms();
		if (this.wireActive) {
			return;
		}
		gl.uniform3f(this.shader.uColor, this.color[0], this.color[1], this.color[2]);
		gl.uniform4f(this.shader.uLightColor, this.lightColor[0], this.lightColor[1], this.lightColor[2], this.lightColor[3]);
		gl.uniform3f(this.shader.uLightPos, this.lightPos[0], this.lightPos[1], this.lightPos[2]);
		gl.uniform4f(this.shader.uAmbientColor, this.ambientLight[0], this.ambientLight[1], this.ambientLight[2], this.ambientLight[3]);
		gl.uniform1i(this.shader.uUseTexture, this.useTexture ? 1 : 0);
		gl.uniform1i(this.shader.uUseNormalMap, 0);
		gl.uniform1f(this.shader.uShininess, this.shininess);
	}
	
	// --------------------------------------------
	setColor(col) {
		this.color = col;
	}

	switchTextureState() {
		this.useTexture = !this.useTexture;
	}

	getTextureState() {
		return this.useTexture;
	}
}

// =====================================================
// MAP 3D, construit a partir d'une heightmap
// =====================================================
class map3D extends WireframeObject {
    constructor(map, position = [0, 0, 0], rotation = [0, 0, 0], color = [1, 1, 1], ampl=1.5, x=-1, y=-1, z=0, dx=2.0, dy=2.0, lightPos = [0.0,0.0,0.0], ambientLight = [0.1,0.1,0.1,1.0], lightColor = [1.0,1.0,1.0,1.0], shininess = 1024.0, waterLevel = 0.08) {
        super(position, rotation, "heightmaps");
        
        this.map = map;
        this.color = color;
        this.mesh = {
			vertices: [],
			vertexNormals: [],
			textures: [],
			indices: [],
            vertexBuffer: null,
            normalBuffer: null,
            indexBuffer: null,
			textureBuffer: null
        };
        this.width = map.length;
        this.height = map[0].length;
        this.x = x;
        this.y = y;
        this.z = z;
        this.dx = dx;
        this.dy = dy;
        this.ampl = 0.5;
		this.lightColor = lightColor;
		this.lightPos = lightPos;
		this.ambientLight = ambientLight;
		this.shininess = shininess;
		this.waterLevel = waterLevel;
		this.useTexture = true;
		this.useNormalMap = true;

        this.initAll();

        loadShaders(this);
    }

    initAll() {

        let index = 0;

        // Calcul des coordonnées
        for (let i = 0; i < this.width; i++) {
            for (let j = 0; j < this.height; j++) {
                // Coordonnées des 4 sommets formant les 2 triangles
                const x1 = this.x + ((i / this.width) * this.dx);
                const y1 = this.y + ((j / this.height) * this.dy);
                const z1 = this.map[i][j] * this.ampl;

                // On ajoute les coordonnées des sommets (2 * 3 sommets)
                this.mesh.vertices.push(x1, y1, z1);
            }
        }

		// Création des indices
		for (let i = 0; i < this.width-1; i++) {
            for (let j = 0; j < this.height-1; j++) {
				const index1 = i * this.width + j;
				const index2 = (i + 1) * this.width + j;
				const index3 = (i + 1) * this.width + j + 1;
				const index4 = i * this.width + j + 1;

				this.mesh.indices.push(index1, index2, index3);
				this.mesh.indices.push(index1, index3, index4);
			}
		}

		// Calcul des coordonnées de texture
		for (let i = 0; i < this.mesh.vertices.length; i += 3) {
			const x = this.mesh.vertices[i];
			const y = this.mesh.vertices[i + 1];
			
			const u = (x - this.x) / this.dx;
			const v = (y - this.y) / this.dy;

			this.mesh.textures.push(u, v);
		}

		// Calcul des normales
		// Version optimisable en utilisant les valeurs déjà calculées
        for (let i = 0; i < this.width; i++) {
            for (let j = 0; j < this.height; j++) {

                const ip = Math.min(i + 1, this.width - 1);
                const jp = Math.min(j + 1, this.height - 1);

                const x1 = this.x + ((i / this.width) * this.dx);
                const y1 = this.y + ((j / this.height) * this.dy);
                const z1 = this.map[i][j] * this.ampl;

                const x2 = this.x + ((ip / this.width) * this.dx);
                const y2 = this.y + ((j / this.height) * this.dy);
                const z2 = this.map[ip][j] * this.ampl;

                const x3 = this.x + ((ip / this.width) * this.dx);
                const y3 = this.y + ((jp / this.height) * this.dy);
                const z3 = this.map[ip][jp] * this.ampl;

                const x4 = this.x + ((i / this.width) * this.dx);
                const y4 = this.y + (((jp) / this.height) * this.dy);
                const z4 = this.map[i][jp] * this.ampl;
                
                const v1 = vec3.create([x2 - x1, y2 - y1, z2 - z1]);
                const v2 = vec3.create([x3 - x2, y3 - y2, z3 - z2]);
                const n1 = vec3.create();
                vec3.cross(v1, v2, n1);
                vec3.normalize(n1);

                const v3 = vec3.create([x3 - x1, y3 - y1, z3 - z1]);
                const v4 = vec3.create([x4 - x3, y4 - y3, z4 - z3]);
                const n2 = vec3.create();
                vec3.cross(v3, v4, n2);
                vec3.normalize(n2);

                const n = vec3.create();
                vec3.add(n1, n2, n);
                vec3.normalize(n);

                this.mesh.vertexNormals.push(n[0], n[1], n[2]);
            }
        }

        // Création et remplissage des buffers WebGL pour vertices et normales
		this.mesh.vertexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.mesh.vertices), gl.STATIC_DRAW);
		this.mesh.vertexBuffer.itemSize = 3;
		this.mesh.vertexBuffer.numItems = this.mesh.vertices.length / 3;

		this.mesh.normalBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.normalBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.mesh.vertexNormals), gl.STATIC_DRAW);
		this.mesh.normalBuffer.itemSize = 3;
		this.mesh.normalBuffer.numItems = this.mesh.vertexNormals.length / 3;

		this.mesh.textureBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.textureBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.mesh.textures), gl.STATIC_DRAW);
		this.mesh.textureBuffer.itemSize = 2;
		this.mesh.textureBuffer.numItems = this.mesh.textures.length / 2;

		this.mesh.indexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.mesh.indexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.mesh.indices), gl.STATIC_DRAW);
		this.mesh.indexBuffer.itemSize = 1;
		this.mesh.indexBuffer.numItems = this.mesh.indices.length;

		this.mesh.texture = load2DTextureBufferFromURL('textures/floor.jpg');
		this.mesh.heightTexture = load2DTextureBufferFromURL('textures/height_color.png');
		this.mesh.normalMap = load2DTextureBufferFromURL('normalmaps/water.jpg');
    }

    // Définir les paramètres des shaders
	setShadersParams() {
		if (this.wireActive) {
			super.setShadersParams();
			return;
		}

		gl.useProgram(this.shader);

		this.shader.vAttrib = gl.getAttribLocation(this.shader, "aVertexPosition");
		gl.enableVertexAttribArray(this.shader.vAttrib);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.vertexBuffer);
		gl.vertexAttribPointer(this.shader.vAttrib, this.mesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

		this.shader.nAttrib = gl.getAttribLocation(this.shader, "aVertexNormal");
		gl.enableVertexAttribArray(this.shader.nAttrib);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.normalBuffer);
		gl.vertexAttribPointer(this.shader.nAttrib, this.mesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

		this.shader.tAttrib = gl.getAttribLocation(this.shader, "aTextureCoord");
		gl.enableVertexAttribArray(this.shader.tAttrib);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.textureBuffer);
		gl.vertexAttribPointer(this.shader.tAttrib, this.mesh.textureBuffer.itemSize, gl.FLOAT, false, 0, 0);

		this.shader.rMatrixUniform = gl.getUniformLocation(this.shader, "uRMatrix");
		this.shader.mvMatrixUniform = gl.getUniformLocation(this.shader, "uMVMatrix");
		this.shader.pMatrixUniform = gl.getUniformLocation(this.shader, "uPMatrix");
		this.shader.uSampler = gl.getUniformLocation(this.shader, "uSampler");
		this.shader.uHeightSampler = gl.getUniformLocation(this.shader, "uHeightSampler");
		this.shader.uNormalMap = gl.getUniformLocation(this.shader, "uNormalMap");
		this.shader.uUseNormalMap = gl.getUniformLocation(this.shader, "uUseNormalMap");
		this.shader.uLightColor = gl.getUniformLocation(this.shader, "uLightColor");
		this.shader.uAmbientColor = gl.getUniformLocation(this.shader, "uAmbientColor");
		this.shader.uLightPos = gl.getUniformLocation(this.shader, "uLightPos");
		this.shader.uShininess = gl.getUniformLocation(this.shader, "uShininess");
		this.shader.uWaterLevel = gl.getUniformLocation(this.shader, "uWaterLevel");
		this.shader.uUseTexture = gl.getUniformLocation(this.shader, "uUseTexture");
		this.shader.uColor = gl.getUniformLocation(this.shader, "uColor");

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.mesh.texture);
		gl.uniform1i(this.shader.uSampler, 0);

		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, this.mesh.heightTexture);
		gl.uniform1i(this.shader.uHeightSampler, 1);

		gl.activeTexture(gl.TEXTURE2);
		gl.bindTexture(gl.TEXTURE_2D, this.mesh.normalMap);
		gl.uniform1i(this.shader.uNormalMap, 2);
	}

    // Définir les matrices des shaders
    setMatrixUniforms() {
		super.setMatrixUniforms();
		if (this.wireActive) {
			return;
		}
		gl.uniform4f(this.shader.uLightColor, this.lightColor[0], this.lightColor[1], this.lightColor[2], this.lightColor[3]);
		gl.uniform3f(this.shader.uLightPos, this.lightPos[0], this.lightPos[1], this.lightPos[2]);
		gl.uniform4f(this.shader.uAmbientColor, this.ambientLight[0], this.ambientLight[1], this.ambientLight[2], this.ambientLight[3]);
		gl.uniform1f(this.shader.uShininess, this.shininess);
		gl.uniform1i(this.shader.uUseNormalMap, this.useNormalMap ? 1 : 0);
		gl.uniform1f(this.shader.uWaterLevel, this.waterLevel);
		gl.uniform1i(this.shader.uUseTexture, this.useTexture ? 1 : 0);
		gl.uniform3f(this.shader.uColor, this.color[0], this.color[1], this.color[2]);
	}

    // Changer la couleur de l'objet
    setColor(col) {
        this.color = col;
    }

	switchTextureState() {
		this.useTexture = !this.useTexture;
	}

	getTextureState() {
		return this.useTexture;
	}

	switchNormalState() {
		this.useNormalMap = !this.useNormalMap;
	}

	getNormalState() {
		return this.useNormalMap;
	}
}


// =====================================================
// BOITE ENGLOBEANTE
// =====================================================

class BoundingBox extends WireframeObject {
	constructor(position = [0, 0, 0], rotation = [0, 0, 0], color = [1, 1, 1], x=-1, y=-1, z=0, dx=2.0, dy=2.0, dz=2.0, amplitude = 0.1) {
		super(position, rotation, 'box');
		this.color = color;
		this.amplitude = amplitude;
		this.x = x;
		this.y = y;
		this.z = z;
		this.dx = dx;
		this.dy = dy;
		this.dz = dz;

		this.mesh = {};
		this.useTexture = true;

		this.initAll();
		loadShaders(this);
	}

	initAll() {
		this.mesh.vertices = [
			this.x, this.y, this.z,
			this.x + this.dx, this.y, this.z,
			this.x + this.dx, this.y + this.dy, this.z,
			this.x, this.y + this.dy, this.z,
			this.x, this.y, this.z + this.dz,
			this.x + this.dx, this.y, this.z + this.dz,
			this.x + this.dx, this.y + this.dy, this.z + this.dz,
			this.x, this.y + this.dy, this.z + this.dz
		];

		this.mesh.indices = [
			0, 2, 1,
			0, 3, 2,
			0, 1, 4,
			0, 4, 3,
			1, 2, 6,
			1, 5, 4,
			1, 6, 5,
			2, 3, 6,
			3, 4, 7,
			3, 7, 6,
			4, 5, 7,
			5, 6, 7
		];

		this.mesh.normals = [
			-1.0, -1.0, -1.0,
			1.0, -1.0, -1.0,
			1.0, 1.0, -1.0,
			-1.0, 1.0, -1.0,
			-1.0, -1.0, 1.0,
			1.0, -1.0, 1.0,
			1.0, 1.0, 1.0,
			-1.0, 1.0, 1.0
		];

		this.mesh.vertexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.mesh.vertices), gl.STATIC_DRAW);
		this.mesh.vertexBuffer.itemSize = 3;
		this.mesh.vertexBuffer.numItems = this.mesh.vertices.length / 3;

		this.mesh.indexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.mesh.indexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.mesh.indices), gl.STATIC_DRAW);
		this.mesh.indexBuffer.itemSize = 1;
		this.mesh.indexBuffer.numItems = this.mesh.indices.length;

		this.mesh.normalBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.normalBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.mesh.normals), gl.STATIC_DRAW);
		this.mesh.normalBuffer.itemSize = 3;
		this.mesh.vertexBuffer.numItems = this.mesh.normals.length / 3;

		this.mesh.heightmap = load2DTextureBufferFromImage(selectedHeightmapImage);
		this.mesh.texture = load2DTextureBufferFromURL('textures/floor.jpg');
		this.mesh.heightTexture = load2DTextureBufferFromURL('textures/height_color.png');
		this.mesh.normalMap = load2DTextureBufferFromURL('normalmaps/water.jpg');
	}

	setShadersParams() {
		if (this.wireActive) {
			super.setShadersParams();
			return;
		}

		gl.useProgram(this.shader);

		this.shader.vAttrib = gl.getAttribLocation(this.shader, "aVertexPosition");
		gl.enableVertexAttribArray(this.shader.vAttrib);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.vertexBuffer);
		gl.vertexAttribPointer(this.shader.vAttrib, this.mesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

		this.shader.nAttrib = gl.getAttribLocation(this.shader, "aVertexNormal");
		gl.enableVertexAttribArray(this.shader.nAttrib);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.normalBuffer);
		gl.vertexAttribPointer(this.shader.nAttrib, this.mesh.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);
		
		this.shader.rMatrixUniform = gl.getUniformLocation(this.shader, "uRMatrix");
		this.shader.mvMatrixUniform = gl.getUniformLocation(this.shader, "uMVMatrix");
		this.shader.pMatrixUniform = gl.getUniformLocation(this.shader, "uPMatrix");
		this.shader.uColor = gl.getUniformLocation(this.shader, "uColor");
		this.shader.uUseTexture = gl.getUniformLocation(this.shader, "uUseTexture");
		this.shader.uHeightmap = gl.getUniformLocation(this.shader, "uHeightmap");
		this.shader.uLightPos = gl.getUniformLocation(this.shader, "uLightPos");
		this.shader.uAmbientColor = gl.getUniformLocation(this.shader, "uAmbientColor");
		this.shader.uLightColor = gl.getUniformLocation(this.shader, "uLightColor");
		this.shader.uShininess = gl.getUniformLocation(this.shader, "uShininess");
		this.shader.uUseNormalMap = gl.getUniformLocation(this.shader, "uUseNormalMap");
		this.shader.uNormalMap = gl.getUniformLocation(this.shader, "uNormalMap");
		this.shader.uCameraParams = gl.getUniformLocation(this.shader, "uCameraParams");
		this.shader.uAmplitude = gl.getUniformLocation(this.shader, "uAmplitude");
		this.shader.uSampler = gl.getUniformLocation(this.shader, "uSampler");
		this.shader.uHeightSampler = gl.getUniformLocation(this.shader, "uHeightSampler");
		this.shader.uWaterLevel = gl.getUniformLocation(this.shader, "uWaterLevel");

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.mesh.heightmap);
		gl.uniform1i(this.shader.uHeightmap, 0);

		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, this.mesh.texture);
		gl.uniform1i(this.shader.uSampler, 1);

		gl.activeTexture(gl.TEXTURE2);
		gl.bindTexture(gl.TEXTURE_2D, this.mesh.heightTexture);
		gl.uniform1i(this.shader.uHeightSampler, 2);

		gl.activeTexture(gl.TEXTURE3);
		gl.bindTexture(gl.TEXTURE_2D, this.mesh.normalMap);
		gl.uniform1i(this.shader.uNormalMap, 3);
	}
	
	// --------------------------------------------
	setMatrixUniforms() {
		super.setMatrixUniforms();
		if (this.wireActive) {
			return;
		}
		gl.uniform3f(this.shader.uColor, this.color[0], this.color[1], this.color[2]);
		gl.uniform3f(this.shader.uCameraParams, canvas.width, canvas.height, 45.0);
		gl.uniform1f(this.shader.uAmplitude, this.amplitude);
		gl.uniform4f(this.shader.uLightColor, 1.0, 1.0, 1.0, 1.0);
		gl.uniform3f(this.shader.uLightPos, -0.5, -1.0, 2.0);
		gl.uniform4f(this.shader.uAmbientColor, 0.2, 0.2, 0.2, 1.0);
		gl.uniform1i(this.shader.uUseTexture, this.useTexture ? 1 : 0);
		gl.uniform1i(this.shader.uUseNormalMap, 1);
		gl.uniform1f(this.shader.uShininess, 320.0);
		gl.uniform1f(this.shader.uWaterLevel, 0.08);
	}

	setColor(col) {
		this.color = col;
	}

	switchTextureState() {
		this.useTexture = !this.useTexture;
	}

	getTextureState() {
		return this.useTexture;
	}

	setAmplitude(amp) {
		this.amplitude = amp;
	}

	getAmplitude() {
		return this.amplitude;
	}
}

// =====================================================
// BOITE ENGLOBEANTE VOLUMIQUE
// =====================================================

class VolumeBox extends WireframeObject {
	constructor(position = [0, 0, 0], rotation = [0, 0, 0], color = [1, 1, 1], x=-1, y=-1, z=0, dx=2.0, dy=2.0, dz=2.0, amplitude = 0.1) {
		super(position, rotation, 'volume');
		this.color = color;
		this.amplitude = amplitude;
		this.x = x;
		this.y = y;
		this.z = z;
		this.dx = dx;
		this.dy = dy;
		this.dz = dz;

		this.mesh = {};
		this.useTexture = true;
		this.resolution = 512.0;

		this.initAll().then(() => {
			loadShaders(this);
		});
	}

	async initAll() {
		this.mesh.vertices = [
			this.x, this.y, this.z,
			this.x + this.dx, this.y, this.z,
			this.x + this.dx, this.y + this.dy, this.z,
			this.x, this.y + this.dy, this.z,
			this.x, this.y, this.z + this.dz,
			this.x + this.dx, this.y, this.z + this.dz,
			this.x + this.dx, this.y + this.dy, this.z + this.dz,
			this.x, this.y + this.dy, this.z + this.dz
		];

		this.mesh.indices = [
			0, 2, 1,
			0, 3, 2,
			0, 1, 4,
			0, 4, 3,
			1, 2, 6,
			1, 5, 4,
			1, 6, 5,
			2, 3, 6,
			3, 4, 7,
			3, 7, 6,
			4, 5, 7,
			5, 6, 7
		];

		this.mesh.normals = [
			-1.0, -1.0, -1.0,
			1.0, -1.0, -1.0,
			1.0, 1.0, -1.0,
			-1.0, 1.0, -1.0,
			-1.0, -1.0, 1.0,
			1.0, -1.0, 1.0,
			1.0, 1.0, 1.0,
			-1.0, 1.0, 1.0
		];

		this.mesh.vertexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.mesh.vertices), gl.STATIC_DRAW);
		this.mesh.vertexBuffer.itemSize = 3;
		this.mesh.vertexBuffer.numItems = this.mesh.vertices.length / 3;

		this.mesh.indexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.mesh.indexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.mesh.indices), gl.STATIC_DRAW);
		this.mesh.indexBuffer.itemSize = 1;
		this.mesh.indexBuffer.numItems = this.mesh.indices.length;

		this.mesh.normalBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.normalBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.mesh.normals), gl.STATIC_DRAW);
		this.mesh.normalBuffer.itemSize = 3;
		this.mesh.vertexBuffer.numItems = this.mesh.normals.length / 3;

		// this.mesh.heightmap = load2DTextureBufferFromImage(selectedHeightmapImage);
		// this.mesh.texture = load2DTextureBufferFromURL('textures/floor.jpg');
		// this.mesh.heightTexture = load2DTextureBufferFromURL('textures/height_color.png');
		// this.mesh.normalMap = load2DTextureBufferFromURL('normalmaps/water.jpg');

		this.mesh.volumeTexture = await loadRawFile('raw/noisette.raw', 512, 512, 512).then((data) => {
			return data;
		});
	}

	setShadersParams() {
		if (this.wireActive) {
			super.setShadersParams();
			return;
		}

		gl.useProgram(this.shader);

		this.shader.vAttrib = gl.getAttribLocation(this.shader, "aVertexPosition");
		gl.enableVertexAttribArray(this.shader.vAttrib);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.vertexBuffer);
		gl.vertexAttribPointer(this.shader.vAttrib, this.mesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

		// this.shader.nAttrib = gl.getAttribLocation(this.shader, "aVertexNormal");
		// gl.enableVertexAttribArray(this.shader.nAttrib);
		// gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.normalBuffer);
		// gl.vertexAttribPointer(this.shader.nAttrib, this.mesh.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);
		
		this.shader.rMatrixUniform = gl.getUniformLocation(this.shader, "uRMatrix");
		this.shader.mvMatrixUniform = gl.getUniformLocation(this.shader, "uMVMatrix");
		this.shader.pMatrixUniform = gl.getUniformLocation(this.shader, "uPMatrix");
		this.shader.uClearColor = gl.getUniformLocation(this.shader, "uClearColor");
		this.shader.uNbSamplers = gl.getUniformLocation(this.shader, "uNbSamplers");
		this.shader.uResolution = gl.getUniformLocation(this.shader, "uResolution");
		// this.shader.uUseTexture = gl.getUniformLocation(this.shader, "uUseTexture");
		// this.shader.uHeightmap = gl.getUniformLocation(this.shader, "uHeightmap");
		// this.shader.uLightPos = gl.getUniformLocation(this.shader, "uLightPos");
		// this.shader.uAmbientColor = gl.getUniformLocation(this.shader, "uAmbientColor");
		// this.shader.uLightColor = gl.getUniformLocation(this.shader, "uLightColor");
		// this.shader.uShininess = gl.getUniformLocation(this.shader, "uShininess");
		// this.shader.uUseNormalMap = gl.getUniformLocation(this.shader, "uUseNormalMap");
		// this.shader.uNormalMap = gl.getUniformLocation(this.shader, "uNormalMap");
		this.shader.uCameraParams = gl.getUniformLocation(this.shader, "uCameraParams");

		this.shader.uVolumeSampler = gl.getUniformLocation(this.shader, 'uVolumeSampler');
		this.shader.uTransfertColor = gl.getUniformLocation(this.shader, 'uTransfertColor');
		this.shader.uMinThreshold = gl.getUniformLocation(this.shader, 'uMinThreshold');
		this.shader.uMaxThreshold = gl.getUniformLocation(this.shader, 'uMaxThreshold');

		// this.shader.uAmplitude = gl.getUniformLocation(this.shader, "uAmplitude");
		// this.shader.uSampler = gl.getUniformLocation(this.shader, "uSampler");
		// this.shader.uHeightSampler = gl.getUniformLocation(this.shader, "uHeightSampler");
		// this.shader.uWaterLevel = gl.getUniformLocation(this.shader, "uWaterLevel");

		// gl.activeTexture(gl.TEXTURE0);
		// gl.bindTexture(gl.TEXTURE_2D, this.mesh.heightmap);
		// gl.uniform1i(this.shader.uHeightmap, 0);

		// gl.activeTexture(gl.TEXTURE1);
		// gl.bindTexture(gl.TEXTURE_2D, this.mesh.texture);
		// gl.uniform1i(this.shader.uSampler, 1);

		// gl.activeTexture(gl.TEXTURE2);
		// gl.bindTexture(gl.TEXTURE_2D, this.mesh.heightTexture);
		// gl.uniform1i(this.shader.uHeightSampler, 2);

		// gl.activeTexture(gl.TEXTURE3);
		// gl.bindTexture(gl.TEXTURE_2D, this.mesh.normalMap);
		// gl.uniform1i(this.shader.uNormalMap, 3);

		// Passer la texture 3D au shader
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_3D, this.mesh.volumeTexture);
		gl.uniform1i(this.shader.uVolumeSampler, 0);  // Passe la texture 3D à l'uniforme 'textures'

	}
	
	// --------------------------------------------
	setMatrixUniforms() {
		super.setMatrixUniforms();
		if (this.wireActive) {
			return;
		}
		gl.uniform4f(this.shader.uClearColor, 0.78, 0.89, 0.91, 1.0);
		gl.uniform3f(this.shader.uCameraParams, canvas.width, canvas.height, 45.0);
		gl.uniform1f(this.shader.uResolution, this.resolution);
		gl.uniform4fv(this.shader.uTransfertColor, getColorRamp());
		gl.uniform1f(this.shader.uMinThreshold, getColorThreshMin());
		gl.uniform1f(this.shader.uMaxThreshold, getColorThreshMax());
		// gl.uniform1f(this.shader.uAmplitude, this.amplitude);
		// gl.uniform4f(this.shader.uLightColor, 1.0, 1.0, 1.0, 1.0);
		// gl.uniform3f(this.shader.uLightPos, -0.5, -1.0, 2.0);
		// gl.uniform4f(this.shader.uAmbientColor, 0.2, 0.2, 0.2, 1.0);
		// gl.uniform1i(this.shader.uUseTexture, this.useTexture ? 1 : 0);
		// gl.uniform1i(this.shader.uUseNormalMap, 1);
		// gl.uniform1f(this.shader.uShininess, 320.0);
		// gl.uniform1f(this.shader.uWaterLevel, 0.08);
	}

	setResolution(res) {
		this.resolution = res;
	}

	getResolution() {
		return this.resolution;
	}

	setColor(col) {
		this.color = col;
	}

	switchTextureState() {
		this.useTexture = !this.useTexture;
	}

	getTextureState() {
		return this.useTexture;
	}

	setAmplitude(amp) {
		this.amplitude = amp;
	}

	getAmplitude() {
		return this.amplitude;
	}
}