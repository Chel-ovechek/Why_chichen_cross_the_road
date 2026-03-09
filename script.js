const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const levelText = document.getElementById('levelNumber');

// Фиксированное разрешение
const V_WIDTH = 360;
const V_HEIGHT = 480;
canvas.width = V_WIDTH;
canvas.height = V_HEIGHT;

const ROWS = 10; // Всего 10 шагов до победы
const COLS = 8;
const TILE = V_HEIGHT / ROWS;

let currentStage = 0; // 0-Камни, 1-Мыши, 2-Лисы, 3-Машины
const stages = [
    { name: "ПОЛЕ (КАМНИ)", type: 'static', color: '#badc58', obsColor: '#7f8c8d' },
    { name: "ЛУГ (МЫШИ)", type: 'slow', color: '#6ab04c', obsColor: '#95afc0', speed: 1.2 },
    { name: "ЛЕС (ЛИСЫ)", type: 'medium', color: '#4834d4', obsColor: '#e67e22', speed: 2.0 },
    { name: "ШОССЕ (МАШИНЫ)", type: 'fast', color: '#535c68', obsColor: '#eb4d4b', speed: 3.2 }
];

let player = { r: ROWS - 1, c: 4 };
let lanes = [];
let isGameOver = false;
let isWin = false;

function initStage() {
    const s = stages[currentStage];
    levelText.innerText = `ЛОКАЦИЯ: ${s.name}`;
    lanes = [];
    player.r = ROWS - 1;
    player.c = 4;
    isGameOver = false;
    isWin = false;

    for (let i = 0; i < ROWS; i++) {
        let isSafe = (i === 0 || i === ROWS - 1 || i === 5);
        let lane = {
            y: i * TILE,
            safe: isSafe,
            speed: isSafe ? 0 : (s.speed || 0),
            dir: Math.random() > 0.5 ? 1 : -1,
            obs: []
        };

        if (!isSafe) {
            if (s.type === 'static') {
                // Камни: всего 2 на ряд, легко обойти
                lane.obs = [{c: Math.floor(Math.random()*COLS)}];
            } else {
                // Враги: 2 штуки с большим просветом
                lane.obs = [{x: 50, w: 50}, {x: 80, w: 40}];
            }
        }
        lanes.push(lane);
    }
}

function move(dr, dc) {
    if (isGameOver) { initStage(); return; }
    if (isWin) { 
        currentStage = (currentStage + 1) % stages.length; 
        initStage(); 
        return; 
    }

    let nR = player.r + dr;
    let nC = player.c + dc;

    if (nR >= 0 && nR < ROWS && nC >= 0 && nC < COLS) {
        if (lanes[nR].type === 'static' || stages[currentStage].type === 'static') {
            if (lanes[nR].obs.some(o => o.c === nC)) return;
        }
        player.r = nR;
        player.c = nC;
    }

    if (player.r === 0) isWin = true;
}

// Кнопки
document.getElementById('btnUp').onclick = () => move(-1, 0);
document.getElementById('btnDown').onclick = () => move(1, 0);
document.getElementById('btnLeft').onclick = () => move(0, -1);
document.getElementById('btnRight').onclick = () => move(0, 1);
window.onkeydown = (e) => {
    if (e.key === 'ArrowUp') move(-1, 0);
    if (e.key === 'ArrowDown') move(1, 0);
    if (e.key === 'ArrowLeft') move(0, -1);
    if (e.key === 'ArrowRight') move(0, 1);
};

function update() {
    if (isGameOver || isWin) return;
    const s = stages[currentStage];
    
    lanes.forEach((lane, r) => {
        if (lane.speed > 0) {
            lane.obs.forEach(o => {
                o.x += lane.speed * lane.dir;
                if (o.x > V_WIDTH) o.x = -o.w;
                if (o.x < -o.w) o.x = V_WIDTH;

                if (player.r === r) {
                    let px = (player.c * (V_WIDTH / COLS)) + (V_WIDTH / COLS / 2);
                    if (px > o.x && px < o.x + o.w) isGameOver = true;
                }
            });
        }
    });
}

function draw() {
    ctx.clearRect(0, 0, V_WIDTH, V_HEIGHT);
    const s = stages[currentStage];
    const tileW = V_WIDTH / COLS;

    lanes.forEach((lane, r) => {
        ctx.fillStyle = lane.safe ? '#7cfc00' : s.color;
        ctx.fillRect(0, r * TILE, V_WIDTH, TILE);

        ctx.fillStyle = s.obsColor;
        lane.obs.forEach(o => {
            if (s.type === 'static') {
                ctx.beginPath();
                ctx.arc(o.c * tileW + tileW/2, r * TILE + TILE/2, TILE/3, 0, Math.PI*2);
                ctx.fill();
            } else {
                ctx.fillRect(o.x, r * TILE + 10, o.w, TILE - 20);
            }
        });
    });

    // Игрок
    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.arc(player.c * tileW + tileW/2, player.r * TILE + TILE/2, TILE/2.5, 0, Math.PI*2);
    ctx.fill();

    if (isGameOver) drawOverlay("БАМ! Нажми любую кнопку");
    if (isWin) drawOverlay("ЛОКАЦИЯ ПРОЙДЕНА!", "Нажми, чтобы идти дальше");

    update();
    requestAnimationFrame(draw);
}

function drawOverlay(t1, t2 = "") {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0,0, V_WIDTH, V_HEIGHT);
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.font = "bold 20px Arial";
    ctx.fillText(t1, V_WIDTH/2, V_HEIGHT/2);
    ctx.font = "14px Arial";
    ctx.fillText(t2, V_WIDTH/2, V_HEIGHT/2 + 30);
}

initStage();
draw();