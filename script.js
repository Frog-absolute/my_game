var GAME = {
    background: 'black',
    resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
}


// Инициализация canvas
const canvas = document.getElementById('gameCanvas');
const convasContext = canvas.getContext('2d');
const infoElement = document.getElementById('info');
const newGameElement = document.getElementById('newGame');

// Настройка размеров canvas
// canvas.width = GAME.width;
// canvas.height = GAME.height;

// Состояние игры
let player = {
    x: canvas.width / 2 - 50,
    y: canvas.height - 30,
    width: 100,
    height: 20,
    color: '#DEB887',
    speed: 10
};

let bullets = [];
let lastShotTime = Date.now();
const shotTimeout = 200;
let clip = {
    default: 30,
    current: 0,
    reloadingTimeout: 3000,
    update() {
        if (Date.now() - lastShotTime > clip.reloadingTimeout && clip.current === 0) {
            clip.current = clip.default;
        }
    }
}
let enemies = [];
let endOfGame = true;

let GameResults = {
    wins: localStorage.getItem("GameResults.wins") ?? 0,
    falls: localStorage.getItem("GameResults.falls") ?? 0,

}

let keys = {
    left: false,
    right: false,
    space: false
};

// Класс пули
class Bullet {
    static shot = new Audio('./shot.mp3');
    static hit = new Audio('./hit.mp3');
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 5;
        this.color = 'red';
        this.speed = 5;
        this.active = true;
    }

    update() {
        for (let dy = 0; dy < this.speed; dy++) {
            this.y--;
            if (this.y < 0) {
                this.active = false;
            }

            // Проверка столкновений с врагами
            for (let i = 0; i < enemies.length; i++) {
                if (enemies[i].active && this.checkCollision(enemies[i])) {
                    this.active = false;
                    enemies[i].active = false;
                    Bullet.hit.play();
                    break;
                }
            }
        }
    }

    draw() {
        convasContext.beginPath();
        convasContext.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        convasContext.fillStyle = this.color;
        convasContext.fill();
        convasContext.closePath();
    }

    checkCollision(enemy) {
        return this.x > enemy.x &&
            this.x < enemy.x + enemy.width &&
            this.y > enemy.y &&
            this.y < enemy.y + enemy.height;
    }
}

