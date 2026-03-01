const words = [
  "mata", "kaki", "padi", "tali", "kuda", "sapi", "batu", "rumi", "lucu", "kota",
  "gigi", "laba", "sapu", "cuci", "main", "tari", "pita", "kaca", "roti", "bola"
];
const pestsContainer = document.getElementById("pests-container");
const hpFill = document.getElementById("hp-fill");
const scoreDisplay = document.getElementById("score");

let hp = 100;
let score = 0;
let activePests = [];

let pestInterval;
let lastTime = performance.now();
let gameStarted = false;
let muted = false;
let bossSpawned = false;
const miniPestBeforeBoss = 3; // jumlah musuh kecil sebelum boss



let currentStage = 1;
let stageActive = true;
const stageThresholds = [250, 500]; // stage 2 saat 100, stage 3 saat 250


function spawnPest() {
  const word = words[Math.floor(Math.random() * words.length)];
  const pest = document.createElement("div");
  pest.classList.add("pest");
  pest.style.left = "100vw";

  const img = document.createElement("img");

  const pestImages = ["assets/belalang.png", "assets/wereng.png", "assets/pest.png"];
  const selectedImage = pestImages[Math.floor(Math.random() * pestImages.length)];
  img.src = selectedImage;

  // ⬇ Tambahkan kode ini setelah set img.src
  if (selectedImage.includes("belalang.png")) {
    img.style.width = "100px";
    img.style.height = "auto";
  } else if (selectedImage.includes("wereng.png")) {
    img.style.width = "150px";
    img.style.height = "auto";
  } else if (selectedImage.includes("pest.png")) {
    img.style.width = "100px";
    img.style.height = "auto";
  }

  const wordDisplay = document.createElement("div");
  wordDisplay.classList.add("word");

  const typedSpan = document.createElement("span");
  typedSpan.classList.add("typed");

  const untypedSpan = document.createElement("span");
  untypedSpan.classList.add("untyped");
  untypedSpan.textContent = word;

  wordDisplay.appendChild(typedSpan);
  wordDisplay.appendChild(untypedSpan);

  pest.appendChild(img);
  pest.appendChild(wordDisplay);
  pestsContainer.appendChild(pest);

  const pestObj = {
    element: pest,
    word: word,
    typed: "",
    position: 100,
    speed: (0.2 + currentStage * 0.1) + Math.random() * 0.2,
    typedSpan: typedSpan,
    untypedSpan: untypedSpan
  };
  activePests.push(pestObj);
}

function updatePests(deltaTime) {
  activePests.forEach((pest, i) => {
    pest.position -= pest.speed * deltaTime;
    pest.element.style.left = pest.position + "vw";

    if (pest.position <= 5) {
      hp -= 10;
      showPopup(pest.element, "-10", "damage");
      pest.element.remove();
      activePests.splice(i, 1);
      updateHP();
    }
  });
}

function updateHP() {
  hpFill.style.width = hp + "%";
  if (hp <= 0) {
    showEndScreen("Game Over");
  }
}



function handleKeyPress(event) {
  const key = event.key.toLowerCase();

  activePests.forEach((pest, i) => {
    const expectedChar = pest.word[pest.typed.length];
    if (key === expectedChar) {
      pest.typed += key;
      pest.typedSpan.textContent = pest.typed;
      pest.untypedSpan.textContent = pest.word.slice(pest.typed.length);

      if (pest.typed === pest.word) {
        if (pest.isBoss) {
          // Damage ke boss
          const damage = Math.floor(Math.random() * 11) + 10; // 10–20
          pest.hp -= damage;
          showPopup(pest.element, `-${damage} HP`, "damage");
          if (!muted) {
          document.getElementById("boss-hit-sound").play();
          }
          // Update bar HP boss
          pest.hpFill.style.width = (pest.hp / pest.maxHp) * 100 + "%";

          // Efek blink merah
          pest.element.classList.add("boss-hit");
          setTimeout(() => {
            pest.element.classList.remove("boss-hit");
          }, 200);

          if (pest.hp <= 0) {
            score += 100;
            showPopup(pest.element, "+100", "score");
            pest.element.remove();
            activePests.splice(i, 1);

            document.getElementById("boss-hp-container").style.display = "none";

            // Boss defeated = menang!
            showEndScreen("Selamat! Kamu Menang!");
          } else {
            // Ganti kata boss berikutnya
            pest.currentWordIndex++;
            if (pest.currentWordIndex >= pest.bossWords.length) {
              pest.currentWordIndex = 0;
            }
            pest.word = pest.bossWords[pest.currentWordIndex];
            pest.typed = "";
            pest.typedSpan.textContent = "";
            pest.untypedSpan.textContent = pest.word;
          }
        } else {
          // Musuh kecil mati
          const smallPestScore = Math.floor(Math.random() * 11) + 10; // 10–20
          score += smallPestScore;
          showPopup(pest.element, `+${smallPestScore}`, "score");

          // Mainkan suara jika tidak dimute
          if (!muted) {
            document.getElementById("pest-death-sound").play();
          }

          // Efek animasi mati (jika ada)
          pest.element.classList.add("pest-die");
          setTimeout(() => pest.element.remove(), 300);

          activePests.splice(i, 1);
        }
        updateScore();
      }
    } else if (key.match(/[a-z]/)) {
      // Reset jika salah ketik
      pest.typed = "";
      pest.typedSpan.textContent = "";
      pest.untypedSpan.textContent = pest.word;
    }
  });
}

