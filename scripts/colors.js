var cr_min_threshold = null;
var cr_max_threshold = null;

var cr_body = null;
var cr_in_color = null;
var cr_in_threshold = null;

let colors = [
    [0.0, [0.78, 0.89, 0.91, 1.0]],
    [1.0, [0.0, 1.0, 1.0, 1.0]]
]

function initColors() {
    cr_min_threshold = document.getElementById("cr_min_threshold");
    cr_max_threshold = document.getElementById("cr_max_threshold");
    cr_body = document.getElementById("colors-ramp-body");
    cr_in_color = document.getElementById("cr-color-add");
    cr_in_threshold = document.getElementById("cr-threshold-add");
}

function colorRamp(t) {
    // Fonction pour effectuer l'interpolation linéaire (mix)
    function mix(a, b, t) {
        return a.map((val, i) => val * (1 - t) + b[i] * t);
    }

    // Trouver les deux couleurs entre lesquelles interpoler
    for (let i = 0; i < colors.length - 1; i++) {
        if (t >= colors[i][0] && t <= colors[i + 1][0]) {
            let tNorm = (t - colors[i][0]) / (colors[i + 1][0] - colors[i][0]);
            return mix(colors[i][1], colors[i + 1][1], tNorm);
        }
    }

    // Si t est en dehors de l'intervalle, retourner la couleur la plus proche
    if (t < colors[0][0]) {
        return colors[0][1];
    } else {
        return colors[colors.length - 1][1];
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

function addColor(index, color, threshold) {
    let tr = document.createElement("tr");

    let tdColor = document.createElement("td");
    let inputColor = document.createElement("input");
    inputColor.type = "color";
    inputColor.value = color;
    inputColor.id = `cr-color-${index}`;
    tdColor.appendChild(inputColor);

    let tdThreshold = document.createElement("td");
    let inputThreshold = document.createElement("input");
    inputThreshold.type = "range";
    inputThreshold.min = "0.00392157";
    inputThreshold.max = "0.99607843";
    inputThreshold.step = "0.00392157";
    inputThreshold.value = threshold;
    inputThreshold.id = `cr-threshold-${index}`;
    tdThreshold.appendChild(inputThreshold);

    let tdButton = document.createElement("td");
    let button = document.createElement("button");
    button.textContent = "Delete";
    button.onclick = () => removeColor(index);
    tdButton.appendChild(button);

    tr.appendChild(tdColor);
    tr.appendChild(tdThreshold);
    tr.appendChild(tdButton);

    cr_body.insertBefore(tr, cr_body.children[index]);
}

function removeColor(index) {
    let tr = document.getElementById(`cr-color-${index}`).parentNode.parentNode;
    tr.remove();
    colors.splice(index, 1);
}

function crChangeColor(index) {
    let color = document.getElementById(`cr-color-${index}`).value;
    colors[index][1] = hexToRgb(color);
}

function getIndexFromThreshold(threshold) {
    let index = 0;
    for (let i = 0; i < colors.length; i++) {
        if (colors[i][0] < threshold) {
            index = i;
        }
    }
    return index;
}

function addColorToRamp() {
    let thresh = parseFloat(cr_in_threshold.value);
    let index = getIndexFromThreshold(thresh);
    let colorRGB = hexToRgb(cr_in_color.value);
    colors.splice(index + 1, 0, [thresh, colorRGB]);
    addColor(index+1, cr_in_color.value, thresh);
}