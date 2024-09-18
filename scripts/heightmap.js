// Author : Tom BOIREAU

var heightmapFolder = "/heightmaps/";

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
    var perlin = new PerlinNoise(scale, amplitude, persistence, lacunarity, seed);

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

            if (noise < 0) noise *= -1;
            
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
// BRUIT DE PERLIN
// =====================================================

class PerlinNoise {
    constructor(scale = 1, amplitude = 1, persistence = 0.5, lacunarity = 2, seed = 0) {
        this.scale = scale;
        this.amplitude = amplitude;
        this.persistence = persistence;
        this.lacunarity = lacunarity;
        this.seed = seed;

        // Tableaux de permutations
        this.permutation = [];
        this.permutationTable = [];

        // Générer la table de permutation en fonction de la seed
        this.generatePermutationTable();
    }

    // Générer une table de permutations avec une seed
    generatePermutationTable() {
        // Fonction pseudo-aléatoire basée sur la seed
        const pseudoRandom = this.seededRandom(this.seed);

        // Remplissage d'un tableau avec des valeurs 0-255
        for (let i = 0; i < 256; i++) {
            this.permutation[i] = i;
        }

        // Mélanger les valeurs en fonction de la seed
        for (let i = 255; i > 0; i--) {
            const j = Math.floor(pseudoRandom() * (i + 1));
            [this.permutation[i], this.permutation[j]] = [this.permutation[j], this.permutation[i]];
        }

        // Dupliquer la table pour éviter les débordements
        for (let i = 0; i < 512; i++) {
            this.permutationTable[i] = this.permutation[i % 256];
        }
    }

    // Fonction pour créer un générateur pseudo-aléatoire basé sur une seed
    seededRandom(seed) {
        return function() {
            // Implémentation simple du générateur de nombres pseudo-aléatoires (LCG)
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };
    }

    fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    lerp(t, a, b) {
        return a + t * (b - a);
    }

    grad(hash, x, y) {
        const h = hash & 3;
        const u = h < 2 ? x : y;
        const v = h < 2 ? y : x;
        return (h & 1 ? -u : u) + (h & 2 ? -v : v);
    }

    noise(x, y) {
        x *= this.scale;
        y *= this.scale;

        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;

        const xf = x - Math.floor(x);
        const yf = y - Math.floor(y);

        const u = this.fade(xf);
        const v = this.fade(yf);

        const aa = this.permutationTable[X + this.permutationTable[Y]];
        const ab = this.permutationTable[X + this.permutationTable[Y + 1]];
        const ba = this.permutationTable[X + 1 + this.permutationTable[Y]];
        const bb = this.permutationTable[X + 1 + this.permutationTable[Y + 1]];

        const x1 = this.lerp(u, this.grad(aa, xf, yf), this.grad(ba, xf - 1, yf));
        const x2 = this.lerp(u, this.grad(ab, xf, yf - 1), this.grad(bb, xf - 1, yf - 1));
        return this.lerp(v, x1, x2) * this.amplitude;
    }
}