function showPopup(targetElement, text, type) {
  const popup = document.createElement("div");
  popup.className = "popup-text " + type;
  popup.textContent = text;

  const rect = targetElement.getBoundingClientRect();
  popup.style.left = rect.left + targetElement.offsetWidth / 2 + "px";
  popup.style.top = rect.top - 20 + "px";

  document.body.appendChild(popup);

  setTimeout(() => {
    popup.remove();
  }, 1000);
}

document.addEventListener("keydown", handleKeyPress);

function gameLoop(currentTime) {
  const deltaTime = currentTime - lastTime;
  updatePests(deltaTime / 16);
  lastTime = currentTime;
  requestAnimationFrame(gameLoop);
}

function startGame() {
  if (gameStarted) return;
  playClickSound();
  gameStarted = true;
  playBGM(1);


  document.getElementById("main-menu").style.display = "none";
  document.getElementById("game-container").style.display = "block";

  document.getElementById("options-menu").style.display = "none";
  document.getElementById("credits-menu").style.display = "none";


  pestInterval = setInterval(spawnPest, 3000);
  requestAnimationFrame(gameLoop);
}

function showOptions() {
  playClickSound();
  document.getElementById("main-menu").style.display = "none";
  document.getElementById("options-menu").style.display = "flex";
}

function showCredits() {
   playClickSound();
  document.getElementById("main-menu").style.display = "none";
  document.getElementById("credits-menu").style.display = "flex";
}

function backToMenu() {
   playClickSound();
  document.getElementById("options-menu").style.display = "none";
  document.getElementById("credits-menu").style.display = "none";
  document.getElementById("main-menu").style.display = "flex";
}

function toggleMute() {
   playClickSound();
  muted = document.getElementById("mute-toggle").checked;
}

function showStageBanner(stage) {
  const banner = document.createElement("div");
  banner.className = "stage-banner";
  banner.innerText = "STAGE " + stage;
  document.body.appendChild(banner);

  setTimeout(() => banner.remove(), 2000);
}

function advanceToStage(nextStage) {
  stageActive = false;
  clearInterval(pestInterval);

  const overlay = document.getElementById("stage-transition-overlay");
  const background = document.getElementById("background");

  showStageBanner(`${nextStage}`);
  overlay.style.display = "block";
  overlay.style.opacity = 0;
  requestAnimationFrame(() => {
    overlay.style.opacity = 0.8;
  });

  setTimeout(() => {
    if (nextStage === 2) {
      background.src = "assets/background2.gif";
    } else if (nextStage === 3) {
      background.src = "assets/background3.gif";
    }

    currentStage = nextStage;
    playBGM(nextStage);


    overlay.style.opacity = 0;
    setTimeout(() => {
      overlay.style.display = "none";
      stageActive = true;

      if (nextStage === 2) {
        pestInterval = setInterval(spawnPest, 2000);
      } else if (nextStage === 3) {
        bossSpawned = false;  // reset supaya boss bisa spawn
        let spawnedMiniPests = 0;

        // spawn 3 mini pests secara berurutan dulu
        const miniPestInterval = setInterval(() => {
          spawnPest();
          spawnedMiniPests++;

          if (spawnedMiniPests >= miniPestBeforeBoss) {
            clearInterval(miniPestInterval);

            if (!bossSpawned) {
              spawnBoss();
              bossSpawned = true;
            }

            // Lanjut spawn pest kecil secara rutin
            pestInterval = setInterval(spawnPest, 2000);
          }
        }, 2000);
      }
    }, 1000);
  }, 2000);
}

