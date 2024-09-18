
bumpmap sur lambert (voir photo)


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

		let scale = 1;


        // Calcul des coordonnées
        for (let i = 0; i < this.width - scale; i+=scale*2) {
            for (let j = 0; j < this.height - scale; j+=scale*2) {
                // Coordonnées des 4 sommets formant les 2 triangles
                const x1 = this.x + ((i / this.width) * this.dx);
                const y1 = this.y + ((j / this.height) * this.dy);
                const z1 = this.map[i][j] * this.ampl;

                const x2 = this.x + (((i + scale) / this.width) * this.dx);
                const y2 = y1;
                const z2 = this.map[i + scale][j] * this.ampl;

                const x3 = x1;
                const y3 = this.y + (((j + scale) / this.height) * this.dy);
                const z3 = this.map[i][j + scale] * this.ampl;


                const x4 = x2;
                const y4 = y3;
                const z4 = this.map[i + scale][j + scale] * this.ampl;

                // On ajoute les coordonnées des sommets (2 * 3 sommets)
                this.mesh.vertices.push(x1, y1, z1);
                this.mesh.vertices.push(x2, y2, z2);
				this.mesh.vertices.push(x3, y3, z3);

                this.mesh.vertices.push(x4, y4, z4);

                // Ajout des indices
                this.mesh.indices.push(index, index+1, index+2);
                this.mesh.indices.push(index+1, index+3, index+2);

				index += 4;

                // Calcul des normales
                const n1 = vec3.create();
                const n2 = vec3.create();
                const n3 = vec3.create();
                const n4 = vec3.create();

                // Calcul des normales
				const v1x = x2 - x1;
				const v1y = y2 - y1;
				const v1z = z2 - z1;

				const v2x = x3 - x1;
				const v2y = y3 - y1;
				const v2z = z3 - z1;

				const nx = v1y * v2z - v1z * v2y;
				const ny = v1z * v2x - v1x * v2z;
				const nz = v1x * v2y - v1y * v2x;

				const length = Math.sqrt(nx * nx + ny * ny + nz * nz);
				const normal = [nx / length, ny / length, nz / length];

				// Ajout des normales
				this.mesh.vertexNormals.push(normal[0], normal[1], normal[2]);
				this.mesh.vertexNormals.push(normal[0], normal[1], normal[2]);
				this.mesh.vertexNormals.push(normal[0], normal[1], normal[2]);

				this.mesh.vertexNormals.push(normal[0], normal[1], normal[2]);
				// this.mesh.vertexNormals.push(normal[0], normal[1], normal[2]);
				// this.mesh.vertexNormals.push(normal[0], normal[1], normal[2]);

				// Ajout des textures
				this.mesh.textures.push(0, 0);
				this.mesh.textures.push(1, 0);
				this.mesh.textures.push(0, 1);

				this.mesh.textures.push(1, 0);
				this.mesh.textures.push(1, 1);
				this.mesh.textures.push(0, 1);
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
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.mesh.indices), gl.STATIC_DRAW);
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



// Calcul des normales
		for (let i = 0; i < this.width - scale; i+=scale) {
            for (let j = 0; j < this.height - scale; j+=scale) {
				const x1 = this.x + ((i / this.width) * this.dx);
				const y1 = this.y + ((j / this.height) * this.dy);
				const z1 = this.map[i][j] * this.ampl;

				const x2 = this.x + (((i + scale) / this.width) * this.dx);
				const y2 = this.y + ((j / this.height) * this.dy);
				const z2 = this.map[i + scale][j] * this.ampl;

				const x3 = this.x + (((i + scale) / this.width) * this.dx);
				const y3 = this.y + (((j + scale) / this.height) * this.dy);
				const z3 = this.map[i + scale][j + scale] * this.ampl;

				const x4 = this.x + ((i / this.width) * this.dx);
				const y4 = this.y + (((j + scale) / this.height) * this.dy);
				const z4 = this.map[i][j + scale] * this.ampl;
				
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