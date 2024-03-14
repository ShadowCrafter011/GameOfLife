const cell_side = 25;
const width = Math.round(window.innerWidth * 0.9 / cell_side) * cell_side;
const height = Math.round(window.innerHeight * 0.8 / cell_side) * cell_side;

const cells_x = width / cell_side;
const cells_y = height / cell_side;

var cells = [];
var canvas;

var game_started = false;
var game_interval;

function setup() {
    canvas = createCanvas(width, height);
    canvas.parent("p5-container");
    background(200);

    for (let y = 0; y < cells_y; y++) {
        let y_array = [];
        for (let x = 0; x < cells_x; x++) {
            y_array.push(-1);
        }
        cells.push(y_array);
    }

    document.getElementById("p5-container").addEventListener("click", add_cell);
    document.getElementById("button").addEventListener("click", start);
    document.getElementById("random").addEventListener("click", randomize);
    document.getElementById("update-button").addEventListener("click", update_speed);

    textAlign(CENTER);
}

function draw() {
    clear();
    background(200);

    // Draw lines
    for (let x = 0; x <= width; x += cell_side) {
        line(x, 0, x, height);
    }
    for (let y = 0; y <= height; y += cell_side) {
        line(0, y, width, y);
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
}

function randomize() {
    for (let y = 0; y < cells.length; y++) {
        for (let x = 0; x < cells[y].length; x++) {
            cells[y][x] = Math.random() > document.getElementById("alive-chance").value / 100 ? -1 : 1;
        }
    }
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
    cells[iy][ix] *= -1;
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
    i = i >= length ? 0 : i;
    return i < 0 ? length - 1 : i;
}
