const cell_side = 25;
const width = Math.round(window.innerWidth * 0.8 / cell_side) * cell_side;
const height = Math.round(window.innerHeight * 0.8 / cell_side) * cell_side;

const cells_x = width / cell_side;
const cells_y = height / cell_side;

var cells = [];
var canvas;

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
            text(count_neigh(y, x), x * cell_side + cell_side / 2, y * cell_side + cell_side / 2);
            if (cells[y][x] == -1) continue;
            rect(x * cell_side, y * cell_side, cell_side, cell_side);
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
    game();
    setInterval(game, 1000);
}

function game() {
    let next = [];
    for (let y = 0; y < cells.length; y++) {
        next.push([]);
        for (let x = 0; x < cells[y].length; x++) {
            let neigh = count_neigh(y, x);
            let alive = cells[y][x] == 1;
            if (neigh == 3 && !alive) next[y][x] = 1;
            if (neigh >= 2 && neigh <= 3 && alive) next[y][x] = 1;
            if ((neigh < 2 || neigh) < 3 && alive) next[y][x] = 0;
        }
    }
    cells = next;
}

function count_neigh(iy, ix) {
    let count = 0;
    for (let i = -1; i <= 1; i++) {
        let yb = iy + 1;
        yb = yb >= cells_y ? 0 : yb;
        let yt = iy - 1;
        yt = yt < 0 ? cells_y - 1 : yt;

        let x = ix + i;
        x = x < 0 ? cells_x - 1 : x;
        x = x >= cells_x ? 0 : x;
        if (cells[yt][x] == 1) count++;
        if (cells[yb][x] == 1) count++;
    }
    let x1 = ix + 1;
    let x2 = ix - 1;
    x1 = x1 < 0 ? cells_x - 1 : x1;
    x1 = x1 >= cells_x ? 0 : x1;
    x2 = x2 < 0 ? cells_x - 1 : x2;
    x2 = x2 >= cells_x ? 0 : x2;
    if (cells[iy][x1] == 1) count++;
    if (cells[iy][x2] == 1) count++;
    return count;
}
