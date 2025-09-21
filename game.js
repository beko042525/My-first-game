// HTMLからcanvas要素を取得
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const restartButton = document.getElementById('restartButton');
const startScreen = document.getElementById('startScreen');
const soundPrompt = document.getElementById('sound-prompt');

// ゲームの物理設定
const GRAVITY = 0.5;
const JUMP_STRENGTH = -12;

// 画像を読み込むための準備
const playerImage = new Image();
playerImage.src = 'player.png';
const enemyImage = new Image();
enemyImage.src = 'zombie.png';
const heartImage = new Image();
heartImage.src = 'heart.png';
const backgroundImage = new Image();
backgroundImage.src = 'background.png';

// 効果音・音楽を読み込むための準備
const jumpSound = new Audio('jump.mp3');
jumpSound.volume = 0.3;
const kickSound = new Audio('kick.mp3');
const damageSound = new Audio('damage.mp3');
const titleMusic = new Audio('title.mp3');
titleMusic.loop = true;
titleMusic.volume = 0.5;
const bgm = new Audio('bgm.mp3');
bgm.loop = true;
bgm.volume = 0.4;
const gameOverSound = new Audio('gameover.mp3');

// スコアとゲーム設定
let score = 0;
let baseEnemySpeed = 1.0;
let gameStarted = false;

// プレイヤーの情報
const player = {
    x: 200, y: 400, width: 80, height: 80, speed: 4, velocityY: 0,
    isJumping: false, isActive: true, lives: 3, isInvincible: false
};

// 複数の敵を管理する配列
let enemies = [];

// 敵を生成する関数
function createEnemy() {
    const enemy = {
        y: canvas.height - 100, width: 100, height: 100,
        speed: baseEnemySpeed + Math.random() * 0.5, direction: 1
    };
    if (Math.random() < 0.5) {
        enemy.x = -enemy.width;
        enemy.direction = 1;
    } else {
        enemy.x = canvas.width;
        enemy.direction = -1;
    }
    enemies.push(enemy);
}

// キーの状態を保存する変数
let rightPressed = false;
let leftPressed = false;

// キー入力の処理
function keyDownHandler(e) {
    // スタート画面が表示されている時にスペースキーが押されたらゲームを開始
    if (!gameStarted && e.code === 'Space' && startScreen.style.display !== 'none') {
        startGame();
        return;
    }
    if (!player.isActive || !gameStarted) return;
    if (e.key === "Right" || e.key === "ArrowRight") rightPressed = true;
    else if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = true;
    else if ((e.code === "Space" || e.key === "ArrowUp") && !player.isJumping) {
        player.velocityY = JUMP_STRENGTH;
        player.isJumping = true;
        jumpSound.currentTime = 0;
        jumpSound.play();
    }
}
function keyUpHandler(e) {
    if (e.key === "Right" || e.key === "ArrowRight") rightPressed = false;
    else if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = false;
}
document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);

// 当たり判定
function checkCollisions() {
    if (!player.isActive || player.isInvincible) return;
    for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        if (player.x < enemy.x + enemy.width && player.x + player.width > enemy.x && player.y < enemy.y + enemy.height && player.y + player.height > enemy.y) {
            if (player.velocityY > 0 && player.y + player.height < enemy.y + 40) {
                kickSound.currentTime = 0; kickSound.play(); score++; player.velocityY = -7;
                enemies.splice(i, 1); createEnemy();
                if (score > 0 && score % 10 === 0) {
                    baseEnemySpeed += 0.2; createEnemy();
                }
                break;
            } else {
                damageSound.currentTime = 0; damageSound.play(); player.lives--;
                if (player.lives <= 0) {
                    player.isActive = false; bgm.pause();
                    gameOverSound.currentTime = 0; gameOverSound.play();
                } else {
                    player.isInvincible = true; enemies = []; createEnemy();
                    // ★★★ ここが修正された行です ★★★
                    setTimeout(() => { player.isInvincible = false; }, 1000);
                }
                break;
            }
        }
    }
}

// 描画関連の関数
function drawPlayer() {
    if (player.isInvincible) {
        if (Math.floor(Date.now() / 100) % 2 === 0) return;
    }
    ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);
}
function drawEnemies() {
    for (const enemy of enemies) {
        ctx.drawImage(enemyImage, enemy.x, enemy.y, enemy.width, enemy.height);
    }
}
function drawScore() {
    ctx.fillStyle = "white"; ctx.font = "24px Arial"; ctx.textAlign = "left";
    ctx.fillText("Score: " + score, 10, 30);
}
function drawLives() {
    const heartSize = 30; const padding = 10;
    for (let i = 0; i < player.lives; i++) {
        ctx.drawImage(heartImage, canvas.width - (heartSize + padding) * (i + 1), padding, heartSize, heartSize);
    }
}
function drawGameOver() {
    ctx.fillStyle = "red"; ctx.font = "40px Arial"; ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
    restartButton.style.display = 'block';
}

// ゲームのメイン処理
function gameLoop() {
    requestAnimationFrame(gameLoop);
    if (!gameStarted) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    if (player.isActive) {
        if (rightPressed) player.x += player.speed;
        else if (leftPressed) player.x -= player.speed;
        player.velocityY += GRAVITY; player.y += player.velocityY;
        const ground = canvas.height - player.height;
        if (player.y > ground) {
            player.y = ground; player.velocityY = 0; player.isJumping = false;
        }
        checkCollisions(); drawPlayer();
    } else {
        drawGameOver();
    }
    for (const enemy of enemies) {
        enemy.x += enemy.speed * enemy.direction;
        if (enemy.x + enemy.width > canvas.width && enemy.direction === 1) enemy.direction = -1;
        else if (enemy.x < 0 && enemy.direction === -1) enemy.direction = 1;
    }
    drawEnemies(); drawScore(); drawLives();
}

// ゲームをリスタートする関数
function restartGame() {
    gameOverSound.pause(); gameOverSound.currentTime = 0;
    player.x = 200; player.lives = 3; player.isActive = true; player.isInvincible = false;
    player.velocityY = 0; score = 0; baseEnemySpeed = 1.0;
    enemies = []; createEnemy();
    restartButton.style.display = 'none';
    titleMusic.currentTime = 0; // ★★★ タイトル音楽もリセット ★★★
    titleMusic.play();          // ★★★ タイトル音楽から再開 ★★★
    startScreen.style.display = 'flex'; // ★★★ スタート画面を再表示 ★★★
    gameStarted = false;        // ★★★ ゲーム開始フラグをリセット ★★★
}
// ★★★ リスタートボタンの処理を修正 ★★★
restartButton.addEventListener('click', restartGame);

// ゲームを開始する共通の関数
function startGame() {
    if (!gameStarted) {
        gameStarted = true;
        startScreen.style.display = 'none';
        titleMusic.pause();
        bgm.currentTime = 0;
        bgm.play();
    }
}

// サウンド有効化画面のクリックイベント
soundPrompt.addEventListener('click', () => {
    soundPrompt.style.display = 'none';
    startScreen.style.display = 'flex';
    titleMusic.play();
}, { once: true });

// スタート画面のクリックイベント
startScreen.addEventListener('click', startGame);

// 画像が読み込まれてからゲームループを開始
let imagesLoaded = 0;
function onImageLoad() {
    imagesLoaded++;
    if (imagesLoaded === 4) {
        createEnemy();
        gameLoop();
    }
}
playerImage.onload = onImageLoad;
enemyImage.onload = onImageLoad;
heartImage.onload = onImageLoad;
backgroundImage.onload = onImageLoad;