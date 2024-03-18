const url = new URL(location);

const cell_side = url.searchParams.has("size") ? Number.parseInt(url.searchParams.get("size")) : 25;
const width = Math.round(window.innerWidth * 0.9 / cell_side) * cell_side;
const height = Math.round(window.innerHeight * 0.8 / cell_side) * cell_side;

document.getElementById("new-scale").value = cell_side;

const cells_x = width / cell_side;
const cells_y = height / cell_side;

var cells = [];
var canvas;

var saves = {}

var current_template = null;
var template_start_index = null;

const templates = {
    "Gosper Glider gun": {
        type: "plain",
        value: `
            000000000000000000000000100000000000
            000000000000000000000010100000000000
            000000000000110000001100000000000011
            000000000001000100001100000000000011
            110000000010000010001100000000000000
            110000000010001011000010100000000000
            000000000010000010000000100000000000
            000000000001000100000000000000000000
            000000000000110000000000000000000000
        `
    },
    "Simkin Glider gun": {
        type: "plain",
        value: `
            110000011000000000000000000000000
            110000011000000000000000000000000
            000000000000000000000000000000000
            000011000000000000000000000000000
            000011000000000000000000000000000
            000000000000000000000000000000000
            000000000000000000000000000000000
            000000000000000000000000000000000
            000000000000000000000000000000000
            000000000000000000000011011000000
            000000000000000000000100000100000
            000000000000000000000100000010011
            000000000000000000000111000100011
            000000000000000000000000001000000
            000000000000000000000000000000000
            000000000000000000000000000000000
            000000000000000000000000000000000
            000000000000000000001100000000000
            000000000000000000001000000000000
            000000000000000000000111000000000
            000000000000000000000001000000000
    `
    },
    "Spacefiller": {
        type: "plain",
        value: `
            000000000000000000100000000
            000000000000000001110000000
            000000000000111000011000000
            000000000001001110010110000
            000000000010001010010100000
            000000000010000101010101100
            000000000000100001010001100
            111100000101000010001011100
            100011010111011000000000110
            100000110000010000000000000
            010011010010010110000000000
            000000010101010101000001111
            010011010010010011010110001
            100000110001010100011000001
            100011010110010010010110010
            111100000101010101010000000
            000000000011010010010110010
            000000000000010000011000001
            011000000000110111010110001
            001110100010000101000001111
            001100010100001000000000000
            001101010101000010000000000
            000001010010100010000000000
            000011010011100100000000000
            000000110000111000000000000
            000000011100000000000000000
            000000001000000000000000000
        `
    },
    "Glider": {
        type: "plain",
        value: `
            001
            101
            011
        `
    },
    "Light weight spaceship": {
        type: "plain",
        value: `
            10010
            00001
            10001
            01111
        `
    },
    "Middle weight spaceship": {
        type: "plain",
        value: `
            001000
            100010
            000001
            100001
            011111
        `
    },
    "Heavy weight spaceship": {
        type: "plain",
        value: `
            0011000
            1000010
            0000001
            1000001
            0111111
        `
    },
    "Eater 1": {
        type: "plain",
        value: `
            1100
            1010
            0010
            0011
        `
    },
    "Blinker": {
        type: "plain",
        value: `
            111
        `
    },
    "Toad": {
        type: "plain",
        value: `
            0111
            1110
        `
    },
    "Beacon": {
        type: "plain",
        value: `
            1100
            1100
            0011
            0011
        `
    },
    "Pulsar": {
        type: "plain",
        value: `
            0011100011100
            0000000000000
            1000010100001
            1000010100001
            1000010100001
            0011100011100
            0000000000000
            0011100011100
            1000010100001
            1000010100001
            1000010100001
            0000000000000
            0011100011100
        `
    },
    "Pentadecathlon": {
        type: "plain",
        value: `
            111
            101
            111
            111
            111
            111
            101
            111
        `
    }
}

var game_started = false;
var game_interval;