// Класс врага
class Enemy {
    constructor(x, y, width) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = 20;
        this.color = this.getRandomColor();
        this.dx = Math.random() > 0.5 ? 2 : -2;
        this.dy = 0;
        this.active = true;
        this.number = enemies.length + 1;
    }

    update() {
        if (Math.random() > 0.5) return; // Замедление движения

        if (Math.random() < 0.1) this.dy = 10; // Случайное движение вниз

        // Изменение направления при столкновении с границами
        if (this.x < 0 || this.x + this.width > canvas.width || Math.random() < 0.03) {
            this.dx = -this.dx;
        }

        this.x += this.dx;
        this.y += this.dy;

        if (this.dy !== 0) this.dy = 0; // Сброс вертикального движения

        // Проверка достижения нижней границы
        if (this.y > canvas.height - 50) {
            endOfGame = true;
            GameResults.falls++;
        }
    }

    draw() {
        convasContext.fillStyle = this.color;
        convasContext.fillRect(this.x, this.y, this.width, this.height);

        // Отображение номера врага
        convasContext.fillStyle = 'white';
        convasContext.font = '12px Arial';
        convasContext.textAlign = 'center';
        convasContext.fillText(this.number.toString(), this.x + this.width / 2, this.y + this.height / 2 + 5);
    }

    getRandomColor() {
        const colors = [
            '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
            '#FF00FF', '#00FFFF', '#FFA500', '#A52A2A'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
}

// Создание объектов игры
function createObjects() {
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - 30;

    enemies = [];
    bullets = [];

    // Создание врагов
    for (let i = 0; i < 20; i++) {
        const x = Math.random() * (canvas.width - 50);
        const y = 40 + Math.random() * 10;
        enemies.push(new Enemy(x, y, 50));
    }
}

// Уничтожение объектов игры
function destroyObjects() {
    enemies = [];
    bullets = [];
}







// Обновление информации
function updateInfo() {
    const activeEnemies = enemies.filter(e => e.active).length;
    infoElement.textContent = `Врагов: ${activeEnemies} | Побед: ${GameResults.wins} | Поражений: ${GameResults.falls}`;
    if (!endOfGame) {
        infoElement.textContent += '  | Патроны: ' + (clip.current || "Перезарядка " + (clip.reloadingTimeout - Date.now() + lastShotTime) / 1000)
    }
}



// чтение действий клиента
function initEventsListeners() {
    window.addEventListener('mousemove', onCanvasMouseMove);
    window.addEventListener('click', shot);
    window.addEventListener('keydown', (e) => (e.code === 'Space') && shot());
    window.addEventListener('resize', GAME.resize);
}

function shot() {
    if (Date.now() - lastShotTime > shotTimeout && clip.current > 0) {
        bullets.push(new Bullet(player.x + player.width / 2, player.y - 10));
        lastShotTime = Date.now();
        clip.current--;
        Bullet.shot.play();
    }

}

function onCanvasMouseMove(event) {
    player.x = event.clientX - 0.55 * player.width;
    if (player.x > canvas.width - player.width)
        player.x = canvas.width - player.width;
    if (player.x < 0)
        player.x = 0;
}



// Проверка условий окончания игры
function checkGameEnd() {
    const activeEnemies = enemies.filter(e => e.active).length;
    if (activeEnemies === 0) {
        endOfGame = true;
        GameResults.wins++;
    }
}
function update() {
    // Обработка ввода
    initEventsListeners();

    // Обновление пуль
    bullets = bullets.filter(bullet => bullet.active);
    bullets.forEach(bullet => bullet.update());

    clip.update();

    // Обновление врагов
    enemies = enemies.filter(enemy => enemy.active);
    enemies.forEach(enemy => enemy.update());

    // Проверка условий окончания игры
    checkGameEnd();

    // Обновление информации 
    updateInfo();
}

function draw() {
    // Отрисовка игрока
    convasContext.fillStyle = player.color;
    convasContext.fillRect(player.x, player.y, player.width, player.height);

    // Отрисовка пуль
    bullets.forEach(bullet => bullet.draw());


    // Отрисовка врагов
    enemies.forEach(enemy => enemy.draw());

}

// Основной игровой цикл
function play() {
    // Очистка экрана
    convasContext.clearRect(0, 0, canvas.width, canvas.height);


    if (!endOfGame) {
        update();
        draw();
    }


    // Показ экрана новой игры при окончании игры
    if (endOfGame) {
        localStorage.setItem("GameResults.wins", GameResults.wins);
        localStorage.setItem("GameResults.falls", GameResults.falls);
        newGameElement.style.display = 'block';
        updateInfo();
    } else {
        newGameElement.style.display = 'none';
    }

    requestAnimationFrame(play);
}

//  Обработчики событий клавиатуры
window.addEventListener('keydown', (e) => {
    switch (e.code) {
        case 'ArrowLeft': keys.left = true; break;
        case 'ArrowRight': keys.right = true; break;
        case 'Space': keys.space = true; break;
        case 'KeyG':
            if (endOfGame) {
                endOfGame = false;
                createObjects();
                keys.left = false;
                keys.right = false;
                keys.space = false;
            }
            break;
    }
});

window.addEventListener('keyup', (e) => {
    switch (e.code) {
        case 'ArrowLeft': keys.left = false; break;
        case 'ArrowRight': keys.right = false; break;
        case 'Space': keys.space = false; break;
    }
});

// Обработчик клика по кнопке новой игры
newGameElement.addEventListener('click', () => {
    if (endOfGame) {
        endOfGame = false;
        createObjects();
        keys.left = false;
        keys.right = false;
        keys.space = false;
        clip.current = clip.default;
    }
});

// Запуск игры
GAME.resize();
play();
updateInfo();
initEventsListeners();
newGameElement.style.display = 'block';