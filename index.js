const url = new URL(location);

const cell_side = url.searchParams.has("size") ? Number.parseFloat(url.searchParams.get("size")) : 25;
const width = Math.round(window.innerWidth * 0.9 / cell_side) * cell_side;
const height = Math.round(window.innerHeight * 0.8 / cell_side) * cell_side;

document.getElementById("new-scale").value = cell_side;

const cells_x = width / cell_side;
const cells_y = height / cell_side;

var cells = [];
var generations = 0;
var canvas;

var saves = {}

var current_template = null;
var template_start_index = null;

const templates = {
    "Gosper Glider gun": {
        type: "rle",
        url: "gosperglidergun.rle"
    },
    "Breeder 1": {
        type: "rle",
        url: "breeder1.rle"
    },
    "Riley's Breeder": {
        type: "rle",
        url: "rileysbreeder.rle"
    },
    "Simkin Glider gun": {
        type: "plain",
        url: "simkinglidergun.plain"
    },
    "Spacefiller": {
        type: "plain",
        url: "spacefiller.plain"
    },
    "Glider": {
        type: "plain",
        url: "glider.plain"
    },
    "Light weight spaceship": {
        type: "plain",
        url: "lightweightspaceship.plain"
    },
    "Middle weight spaceship": {
        type: "plain",
        url: "middleweightspaceship.plain"
    },
    "Heavy weight spaceship": {
        type: "plain",
        url: "heavyweightspaceship.plain"
    },
    "Growing spaceship": {
        type: "rle",
        url: "growingspaceship.rle"
    },
    "3 cell puffsuppressor spaceship": {
        type: "rle",
        url: "3puffsuppressorspaceship.rle"
    },
    "Wing spaceship": {
        type: "rle",
        url: "wingspaceship.rle"
    },
    "Barge": {
        type: "rle",
        url: "barge.rle"
    },
    "Eater 1": {
        type: "plain",
        url: "eater1.plain"
    },
    "Blinker": {
        type: "plain",
        url: "blinker.plain"
    },
    "Toad": {
        type: "plain",
        url: "toad.plain"
    },
    "Beacon": {
        type: "plain",
        url: "beacon.plain"
    },
    "Pulsar": {
        type: "plain",
        url: "pulsar.plain"
    },
    "Pentadecathlon": {
        type: "plain",
        url: "pentadecathlon.plain"
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
    noStroke();

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
    stroke(0);
    if (cell_side >= 10) {
        for (let x = 0; x <= width; x += cell_side) {
            line(x, 0, x, height);
        }
        for (let y = 0; y <= height; y += cell_side) {
            line(0, y, width, y);
        }
    }
    noStroke();

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
        fill(200);
        stroke(0);
        rect(
            template_start_index[1] * cell_side,
            template_start_index[0] * cell_side,
            current_template[0].length * cell_side,
            current_template.length * cell_side
        );
        if (cell_side < 10) {
            noStroke();
        }
        fill(0, 200, 0);
        for (let y = 0; y < current_template.length; y++) {
            let iy = bound_index(y + template_start_index[0], cells_y);
            line(0, iy * cell_side, width, iy * cell_side);
            for (let x = 0; x < current_template[y].length; x++) {
                let ix = bound_index(x + template_start_index[1], cells_x);
                if (current_template[y][x] == "0") {
                    line(ix * cell_side, 0, ix * cell_side, height);
                    continue;
                }

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
    let template = templates[template_name];

    let request = new XMLHttpRequest();
    request.open("GET", `templates/${template.url}`, false);
    request.send(null);
    
    let template_text = request.responseText;

    switch (template.type) {
        case "plain":
            let template_rows = template_text.trim().split("\n");
            for (let row of template_rows) {
                template_array.push(row.trim().split(""));
            }
            break;
        case "rle":
            let rle = template_text;
            rle = rle.substring(0, rle.indexOf("!"));
            rle = rle.replaceAll("\r", "");
            rle = rle.split("\n");
            
            let first_line = null;
            let lines = [];
            for (let line of rle) {
                if (line.startsWith("#")) continue;
                if (!first_line) {
                    first_line = line;
                    continue;
                }
                lines.push(line);
            }
            
            lines = lines.join("");
            first_line = first_line.split(", ");
            let py = first_line[1].split(" ")[2];
            let px = first_line[0].split(" ")[2];

            for (let y = 0; y < py; y++) {
                let y_array = [];
                for (let x = 0; x < px; x++) {
                    y_array.push(0);
                }
                template_array.push(y_array);
            }
            
            let y_index = 0;
            let x_index = 0;
            let num = 0;
            for (let char of lines.split("")) {
                switch (char) {
                    case "b":
                        num = Math.max(1, num);
                        x_index += num;
                        break;
                    case "o":
                        num = Math.max(1, num);
                        for (let x = x_index; x < x_index + num; x++) {
                            template_array[y_index][x] = 1;
                        }
                        x_index += num;
                        break;
                    case "$":
                        y_index += Math.max(1, num);
                        x_index = 0;
                        break;
                    default:
                        num = num * 10 + parseInt(char);
                        break;
                }

                if (["b", "o", "$"].includes(char)) {
                    num = 0;
                }
            }
            console.log(template_array)
            break;
        default:
            break;
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
    generations = 0;
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
        btn.innerText = `Pause game (T ${generations})`;
    } else {
        clearInterval(game_interval);
        game_started = false;
        btn.innerText = `Resume game (T ${generations})`;
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
    generations += 1;
    document.getElementById("button").innerText = `Pause game (T ${generations})`;
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
