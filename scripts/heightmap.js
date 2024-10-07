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

let width = 512;
let height = 512;
let Ggradients = generateGradients(width, height);

function resetGradients() {
    Ggradients = generateGradients(width, height);
    handleGeneratePerlin();
}


// =====================================================
function generateHeightmap(scale = 1, amplitude = 1, persistence = 0.5, octave = 2, contrast = 0.5) {
    var heightmap = new Array(width);

    var ctx = resultElem.getContext("2d");
    resultElem.width = width;
    resultElem.height = height;

    const gradients = Ggradients;

    ctx.clearRect(0, 0, width + 1, height + 1);

    for (var i=0; i<width; i++) {
        heightmap[i] = new Array(height);
        for (var j=0; j<height; j++) {
            let noise = perlinOctaves(i * scale, j * scale, gradients, octave, persistence) * amplitude;
            noise = adjustContrast(noise, contrast);
            // Normalisation entre -1 et 1, puis 0 à 1
            //noise = noise ;
            //noise = Math.max(0, Math.min(1, noise));

            heightmap[i][j] = noise;

            // Utiliser le bruit pour définir une couleur en niveaux de gris
            let colorValue = Math.floor(255 * noise);
            ctx.fillStyle = `rgb(${colorValue}, ${colorValue}, ${colorValue})`;
            ctx.fillRect(i, j, 1, 1);
        }
    }

    selectedHeightmap = heightmap;
}
    

// =====================================================
function handleGeneratePerlin() {
    var scale = parseFloat(document.getElementById("perlin-scale").value);
    var amplitude = parseFloat(document.getElementById("perlin-amplitude").value);
    var persistence = parseFloat(document.getElementById("perlin-persistence").value);
    var octave = parseFloat(document.getElementById("perlin-octaves").value);
    var contrast = parseFloat(document.getElementById("perlin-contrast").value);

    generateHeightmap(scale, amplitude, persistence, octave, contrast);
}

// BRUIT DE PERLIN =====================================================
// Cette partie du code est basée sur le pseudo-code de l'article Wikipedia sur le bruit de Perlin
// https://fr.wikipedia.org/wiki/Bruit_de_Perlin#Pseudo-code
// Il a enssuite été amélioré avec ChatGPT et des ajustements personnels
// Il est donc demandé à l'évaluateur de ne pas inclure cette portion de code dans la notation
// =====================================================================

function adjustContrast(value, factor) {
    //value = Math.max(0, Math.min(1, value));
    value = (value + 1) / 2;

    if (factor < 0) {
        return Math.pow(value, 1 - factor);
    } else {
        return Math.pow(value, 1 + factor);
    }
}


function perlinOctaves(x, y, gradients, octaves, persistence) {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
        total += perlin(x * frequency, y * frequency, gradients) * amplitude;

        maxValue += amplitude;

        amplitude *= persistence;
        frequency *= 2;
    }

    return total / maxValue;
}

function smoothstep(w) {
    if (w <= 0.0) return 0.0;
    if (w >= 1.0) return 1.0;
    return w * w * (3.0 - 2.0 * w);
}

function interpolate(a0, a1, w) {
    return a0 + (a1 - a0) * w;
}

function dotGridGradient(ix, iy, x, y, gradients) {
    if (ix < 0 || ix >= gradients[0].length || iy < 0 || iy >= gradients.length) {
        return 0;
    }

    const Gradient = gradients;

    const dx = x - ix;
    const dy = y - iy;

    return (dx * Gradient[iy][ix][0] + dy * Gradient[iy][ix][1]);
}

function perlin(x, y, gradients) {
    const x0 = Math.floor(x);
    const x1 = x0 + 1;
    const y0 = Math.floor(y);
    const y1 = y0 + 1;

    const sx = x - x0;
    const sy = y - y0;

    let n0, n1, ix0, ix1, value;
    n0 = dotGridGradient(x0, y0, x, y, gradients);
    n1 = dotGridGradient(x1, y0, x, y, gradients);
    ix0 = interpolate(n0, n1, sx);
    n0 = dotGridGradient(x0, y1, x, y, gradients);
    n1 = dotGridGradient(x1, y1, x, y, gradients);
    ix1 = interpolate(n0, n1, sx);
    value = interpolate(ix0, ix1, sy);

    return value;
}

function generateGradients(gridWidth, gridHeight) {
    const gradients = [];
    
    for (let y = 0; y <= gridHeight; y++) {
        const row = [];
        for (let x = 0; x <= gridWidth; x++) {
            const angle = Math.random() * 2 * Math.PI;

            const gradient = [Math.cos(angle), Math.sin(angle)];
            row.push(gradient);
        }
        gradients.push(row);
    }

    return gradients;
}

// =====================================================
// FIN DU BRUIT DE PERLIN
// =====================================================