function setup() {
    canvas = createCanvas(width, height);
    canvas.parent("p5-container");
    background(200);

    create_cells_array();

    document.getElementById("p5-container").addEventListener("click", add_cell);
    document.getElementById("button").addEventListener("click", start);
    document.getElementById("random").addEventListener("click", randomize);
    document.getElementById("update-button").addEventListener("click", update_speed);
    document.getElementById("reset").addEventListener("click", reset);
    document.getElementById("create-save").addEventListener("click", create_save);
    document.getElementById("load-save").addEventListener("click", load_save);
    document.getElementById("load-template").addEventListener("click", load_template);
    document.getElementById("rescale").addEventListener("click", rescale);

    document.addEventListener("mousemove", template_move);

    textAlign(CENTER);

    let template_select = document.getElementById("template-select");
    for (let template in templates) {
        let template_option = document.createElement("div");
        template_option.innerHTML = `<option value="${template}">${template}</option>`;
        template_select.appendChild(template_option.firstChild);
    }
}

function create_cells_array() {
    cells = [];
    for (let y = 0; y < cells_y; y++) {
        let y_array = [];
        for (let x = 0; x < cells_x; x++) {
            y_array.push(-1);
        }
        cells.push(y_array);
    }
}

function rescale() {
    url.searchParams.set("size", document.getElementById("new-scale").value);
    location.href = url.href;
}

function draw() {
    clear();
    background(200);

    // Draw lines
    if (cell_side >= 10) {
        for (let x = 0; x <= width; x += cell_side) {
            line(x, 0, x, height);
        }
        for (let y = 0; y <= height; y += cell_side) {
            line(0, y, width, y);
        }
    }

    // Draw the cells
    fill(0)
    for (let y = 0; y < cells.length; y++) {
        for (let x = 0; x < cells[y].length; x++) {
            // Draw the cells
            if (cells[y][x] == 1) {
                rect(x * cell_side, y * cell_side, cell_side, cell_side);
            }

            // Draw neighbour count
            if (document.getElementById("show-neigh").checked) {
                if (cells[y][x] == 1) fill(255);
                text(count_neigh(y, x), x * cell_side + cell_side / 2, y * cell_side + cell_side / 1.5);
                fill(0);
            }
        }
    }

    // Draw the template
    if (template_start_index) {
        fill(0, 255, 0);
        for (let y = 0; y < current_template.length; y++) {
            for (let x = 0; x < current_template[y].length; x++) {
                if (current_template[y][x] == "0") {
                    fill(200);
                } else {
                    fill(0, 255, 0);
                }

                let ix = bound_index(x + template_start_index[1], cells_x);
                let iy = bound_index(y + template_start_index[0], cells_y);
                rect(ix * cell_side, iy * cell_side, cell_side, cell_side);
            }
        }
        fill(0);
    }
}

function randomize() {
    for (let y = 0; y < cells.length; y++) {
        for (let x = 0; x < cells[y].length; x++) {
            cells[y][x] = Math.random() > document.getElementById("alive-chance").value / 100 ? -1 : 1;
        }
    }
}

function print_board() {
    output = "";
    for (let y = 0; y < cells.length; y++) {
        for (let x = 0; x < cells[y].length; x++) {
            output += cells[y][x] == 1 ? "1" : "0";
        }
        output += "\n";
    }
    console.log(output);
}

function load_template() {
    let template_name = document.getElementById("template-select").value;
    if (!template_name || !(template_name in templates)) return;
    
    let template_array = [];
    if (templates[template_name].type == "plain") {
        let template_rows = templates[template_name].value.trim().split("\n");
        for (let row of template_rows) {
            template_array.push(row.trim().split(""));
        }
    }
    current_template = template_array;
}

