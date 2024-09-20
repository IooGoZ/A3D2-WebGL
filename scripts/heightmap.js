// Author : Tom BOIREAU

var heightmapFolder = "heightmaps/";

var selectedHeightmap = null;

var resultElem = null;

// =====================================================
// FONCTIONS GENERALES, INITIALISATIONS
// =====================================================

function initHeightmap() {

    // Initialisation des éléments HTML
    resultElem = document.getElementById("heightmap-result");

    // Charger la heightmap
    loadImage("texture1.png");
}

// =====================================================
// FONCTIONS DE SELECTION
// =====================================================

// =====================================================
function getHeightmap() {
    return selectedHeightmap;
}

// =====================================================
function loadImage(imgName, divider=1) {
    var img = new Image();
    img.src = heightmapFolder + imgName;
    img.onload = function() {
        var ctx = resultElem.getContext("2d");
        resultElem.width = img.width;
        resultElem.height = img.height;
        ctx.drawImage(img, 0, 0);

        selectedHeightmap = new Array(img.width/divider);

        for (var i=0; i<img.width; i+=divider) {
            selectedHeightmap[i/divider] = new Array(img.height/divider);
            for (var j=0; j<img.height; j+=divider) {
                var sum = 0;
                for (var k=0; k<divider; k++) {
                    for (var l=0; l<divider; l++) {
                        var data = ctx.getImageData(i+k, j+l, 1, 1).data;
                        var height = data[0] / 255.0;
                        sum += height;
                    }
                }
                var height = sum / (divider*divider);
                selectedHeightmap[i/divider][j/divider] = height;
            }
        }

    }
}

// =====================================================
function generateHeightmap(seed, scale = 1, amplitude = 1, persistence = 0.5, lacunarity = 2, width=512, height=512) {
    var heightmap = new Array(width);
    var perlin = new SquareNoise(scale, amplitude, seed, width, height);

    var ctx = resultElem.getContext("2d");
    resultElem.width = width;
    resultElem.height = height;

    ctx.clearRect(0, 0, width, height);

    for (var i=0; i<width; i++) {
        heightmap[i] = new Array(height);
        for (var j=0; j<height; j++) {
            var x = i / width;
            var y = j / height;
            var noise = perlin.noise(x, y);

            if (noise < 0) noise *= -0;

            heightmap[i][j] = noise;

            ctx.fillStyle = "rgb(" + Math.floor(255*noise) + "," + Math.floor(255*noise) + "," + Math.floor(255*noise) + ")";
            ctx.fillRect(i, j, 1, 1);
        }
    }

    selectedHeightmap = heightmap;
}

// =====================================================
function handleGeneratePerlin() {
    var seed = parseInt(document.getElementById("perlin-seed").value);
    var scale = parseFloat(document.getElementById("perlin-scale").value);
    var amplitude = parseFloat(document.getElementById("perlin-amplitude").value);
    var persistence = parseFloat(document.getElementById("perlin-persistence").value);
    var lacunarity = parseFloat(document.getElementById("perlin-lacunarity").value);

    generateHeightmap(seed, scale, amplitude, persistence, lacunarity);
}


// =====================================================
// BRUIT 2D (Maison)
// =====================================================

class SquareNoise {
    constructor(scale = 1, amplitude = 1, seed = 0, pass=3, width=512, height=512) {
        this.scale = scale;
        this.amplitude = amplitude;
        this.seed = seed;
        this.pass = pass;
        this.width = width;
        this.height = height;

        this.indSeed = this.seed%13+1;

        this.min = Number.MAX_VALUE;
        this.max = Number.MIN_VALUE;

        this.matrix = new Array(this.width);
        for (var i=0; i<this.width; i++) {
            this.matrix[i] = new Array(this.height);
            for (var j=0; j<this.height; j++) {
                this.matrix[i][j] = 0;
            }
        }

        this.generate();
    }

    // =====================================================
    seededRandom() {
        var res = Math.sin(this.seed + this.indSeed++) * 10000;
        res ^= res >> 13;
        res = res%2 - 1;
        return res;
    }


    // =====================================================
    addMatrix(matrix) {  
        for (var i=0; i<this.width; i++) {
            for (var j=0; j<this.height; j++) {
                this.matrix[i][j] += matrix[i][j];
            }
        }
    }

    applyConvolution(kernel) {
        for (var i=0; i<this.width; i++) {
            for (var j=0; j<this.height; j++) {
                var sum = 0;
                var div = 0;
                for (var k=0; k<kernel.length; k++) {
                    for (var l=0; l<kernel[k].length; l++) {
                        var x = i + k - Math.floor(kernel.length/2);
                        var y = j + l - Math.floor(kernel[k].length/2);
                        div += kernel[k][l];
                        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
                            sum += kernel[k][l] * this.matrix[x][y];
                        } else {
                            sum += kernel[k][l] * this.matrix[i][j];
                        }
                    }
                }
                var v = sum / div;
                this.matrix[i][j] = v;
                if (v < this.min) this.min = v;
                if (v > this.max) this.max = v;
            }
        }
    }


    // =====================================================
    generate() {
        var noise = new Array(this.width);
        var deltaX = this.seededRandom() * 2 * Math.PI;
        var deltaY = this.seededRandom() * 2 * Math.PI;

        var repX = this.seededRandom();
        var repY = this.seededRandom();

        for (var i=0; i<this.width; i++) {
            noise[i] = new Array(this.height);
            for (var j=0; j<this.height; j++) {
                noise[i][j] = this.seededRandom() * Math.sin(i/this.width * deltaX) * Math.sin(j/this.height * deltaY);
                deltaX += repX;
                deltaY += repY;
            }
        }
        this.addMatrix(noise);

        for (var i = 0 ; i < 10 ; i++) {
            var canny = [
                [0, 1, 0],
                [1, 1, 1],
                [0, 1, 0]
            ];
            this.applyConvolution(canny);

            var gaussian = [
                [1, 2, 1],
                [2, 12, 2],
                [1, 2, 1]
            ];
            this.applyConvolution(gaussian);
        }

        
    }
    

    // =====================================================
    noise(x, y) {

        return this.matrix[Math.floor(x * this.width)][Math.floor(y * this.height)] * this.amplitude;
    }

}