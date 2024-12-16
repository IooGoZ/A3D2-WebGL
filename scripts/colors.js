var cr_min_threshold = null;
var cr_max_threshold = null;

function initColors() {
    cr_min_threshold = document.getElementById("cr_min_threshold");
    cr_max_threshold = document.getElementById("cr_max_threshold");
}

function colorRamp(t) {
    // Définir les couleurs (vec4 -> tableaux)
    const c1 = [0.0, 0.0, 1.0, 1.0]; // Bleu
    const c2 = [0.0, 1.0, 0.0, 1.0]; // Vert
    const c3 = [1.0, 0.0, 0.0, 1.0]; // Rouge
    const c4 = [1.0, 1.0, 0.0, 1.0]; // Jaune
    const c5 = [1.0, 1.0, 1.0, 1.0]; // Blanc

    // Fonction pour effectuer l'interpolation linéaire (mix)
    function mix(a, b, t) {
        return a.map((val, i) => val * (1 - t) + b[i] * t);
    }

    // Calculer la couleur en fonction de t
    if (t < 0.20) {
        return mix(c1, c2, t / 0.2);
    } else if (t < 0.40) {
        return mix(c2, c3, (t - 0.2) / 0.2);
    } else if (t < 0.60) {
        return mix(c3, c4, (t - 0.4) / 0.2);
    } else if (t < 0.80) {
        return mix(c4, c5, (t - 0.6) / 0.2);
    } else {
        return c5;
    }
}


function getColorRamp(size=256, channel=4) {
    let arrayData = new Float32Array(size * channel); // Créer un tableau de la taille adéquate
    for (let i = 0; i < size; i++) {
        const baseIndex = i * channel;
        
        // Interpolation linéaire entre col1 et col2 pour chaque canal
        let col = colorRamp(i / 255.0)
        arrayData[baseIndex] = col[0];
        arrayData[baseIndex + 1] = col[1];
        arrayData[baseIndex + 2] = col[2];
        arrayData[baseIndex + 3] = col[3];
    }
    return arrayData;
}

function getColorThreshMin() {
    return cr_min_threshold.value;
}

function getColorThreshMax() {
    return cr_max_threshold.value;
}