function template_move(e) {
    if (!current_template) {
        template_start_index = null;
        return;
    }
    
    let container = document.getElementById("p5-container").getBoundingClientRect();
    let topOffset = container.top;
    let leftOffset = container.left;

    let x = e.clientX - leftOffset;
    let y = e.clientY - topOffset;

    if (x < 0 || x > width || y < 0 || y > height) {
        template_start_index = null;
        return;
    }
    let iy = Math.floor(y / cell_side);
    let ix = Math.floor(x / cell_side);

    template_start_index = [iy, ix];
}

function reset() {
    if (game_started) clearInterval(game_interval);
    game_started = false;
    create_cells_array();
    document.getElementById("button").innerText = "Start game";
}

function create_save() {
    save_name_input = document.getElementById("save-name");
    var save_name = save_name_input.value;
    save_name_input.value = "";
    if (!save_name) return;
    let option_node = document.createElement("div");
    option_node.innerHTML = `<option value="${save_name}">${save_name}<option>`;
    if (!(save_name in saves)) {
        document.getElementById("save-select").appendChild(option_node.firstChild);
    }
    saves[save_name] = JSON.parse(JSON.stringify(cells));
}

function load_save() {
    let save_name = document.getElementById("save-select").value;
    if (!save_name || !(save_name in saves)) return;
    if (game_started) clearInterval(game_interval);
    document.getElementById("button").innerText = "Start game";
    game_started = false;
    cells = JSON.parse(JSON.stringify(saves[save_name]));
}

function add_cell(e) {
    let container = document.getElementById("p5-container").getBoundingClientRect();
    let topOffset = container.top;
    let leftOffset = container.left;

    let x = e.clientX - leftOffset;
    let y = e.clientY - topOffset;

    if (x < 0 || x > width || y < 0 || y > height) return;
    let iy = Math.floor(y / cell_side);
    let ix = Math.floor(x / cell_side);

    if (template_start_index) {
        for (let y = 0; y < current_template.length; y++) {
            for (let x = 0; x < current_template[y].length; x++) {
                let ix = bound_index(x + template_start_index[1], cells_x);
                let iy = bound_index(y + template_start_index[0], cells_y);
                cells[iy][ix] = current_template[y][x] == "0" ? -1 : 1;
            }
        }
        template_start_index = null;
        current_template = null;
    } else {
        cells[iy][ix] *= -1;
    }
}

function start() {
    let btn = document.getElementById("button");
    if (!game_started) {
        game();
        game_interval = setInterval(game, document.getElementById("interval-speed").value);
        game_started = true;
        btn.innerText = "Pause game";
    } else {
        clearInterval(game_interval);
        game_started = false;
        btn.innerText = "Resume game";
    }
}

function update_speed() {
    if (game_started) {
        clearInterval(game_interval);
        game_interval = setInterval(game, document.getElementById("interval-speed").value);
        game();
    }
}

function game() {
    let next = [];
    for (let y = 0; y < cells.length; y++) {
        let y_array = [];
        for (let x = 0; x < cells[y].length; x++) {
            y_array.push(-1);
            let neigh = count_neigh(y, x);
            let alive = cells[y][x] == 1;
            if (neigh == 3 && !alive) y_array[x] = 1;
            if (neigh >= 2 && neigh <= 3 && alive) y_array[x] = 1;
        }
        next.push(y_array);
    }
    cells = next;
}

function count_neigh(iy, ix) {
    let count = 0;

    for (let i = -1; i <= 1; i++) {
        let yt = bound_index(iy - 1, cells_y);
        let yb = bound_index(iy + 1, cells_y);
        let x = bound_index(ix + i, cells_x);

        if (cells[yt][x] == 1) count++;
        if (cells[yb][x] == 1) count++;
    }

    let xr = bound_index(ix + 1, cells_x);
    let xl = bound_index(ix - 1, cells_x);
    if (cells[iy][xr] == 1) count++;
    if (cells[iy][xl] == 1) count++;
    return count;
}

function bound_index(i, length) {
    i = i >= length ? i % length : i;
    return i < 0 ? length - 1 : i;
}