function updateScore() {
  scoreDisplay.innerText = "Skor: " + score;

  if (score >= stageThresholds[0] && currentStage === 1) {
    advanceToStage(2);
  } else if (score >= stageThresholds[1] && currentStage === 2) {
    advanceToStage(3);
  }
}

function changeBackground(stage) {
  const bg = document.getElementById("background");
  if (stage === 2) {
    bg.src = "assets/background2.gif";
  } else if (stage === 3) {
    bg.src = "assets/background3.gif";
  }
}

function checkStageProgress() {
  if (stage === 1 && score >= 100 && stageActive) {
    advanceToStage(2);
  } else if (stage === 2 && score >= 200 && stageActive) {
    advanceToStage(3);
  }
}

function spawnBoss() {
  console.log("spawnBoss dipanggil!");

  const boss = document.createElement("div");
  boss.classList.add("pest", "boss");
  boss.style.position = "absolute";
  boss.style.bottom = "50px";

  const img = document.createElement("img");
  img.src = "assets/boss.png"; 
  img.style.width = "500px";  // diperbesar dari 120px
  boss.style.width = "500px";  // opsional
  boss.style.height = "auto";  // opsional
  boss.appendChild(img);

  const wordDisplay = document.createElement("div");
  wordDisplay.classList.add("word");

  const typedSpan = document.createElement("span");
  typedSpan.classList.add("typed");
  const untypedSpan = document.createElement("span");
  untypedSpan.classList.add("untyped");

  const bossWords = [
  "permainan", "berkebun", "menyiram", "penyuluhan", "menggiling", 
  "berladang", "menanamkan", "pemupukan", "pengairan", "pengamatan"
];
  let currentWordIndex = 0;
  untypedSpan.textContent = bossWords[currentWordIndex];

  wordDisplay.appendChild(typedSpan);
  wordDisplay.appendChild(untypedSpan);
  boss.appendChild(wordDisplay);

  pestsContainer.appendChild(boss);

  const bossObj = {
    element: boss,
    word: bossWords[currentWordIndex],
    bossWords: bossWords,
    currentWordIndex: currentWordIndex,
    typed: "",
    position: 60,
    speed: 0,
    typedSpan: typedSpan,
    untypedSpan: untypedSpan,
    isBoss: true,
    hp: 300,
    maxHp: 300,
  };

  // Tampilkan bar HP boss dan reset width-nya
  const bossHpContainer = document.getElementById("boss-hp-container");
  const bossHpFill = document.getElementById("boss-hp-fill");
  bossHpContainer.style.display = "block";
  bossHpFill.style.width = "100%";

  // Simpan referensi hpFill di objek boss supaya mudah update
  bossObj.hpFill = bossHpFill;

  activePests.push(bossObj);
}

function playBGM(stage) {
  const bgm1 = document.getElementById("bgm-stage1");
  const bgm2 = document.getElementById("bgm-stage2");
  const bgm3 = document.getElementById("bgm-stage3");

  // Pause semua dulu
  bgm1.pause();
  bgm2.pause();
  bgm3.pause();

  // Reset posisi play ke awal
  bgm1.currentTime = 0;
  bgm2.currentTime = 0;
  bgm3.currentTime = 0;

  if (muted) return;

  if (stage === 1) {
    bgm1.play();
  } else if (stage === 2) {
    bgm2.play();
  } else if (stage === 3) {
    bgm3.play();
  }
}


function toggleMute() {
  muted = document.getElementById("mute-toggle").checked;

  const bgm1 = document.getElementById("bgm-stage1");
  const bgm2 = document.getElementById("bgm-stage2");
  const bgm3 = document.getElementById("bgm-stage3");

  if (muted) {
    bgm1.pause();
    bgm2.pause();
    bgm3.pause();
  } else {
    playBGM(currentStage);
  }
}

function showEndScreen(message) {
  document.getElementById("game-container").style.display = "none";
  document.getElementById("end-screen").style.display = "flex";
  document.getElementById("end-message").innerText = message;
  document.getElementById("final-score").innerText = "Skor: " + score;

  // Hentikan BGM
  const bgm1 = document.getElementById("bgm-stage1");
  const bgm2 = document.getElementById("bgm-stage2");
  const bgm3 = document.getElementById("bgm-stage3");
  bgm1.pause(); bgm2.pause(); bgm3.pause();
}

function restartGame() {
   playClickSound();
  location.reload();
}

function playClickSound() {
  if (!muted) {
    const sound = document.getElementById("click-sound");
    sound.currentTime = 0;
    sound.play();
  }
}
