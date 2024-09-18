// Autor: Tom BOIREAU (sur la base d'un code fourni par Nicolas COURILLEAU)

var shadersFolder = '/shaders/';
var objFolder = '/objects/';

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
		}
	}

	xhttp.open("GET", url, true);
	xhttp.send();
}

// =====================================================
function loadShaders(Obj3D) {
	loadShaderText(Obj3D,'.vs');
	loadShaderText(Obj3D,'.fs');
}

// =====================================================
function loadShaderText(Obj3D,ext) {   // lecture asynchrone...
  var xhttp = new XMLHttpRequest();
  
  const url = shadersFolder + Obj3D.shaderName + ext;

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
// OBJET 3D, lecture fichier obj
// =====================================================
class objmesh extends ThreeDObject {

	// --------------------------------------------
	constructor(objFname, position = vec3.create([0,0,0]), rotation = vec3.create([0,0,0]), color = vec3.create([1,1,1])) {
		super(position, rotation);

		this.objFname = objFname;
		this.color = color;

		this.initAll();
		loadShaders(this);
	}

	initAll() {
		loadObjFile(this);
	}

	setShadersParams() {
		gl.useProgram(this.shader);

		this.shader.vAttrib = gl.getAttribLocation(this.shader, "aVertexPosition");
		gl.enableVertexAttribArray(this.shader.vAttrib);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.vertexBuffer);
		gl.vertexAttribPointer(this.shader.vAttrib, this.mesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

		this.shader.nAttrib = gl.getAttribLocation(this.shader, "aVertexNormal");
		gl.enableVertexAttribArray(this.shader.nAttrib);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.normalBuffer);
		gl.vertexAttribPointer(this.shader.nAttrib, this.mesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

		this.shader.rMatrixUniform = gl.getUniformLocation(this.shader, "uRMatrix");
		this.shader.mvMatrixUniform = gl.getUniformLocation(this.shader, "uMVMatrix");
		this.shader.pMatrixUniform = gl.getUniformLocation(this.shader, "uPMatrix");
		this.shader.uColor = gl.getUniformLocation(this.shader, "uColor");
	}
	
	// --------------------------------------------
	setMatrixUniforms() {
		super.setMatrixUniforms();
		gl.uniform3f(this.shader.uColor, this.color[0], this.color[1], this.color[2]);
	}
	
	// --------------------------------------------
	setColor(col) {
		this.color = col;
	}
}

// =====================================================
// PLAN 3D
// =====================================================

class plane extends ThreeDObject{
	
	// --------------------------------------------
	constructor(x=-1, y=-1, z=0, dx=2.0, dy=2.0, position = vec3.create([0,0,0]), rotation = vec3.create([0,0,0])) {
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
// MAP 3D, construit a partir d'une heightmap
// =====================================================
class map3D extends ThreeDObject {
    constructor(map, position = vec3.create([0, 0, 0]), rotation = vec3.create([0, 0, 0]), color = vec3.create([1, 1, 1]), ampl=1.5, x=-1, y=-1, z=0, dx=2.0, dy=2.0) {
        super(position, rotation);
        
        this.map = map;
        this.color = color;
        this.mesh = {
			vertices: [],
			vertexNormals: [],
			textures: [],
			indices: [],
            vertexBuffer: null,
            normalBuffer: null,
            indexBuffer: null
        };
        this.width = map.length;
        this.height = map[0].length;
        this.x = x;
        this.y = y;
        this.z = z;
        this.dx = dx;
        this.dy = dy;
        this.ampl = 0.5;

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

		// Calcul des normales (en utilisant les indices)
		// Calcul des coordonnées
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

		// this.mesh.textureBuffer = gl.createBuffer();
		// gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.textureBuffer);
		// gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.mesh.textures), gl.STATIC_DRAW);
		// this.mesh.textureBuffer.itemSize = 2;
		// this.mesh.textureBuffer.numItems = this.mesh.textures.length / 2;

		this.mesh.indexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.mesh.indexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.mesh.indices), gl.STATIC_DRAW);
		this.mesh.indexBuffer.itemSize = 1;
		this.mesh.indexBuffer.numItems = this.mesh.indices.length;
    }

    // Définir les paramètres des shaders
	setShadersParams() {
		gl.useProgram(this.shader);

		this.shader.vAttrib = gl.getAttribLocation(this.shader, "aVertexPosition");
		gl.enableVertexAttribArray(this.shader.vAttrib);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.vertexBuffer);
		gl.vertexAttribPointer(this.shader.vAttrib, this.mesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

		this.shader.nAttrib = gl.getAttribLocation(this.shader, "aVertexNormal");
		gl.enableVertexAttribArray(this.shader.nAttrib);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.normalBuffer);
		gl.vertexAttribPointer(this.shader.nAttrib, this.mesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

		this.shader.rMatrixUniform = gl.getUniformLocation(this.shader, "uRMatrix");
		this.shader.mvMatrixUniform = gl.getUniformLocation(this.shader, "uMVMatrix");
		this.shader.pMatrixUniform = gl.getUniformLocation(this.shader, "uPMatrix");
		this.shader.uColor = gl.getUniformLocation(this.shader, "uColor");
	}

    // Définir les matrices des shaders
    setMatrixUniforms() {
		super.setMatrixUniforms();
		gl.uniform3f(this.shader.uColor, this.color[0], this.color[1], this.color[2]);
	}

    // Changer la couleur de l'objet
    setColor(col) {
        this.color = col;
    }
}

