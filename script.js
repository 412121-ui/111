// Canvas setup
const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');

// Game constants
const PADDLE_HEIGHT = 100;
const PADDLE_WIDTH = 10;
const BALL_SIZE = 8;
const PADDLE_SPEED = 6;
const INITIAL_BALL_SPEED = 5;
const MAX_BALL_SPEED = 12;

// Game objects
const player = {
    x: 10,
    y: canvas.height / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    dy: 0,
    score: 0
};

const computer = {
    x: canvas.width - PADDLE_WIDTH - 10,
    y: canvas.height / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    dy: 0,
    score: 0
};

const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: BALL_SIZE,
    dx: INITIAL_BALL_SPEED,
    dy: INITIAL_BALL_SPEED,
    speed: INITIAL_BALL_SPEED
};

// Game state
let gameRunning = false;
let gameStarted = false;
const mouse = { y: canvas.height / 2 };
const keys = {};

// Event listeners
document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);
canvas.addEventListener('mousemove', handleMouseMove);

function handleKeyDown(e) {
    keys[e.key] = true;

    if (e.key === ' ') {
        e.preventDefault();
        if (!gameStarted) {
            startGame();
        } else if (!gameRunning) {
            resumeGame();
        }
    }
}

function handleKeyUp(e) {
    keys[e.key] = false;
}

function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouse.y = e.clientY - rect.top;
}

function startGame() {
    gameStarted = true;
    gameRunning = true;
    resetBall();
    gameLoop();
}

function resumeGame() {
    gameRunning = true;
    gameLoop();
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.speed = INITIAL_BALL_SPEED;

    // Random direction
    const angle = (Math.random() - 0.5) * (Math.PI / 4);
    const direction = Math.random() > 0.5 ? 1 : -1;

    ball.dx = Math.cos(angle) * ball.speed * direction;
    ball.dy = Math.sin(angle) * ball.speed;
}

function updatePlayerPaddle() {
    // Keyboard input
    if (keys['ArrowUp'] && player.y > 0) {
        player.y -= PADDLE_SPEED;
    }
    if (keys['ArrowDown'] && player.y < canvas.height - PADDLE_HEIGHT) {
        player.y += PADDLE_SPEED;
    }

    // Mouse input
    const targetY = mouse.y - PADDLE_HEIGHT / 2;
    const maxMove = PADDLE_SPEED * 1.5;

    if (targetY < player.y) {
        player.y = Math.max(0, player.y - maxMove);
    } else if (targetY > player.y) {
        player.y = Math.min(canvas.height - PADDLE_HEIGHT, player.y + maxMove);
    }

    // Clamp to canvas
    if (player.y < 0) player.y = 0;
    if (player.y + PADDLE_HEIGHT > canvas.height) {
        player.y = canvas.height - PADDLE_HEIGHT;
    }
}

function updateComputerPaddle() {
    // AI logic: move towards ball with some intelligence
    const computerCenter = computer.y + PADDLE_HEIGHT / 2;
    const ballCenter = ball.y;
    const difficulty = 0.08; // AI reaction factor (0-1)

    // Predict where ball will be
    let predictedY = ball.y;
    if (ball.dx > 0) {
        const timeToReach = (computer.x - ball.x) / ball.dx;
        predictedY = ball.y + ball.dy * timeToReach;
    }

    // Add some error to make AI beatable
    predictedY += (Math.random() - 0.5) * 30;

    const targetY = predictedY - PADDLE_HEIGHT / 2;
    const diff = targetY - computer.y;

    if (Math.abs(diff) > 5) {
        const direction = Math.sign(diff);
        const speed = PADDLE_SPEED * difficulty;
        computer.y += direction * speed;
    }

    // Clamp to canvas
    if (computer.y < 0) computer.y = 0;
    if (computer.y + PADDLE_HEIGHT > canvas.height) {
        computer.y = canvas.height - PADDLE_HEIGHT;
    }
}

function updateBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Wall collision (top and bottom)
    if (ball.y - ball.size < 0) {
        ball.y = ball.size;
        ball.dy = -ball.dy;
    }
    if (ball.y + ball.size > canvas.height) {
        ball.y = canvas.height - ball.size;
        ball.dy = -ball.dy;
    }

    // Paddle collision - Player
    if (
        ball.dx < 0 &&
        ball.x - ball.size < player.x + player.width &&
        ball.y > player.y &&
        ball.y < player.y + player.height
    ) {
        ball.x = player.x + player.width + ball.size;
        ball.dx = -ball.dx;

        // Add spin based on paddle hit location
        const hitPos = (ball.y - (player.y + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2);
        ball.dy += hitPos * 4;

        // Increase speed slightly
        ball.speed = Math.min(ball.speed + 0.5, MAX_BALL_SPEED);
        ball.dx = Math.abs(ball.dx) * (ball.speed / INITIAL_BALL_SPEED);
    }

    // Paddle collision - Computer
    if (
        ball.dx > 0 &&
        ball.x + ball.size > computer.x &&
        ball.y > computer.y &&
        ball.y < computer.y + computer.height
    ) {
        ball.x = computer.x - ball.size;
        ball.dx = -ball.dx;

        // Add spin based on paddle hit location
        const hitPos = (ball.y - (computer.y + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2);
        ball.dy += hitPos * 4;

        // Increase speed slightly
        ball.speed = Math.min(ball.speed + 0.5, MAX_BALL_SPEED);
        ball.dx = -Math.abs(ball.dx) * (ball.speed / INITIAL_BALL_SPEED);
    }

    // Scoring
    if (ball.x - ball.size < 0) {
        computer.score++;
        document.getElementById('computerScore').textContent = computer.score;
        gameRunning = false;
    }
    if (ball.x + ball.size > canvas.width) {
        player.score++;
        document.getElementById('playerScore').textContent = player.score;
        gameRunning = false;
    }
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw center line
    ctx.strokeStyle = '#00ff41';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw paddles
    ctx.fillStyle = '#00ff41';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00ff41';

    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.fillRect(computer.x, computer.y, computer.width, computer.height);

    // Draw ball
    ctx.fillStyle = '#00ff41';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.size, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
}

function gameLoop() {
    if (!gameStarted) return;

    updatePlayerPaddle();
    updateComputerPaddle();

    if (gameRunning) {
        updateBall();
    }

    draw();

    requestAnimationFrame(gameLoop);
}

// Start the game loop (waiting for player to press space)
function init() {
    draw();
    ctx.fillStyle = '#00ff41';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00ff41';
    ctx.fillText('Press SPACE to start', canvas.width / 2, canvas.height / 2);
    ctx.shadowBlur = 0;
}

init();
