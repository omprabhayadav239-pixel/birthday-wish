/**
 * ROMANTIC INTERACTIVE BIRTHDAY EXPERIENCE
 * Complete interactive logic: Intro gate, runaway No button, 3-2-1 countdown,
 * Web Audio synthesizer, mini-games, pop-up wishes, and auto-scrolling video tour.
 */

// Global State
let audioCtx = null;
let isMusicPlaying = false;
let musicInterval = null;
let isTourActive = false;
let tourTimeout = null;

/* ==========================================================================
   1. WEB AUDIO API SYNTHESIZER (Gentle Music Box / Sound FX)
   Zero external dependencies - Works seamlessly offline & online!
   ========================================================================== */

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Play a tone with envelope
function playTone(freq, type = 'sine', duration = 0.3, volume = 0.15) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn('Audio tone error:', e);
  }
}

// Countdown beep
function playCountdownBeep(isFinal = false) {
  if (isFinal) {
    playTone(784, 'triangle', 0.6, 0.25); // G5
    setTimeout(() => playTone(1046.5, 'triangle', 0.8, 0.3), 150); // C6
  } else {
    playTone(523.25, 'sine', 0.2, 0.2); // C5
  }
}

// Cute Pop sound for catching items
function playPopSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch (e) {}
}

// Success Chime (Fanfare)
function playSuccessChime() {
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  notes.forEach((freq, idx) => {
    setTimeout(() => playTone(freq, 'triangle', 0.45, 0.15), idx * 100);
  });
}

// Blow candle breath sound
function playBlowSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const bufferSize = ctx.sampleRate * 0.4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 1.0;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
  } catch (e) {}
}

// Happy Birthday & Romantic Melody Loop
// Melody notes: Happy Birthday to You tune transcribed
const birthdayMelody = [
  { f: 261.63, d: 0.35, pause: 0.4 }, // Hap-
  { f: 261.63, d: 0.25, pause: 0.3 }, // py
  { f: 293.66, d: 0.6, pause: 0.65 }, // Birth-
  { f: 261.63, d: 0.6, pause: 0.65 }, // day
  { f: 349.23, d: 0.6, pause: 0.65 }, // to
  { f: 329.63, d: 1.1, pause: 1.2 },  // you

  { f: 261.63, d: 0.35, pause: 0.4 }, // Hap-
  { f: 261.63, d: 0.25, pause: 0.3 }, // py
  { f: 293.66, d: 0.6, pause: 0.65 }, // Birth-
  { f: 261.63, d: 0.6, pause: 0.65 }, // day
  { f: 392.00, d: 0.6, pause: 0.65 }, // to
  { f: 349.23, d: 1.1, pause: 1.2 },  // you

  { f: 261.63, d: 0.35, pause: 0.4 }, // Hap-
  { f: 261.63, d: 0.25, pause: 0.3 }, // py
  { f: 523.25, d: 0.7, pause: 0.75 }, // Birth-
  { f: 440.00, d: 0.7, pause: 0.75 }, // day
  { f: 349.23, d: 0.6, pause: 0.65 }, // dear
  { f: 329.63, d: 0.6, pause: 0.65 }, // hand-
  { f: 293.66, d: 1.1, pause: 1.2 },  // some

  { f: 466.16, d: 0.35, pause: 0.4 }, // Hap-
  { f: 466.16, d: 0.25, pause: 0.3 }, // py
  { f: 440.00, d: 0.6, pause: 0.65 }, // Birth-
  { f: 349.23, d: 0.6, pause: 0.65 }, // day
  { f: 392.00, d: 0.7, pause: 0.75 }, // to
  { f: 349.23, d: 1.4, pause: 1.6 }   // you!
];

let melodyIndex = 0;
function playNextMelodyNote() {
  if (!isMusicPlaying) return;
  const note = birthdayMelody[melodyIndex];
  // Gentle celesta chime style tone
  playTone(note.f, 'triangle', note.d, 0.12);
  // Add soft harmony third
  playTone(note.f * 1.25, 'sine', note.d * 0.8, 0.05);

  melodyIndex = (melodyIndex + 1) % birthdayMelody.length;
  musicInterval = setTimeout(playNextMelodyNote, note.pause * 1000);
}

function startMusic() {
  isMusicPlaying = true;
  melodyIndex = 0;
  playNextMelodyNote();
  updateMusicUI(true);
}

function stopMusic() {
  isMusicPlaying = false;
  if (musicInterval) {
    clearTimeout(musicInterval);
    musicInterval = null;
  }
  updateMusicUI(false);
}

function toggleMusic() {
  getAudioContext();
  if (isMusicPlaying) {
    stopMusic();
  } else {
    startMusic();
  }
}

function updateMusicUI(playing) {
  const statusEl = document.getElementById('musicStatus');
  const soundWave = document.getElementById('soundWave');
  const iconEl = document.getElementById('musicIcon');

  if (playing) {
    if (statusEl) statusEl.textContent = 'ON';
    if (soundWave) soundWave.classList.add('playing');
    if (iconEl) iconEl.textContent = '🎶';
  } else {
    if (statusEl) statusEl.textContent = 'OFF';
    if (soundWave) soundWave.classList.remove('playing');
    if (iconEl) iconEl.textContent = '🎵';
  }
}

/* ==========================================================================
   2. RUNAWAY NO BUTTON & YES GATE VERIFICATION + 3 2 1 COUNTDOWN
   ========================================================================= */

const noBtn = document.getElementById('noBtn');
const yesBtn = document.getElementById('yesBtn');
const introCard = document.getElementById('introCard');
const runawayHint = document.getElementById('runawayHint');
const countdownContainer = document.getElementById('countdownContainer');
const countdownNumber = document.getElementById('countdownNumber');
const countdownText = document.getElementById('countdownText');
const countdownStatusBadge = document.getElementById('countdownStatusBadge');
const ringFillCircle = document.getElementById('ringFillCircle');
const introGateOverlay = document.getElementById('introGateOverlay');
const countdownSky = document.getElementById('countdownSky');
const energyPercent = document.getElementById('energyPercent');
const boosterFill = document.getElementById('boosterFill');
const boostHeartBtn = document.getElementById('boostHeartBtn');
const boostCountEl = document.getElementById('boostCount');
const unwrapStage = document.getElementById('unwrapStage');
const unwrapBigBtn = document.getElementById('unwrapBigBtn');

let runawayCount = 0;
const funnyNoPhrases = [
  "Nice try! 😜",
  "Oops, missed! 🙈",
  "You HAVE to click Yes! 💕",
  "Wrong button, cutie! 😉",
  "Girlfriend veto power activated! 🚫",
  "Boyfriend is too handsome to say no! 💖",
  "Yes is your only destiny! 🥰"
];

function dodgeNoButton(e) {
  if (e) e.preventDefault();
  runawayCount++;

  // Shift position randomly within bounds
  const maxX = 140;
  const maxY = 60;
  const randomX = (Math.random() - 0.5) * maxX * 2;
  const randomY = (Math.random() - 0.5) * maxY * 2;

  noBtn.style.transform = `translate(${randomX}px, ${randomY}px) scale(${Math.max(0.65, 1 - runawayCount * 0.05)})`;

  // Change button text humorously
  const phrase = funnyNoPhrases[runawayCount % funnyNoPhrases.length];
  noBtn.querySelector('span').textContent = phrase;

  // Make Yes button bigger, pulsing with gold glow
  yesBtn.style.transform = `scale(${1 + Math.min(0.28, runawayCount * 0.05)})`;

  if (runawayHint) {
    runawayHint.textContent = `Attempt #${runawayCount}: Blocked! Girlfriend has officially prohibited saying No! 💕`;
    runawayHint.classList.add('show');
  }

  // Play cute quick pop
  playTone(420, 'sine', 0.12, 0.15);
}

if (noBtn) {
  noBtn.addEventListener('mouseenter', dodgeNoButton);
  noBtn.addEventListener('touchstart', dodgeNoButton, { passive: false });
  noBtn.addEventListener('click', dodgeNoButton);
}

if (yesBtn) {
  yesBtn.addEventListener('click', () => {
    getAudioContext();
    triggerCountdownFlow();
  });
}

// Interactive Love Booster Button Logic
let totalLoveTaps = 0;
let currentEnergy = 33;

function handleBoostHeart() {
  totalLoveTaps++;
  currentEnergy = Math.min(100, currentEnergy + 12);
  
  if (boostCountEl) boostCountEl.textContent = totalLoveTaps;
  if (energyPercent) energyPercent.textContent = currentEnergy + '%';
  if (boosterFill) boosterFill.style.width = currentEnergy + '%';

  playPopSound();

  // Floating heart burst animation from button
  const burstHeart = document.createElement('div');
  burstHeart.textContent = '💖';
  burstHeart.style.position = 'fixed';
  const rect = boostHeartBtn.getBoundingClientRect();
  burstHeart.style.left = (rect.left + rect.width / 2 + (Math.random() - 0.5) * 60) + 'px';
  burstHeart.style.top = rect.top + 'px';
  burstHeart.style.fontSize = (20 + Math.random() * 16) + 'px';
  burstHeart.style.pointerEvents = 'none';
  burstHeart.style.transition = 'all 0.8s ease-out';
  burstHeart.style.zIndex = '99999';
  document.body.appendChild(burstHeart);

  requestAnimationFrame(() => {
    burstHeart.style.transform = `translate(${(Math.random() - 0.5) * 80}px, -100px) scale(1.4)`;
    burstHeart.style.opacity = '0';
  });

  setTimeout(() => burstHeart.remove(), 850);
}

if (boostHeartBtn) {
  boostHeartBtn.addEventListener('click', handleBoostHeart);
}

// Floating Poppable Sky Items during Countdown
let skyInterval = null;
const skyEmojis = ['🎈', '💖', '🎁', '✨', '🧁', '🌟', '🥰'];

function startPoppableSky() {
  if (!countdownSky) return;
  skyInterval = setInterval(() => {
    const item = document.createElement('div');
    item.className = 'sky-poppable-item';
    item.textContent = skyEmojis[Math.floor(Math.random() * skyEmojis.length)];
    item.style.left = Math.floor(Math.random() * (window.innerWidth - 70)) + 'px';

    const duration = 3.5 + Math.random() * 2.5;
    item.style.animationDuration = duration + 's';

    item.addEventListener('click', (e) => {
      e.stopPropagation();
      playPopSound();
      
      // Mini confetti burst at click position
      if (typeof confetti === 'function') {
        confetti({
          particleCount: 15,
          startVelocity: 20,
          spread: 60,
          origin: {
            x: e.clientX / window.innerWidth,
            y: e.clientY / window.innerHeight
          }
        });
      }

      handleBoostHeart();
      item.remove();
    });

    countdownSky.appendChild(item);

    setTimeout(() => {
      if (item.parentNode === countdownSky) {
        item.remove();
      }
    }, duration * 1000);
  }, 480);
}

function stopPoppableSky() {
  if (skyInterval) {
    clearInterval(skyInterval);
    skyInterval = null;
  }
}

function triggerCountdownFlow() {
  // Hide initial question card
  introCard.classList.add('hidden');
  countdownContainer.classList.remove('hidden');

  startPoppableSky();

  let currentCount = 3;
  countdownNumber.textContent = currentCount;
  playCountdownBeep(false);

  const countdownStages = {
    3: {
      badge: "STAGE 1: CALIBRATING BOYFRIEND CUTENESS",
      text: "Calibrating charm levels... Result: 100/10! 📈💖",
      ringOffset: 400,
      energy: 33
    },
    2: {
      badge: "STAGE 2: LOADING HANDSOME MEMORIES",
      text: "Gathering our goofiest photos & sweetest memories... Ready! 👑",
      ringOffset: 200,
      energy: 66
    },
    1: {
      badge: "STAGE 3: ARMING CONFETTI CANNONS",
      text: "Lighting the virtual candles and tuning the celebration! 🎂✨",
      ringOffset: 60,
      energy: 90
    }
  };

  const countdownTimer = setInterval(() => {
    currentCount--;

    if (currentCount > 0) {
      const stage = countdownStages[currentCount];
      countdownNumber.textContent = currentCount;
      if (countdownStatusBadge) countdownStatusBadge.textContent = stage.badge;
      if (countdownText) countdownText.textContent = stage.text;
      if (ringFillCircle) ringFillCircle.style.strokeDashoffset = stage.ringOffset;
      if (energyPercent) energyPercent.textContent = stage.energy + '%';
      if (boosterFill) boosterFill.style.width = stage.energy + '%';

      playCountdownBeep(false);
    } else if (currentCount === 0) {
      clearInterval(countdownTimer);

      // Finish Ring & Energy
      if (ringFillCircle) ringFillCircle.style.strokeDashoffset = 0;
      if (energyPercent) energyPercent.textContent = '100%';
      if (boosterFill) boosterFill.style.width = '100%';

      countdownNumber.textContent = "🎁";
      if (countdownStatusBadge) countdownStatusBadge.textContent = "STATUS: SURPRISE UNLOCKED! ✨";
      if (countdownText) countdownText.textContent = "Your special birthday world is ready!";

      playCountdownBeep(true);

      // Show the Interactive Unwrap Surprise Box Stage
      setTimeout(() => {
        document.querySelector('.countdown-dial-wrap').classList.add('hidden');
        document.querySelector('.countdown-booster-box').classList.add('hidden');
        if (countdownText) countdownText.classList.add('hidden');
        if (unwrapStage) unwrapStage.classList.remove('hidden');
      }, 500);
    }
  }, 1200);
}

// When Birthday Boy Clicks the Big Unwrap Button
if (unwrapBigBtn) {
  unwrapBigBtn.addEventListener('click', () => {
    stopPoppableSky();
    playSuccessChime();
    triggerGrandConfettiBlast();

    // Fade out overlay & unlock website
    introGateOverlay.classList.add('fade-out');
    document.body.classList.remove('locked');

    setTimeout(() => {
      introGateOverlay.classList.add('hidden');
    }, 800);

    // Start background romantic birthday melody
    startMusic();
  });
}

/* ==========================================================================
   3. POP-UP WISH MODAL HANDLER
   ========================================================================== */

const wishModalOverlay = document.getElementById('wishModalOverlay');
const modalIcon = document.getElementById('modalIcon');
const modalBadge = document.getElementById('modalBadge');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');

const wishesData = {
  goofy: {
    icon: "🎂✨",
    badge: "My Special Birthday Wish",
    title: "Happy Birthday, My Handsome Boy! ❤️",
    content: `
      <p>Happy Birthday to the most amazing, charming, and sweetest boy in the entire world! 🎂💖</p>
      <br>
      <p>I wish you a year overflowing with pure happiness, big successes, peace of mind, and all the love your heart can hold. You bring so much light, fun, and comfort into my life, and I am endlessly grateful for you.</p>
      <br>
      <p>I promise to always be your biggest cheerleader, stand by your side through everything, and love you more and more every single day. Have the happiest birthday ever, my handsome king! 🥂👑</p>
    `
  },
  sweet: {
    icon: "🥺🤍",
    badge: "Heart to Heart",
    title: "My Safest Haven",
    content: `
      <p>When I think of what peace feels like, I think of your arms around me and your gentle smile looking down at me.</p>
      <br>
      <p>Thank you for being patient when I'm grumpy, listening to my endless rambles, and always making me feel so cherished and protected. You are genuinely the kindest human I know.</p>
      <br>
      <p>On your special day, I pray you receive ten times the love and comfort you give to me every single day. I love you more than words could ever describe.</p>
    `
  },
  clingy: {
    icon: "💋🥰",
    badge: "Girlfriend Warning",
    title: "Officially Stuck With Me Forever!",
    content: `
      <p>Listen up birthday boy: There are no refunds, returns, or exchanges! You are officially my favorite human for life! 💍✨</p>
      <br>
      <p>I love taking cute selfies with you, planting kisses on your cheeks when you're busy, and bragging about how handsome my man is. You look so good in everything you wear (especially those glasses!).</p>
      <br>
      <p>Today you are entitled to endless forehead kisses, sweet hugs, and being treated like the king you truly are!</p>
    `
  },
  coupon1: {
    icon: "🎟️🫂",
    badge: "Official Love Voucher",
    title: "Boyfriend Coupon #1",
    content: `
      <div class="coupon-ticket-view">
        <h4>UNLIMITED CUDDLES & KISSES</h4>
        <p>This coupon entitles the handsome birthday boy to non-stop warm hugs, head scratches, and sweet kisses anytime, anywhere!</p>
        <div class="coupon-code-stamp">VOUCHER: FOREVER-CLINGY-2026</div>
      </div>
      <p><em>*Valid for lifetime. Cannot be cancelled by issuer. Redeemable immediately!</em></p>
    `
  },
  coupon2: {
    icon: "🍰☕",
    badge: "Official Food Pass",
    title: "Boyfriend Coupon #2",
    content: `
      <div class="coupon-ticket-view">
        <h4>FAVORITE FOODIE & CAFE DATE</h4>
        <p>Present this ticket for a delicious cafe date, favorite takeout treat, or yummy dessert of your choice — paid with girlfriend's love & wallet!</p>
        <div class="coupon-code-stamp">VOUCHER: TREAT-MY-KING-999</div>
      </div>
      <p><em>*Extra fries and dessert included with zero judgment!</em></p>
    `
  },
  coupon3: {
    icon: "🎮👾",
    badge: "Gamer Immunity Pass",
    title: "Boyfriend Coupon #3",
    content: `
      <div class="coupon-ticket-view">
        <h4>GUILT-FREE GAMING PASS</h4>
        <p>Grants you uninterrupted hours to game with the boys, accompanied by your favorite snacks brought straight to you!</p>
        <div class="coupon-code-stamp">VOUCHER: PRO-GAMER-BOY-007</div>
      </div>
      <p><em>*Comes with a guarantee of zero interruptions and maximum hype!</em></p>
    `
  },
  reasons: {
    icon: "💖📝",
    badge: "5 Things I Adore",
    title: "5 Things I Adore About You",
    content: `
      <ul>
        <li>The way your eyes crinkle and light up whenever you smile at me.</li>
        <li>How safe, peaceful, and warm I feel whenever you hold my hand.</li>
        <li>How ridiculously handsome you look (in your kurta, your glasses, and your casual tees!).</li>
        <li>How you remember the little details and always share your food with me.</li>
        <li>Simply because you are YOU — my soulmate, best friend, and whole heart.</li>
      </ul>
    `
  },
  prayer: {
    icon: "🌟🙏",
    badge: "Birthday Blessing",
    title: "My Prayer For Your New Year",
    content: `
      <p>May this year open doors you never even imagined. May your hard work bear the sweetest fruit, and may every ambition you carry in your heart turn into a grand victory.</p>
      <br>
      <p>I pray for your health, your peace of mind, your happiness, and that whenever you feel stressed, you find comfort in knowing that you are deeply, unconditionally loved.</p>
      <br>
      <p>Cheers to another year of growing, shining, and thriving together! 🥂✨</p>
    `
  },
  future: {
    icon: "✈️🌅",
    badge: "Our Future Adventures",
    title: "The Dreams Waiting For Us",
    content: `
      <ul>
        <li>Taking scenic road trips and fun adventures with music playing.</li>
        <li>Traveling to dreamy mountains and sunny beach sunsets together.</li>
        <li>Trying crazy street foods and rating them like Michelin star chefs.</li>
        <li>Building our dream lives side by side, celebrating every milestone.</li>
        <li>Growing old together and laughing at all our silly memories!</li>
      </ul>
    `
  }
};

function openWishModal(type) {
  const data = wishesData[type];
  if (!data) return;

  modalIcon.textContent = data.icon;
  modalBadge.textContent = data.badge;
  modalTitle.textContent = data.title;
  modalBody.innerHTML = data.content;

  wishModalOverlay.classList.remove('hidden');
  playSuccessChime();
}

function closeWishModal() {
  wishModalOverlay.classList.add('hidden');
}

if (wishModalOverlay) {
  wishModalOverlay.addEventListener('click', (e) => {
    if (e.target === wishModalOverlay) {
      closeWishModal();
    }
  });
}

/* ==========================================================================
   4. MINI GAMES LOGIC
   ========================================================================== */

// Switch Game Tabs
function switchGame(gameId) {
  const tabs = document.querySelectorAll('.game-tab-btn');
  tabs.forEach(tab => {
    if (tab.getAttribute('data-game') === gameId) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  const views = document.querySelectorAll('.game-view');
  views.forEach(view => {
    if (view.id === gameId) {
      view.classList.add('active');
    } else {
      view.classList.remove('active');
    }
  });

  if (gameId === 'game-wheel') {
    drawWheel();
  }
}

// GAME 1: CAKE & BLOW CANDLES
function blowCandlesAction() {
  playBlowSound();
  const candles = document.querySelectorAll('.candle');
  candles.forEach((candle, idx) => {
    setTimeout(() => {
      candle.classList.remove('lit');
      candle.classList.add('blown');
    }, idx * 120);
  });

  setTimeout(() => {
    document.getElementById('blowCandlesBtn').classList.add('hidden');
    document.getElementById('relightCandlesBtn').classList.remove('hidden');
    document.getElementById('cakeMessage').classList.remove('hidden');
    playSuccessChime();
    triggerGrandConfettiBlast();
  }, 700);
}

function relightCandlesAction() {
  const candles = document.querySelectorAll('.candle');
  candles.forEach(candle => {
    candle.classList.remove('blown');
    candle.classList.add('lit');
  });
  document.getElementById('blowCandlesBtn').classList.remove('hidden');
  document.getElementById('relightCandlesBtn').classList.add('hidden');
  document.getElementById('cakeMessage').classList.add('hidden');
}

// GAME 2: CATCH THE LOVE
let catcherScore = 0;
let catcherTimeLeft = 20;
let catcherTimerId = null;
let catcherSpawnId = null;
let isCatcherRunning = false;

const catchEmojis = ['💖', '🎂', '💌', '👑', '🎁', '🎈', '✨', '🧁'];

function startCatcherGame() {
  if (isCatcherRunning) return;
  isCatcherRunning = true;
  catcherScore = 0;
  catcherTimeLeft = 20;

  document.getElementById('catcherScore').textContent = '0';
  document.getElementById('catcherTimer').textContent = '20s';
  document.getElementById('startCatcherBtn').disabled = true;
  document.getElementById('startCatcherBtn').textContent = "Catching...! 🏃‍♂️";
  document.getElementById('arenaPlaceholder').classList.add('hidden');

  const arena = document.getElementById('catcherArena');

  // Spawn items
  catcherSpawnId = setInterval(() => {
    if (!isCatcherRunning) return;
    spawnCatchItem(arena);
  }, 450);

  // Timer countdown
  catcherTimerId = setInterval(() => {
    catcherTimeLeft--;
    document.getElementById('catcherTimer').textContent = catcherTimeLeft + 's';

    if (catcherTimeLeft <= 0) {
      endCatcherGame();
    }
  }, 1000);
}

function spawnCatchItem(arena) {
  const item = document.createElement('div');
  item.className = 'floating-catch-item';
  const emoji = catchEmojis[Math.floor(Math.random() * catchEmojis.length)];
  item.textContent = emoji;

  // Random X coordinate within arena
  const arenaWidth = arena.clientWidth || 340;
  const posX = Math.max(20, Math.floor(Math.random() * (arenaWidth - 60)));
  item.style.left = posX + 'px';

  // Random speed
  const duration = 2.2 + Math.random() * 1.5;
  item.style.animationDuration = duration + 's';

  item.addEventListener('click', () => {
    catcherScore += 10;
    document.getElementById('catcherScore').textContent = catcherScore;
    playPopSound();
    item.remove();
  });

  arena.appendChild(item);

  // Auto clean up after animation finishes
  setTimeout(() => {
    if (item.parentNode === arena) {
      item.remove();
    }
  }, duration * 1000);
}

function endCatcherGame() {
  isCatcherRunning = false;
  clearInterval(catcherSpawnId);
  clearInterval(catcherTimerId);

  document.getElementById('startCatcherBtn').disabled = false;
  document.getElementById('startCatcherBtn').textContent = "Play Again 🔁";

  // Clear arena
  const arena = document.getElementById('catcherArena');
  arena.querySelectorAll('.floating-catch-item').forEach(el => el.remove());

  // Show results
  const resultModal = document.getElementById('catcherResultModal');
  const resultText = document.getElementById('catcherResultText');
  resultText.textContent = `Incredible! You caught ${catcherScore} Love Points! You truly are boyfriend of the century! 💖`;
  resultModal.classList.remove('hidden');

  playSuccessChime();
  triggerGrandConfettiBlast();
}

function closeCatcherResult() {
  document.getElementById('catcherResultModal').classList.add('hidden');
  document.getElementById('arenaPlaceholder').classList.remove('hidden');
}

// GAME 3: RELATIONSHIP QUIZ
const quizQuestions = [
  {
    q: "What is your girlfriend's absolute favorite thing about you?",
    options: [
      { t: "Your infectious smile & sweet laugh", correct: false, msg: "So true, but there's an even better answer!" },
      { t: "How handsome you look in white kurta & glasses", correct: false, msg: "You look drop dead gorgeous, but wait!" },
      { t: "Your huge, caring, and protective heart", correct: false, msg: "Aww absolutely yes, but..." },
      { t: "All of the above and EVERYTHING about you! ❤️", correct: true, msg: "BINGO! You're the whole package! 🥰" }
    ]
  },
  {
    q: "Who is the officially recognized clingiest person in this relationship?",
    options: [
      { t: "Your girlfriend (and proud of it!) 🙋‍♀️", correct: true, msg: "Guilty as charged! You're stuck with me forever! 💋" },
      { t: "You, when you want food or cuddles 😉", correct: true, msg: "Haha yes! You have your moments too cutie!" },
      { t: "Equal 50/50 mutual obsession ✨", correct: true, msg: "The best kind of dynamic! 💕" }
    ]
  },
  {
    q: "What is the mandatory birthday agenda for you today?",
    options: [
      { t: "Get spoiled, eat unlimited cake, and be treated like a king 👑", correct: true, msg: "Exactly! Your wish is my command today!" },
      { t: "Listen to girlfriend tell you how cute you are 100 times", correct: true, msg: "Non-negotiable requirement! 🥰" },
      { t: "Smile big and feel happier than ever", correct: true, msg: "Yes! May this year be your best one yet! 🎉" }
    ]
  },
  {
    q: "How long is your girlfriend planning to love you?",
    options: [
      { t: "Until next week 😜", correct: false, msg: "Hey! Try that again mister!" },
      { t: "For 100 years", correct: false, msg: "Not long enough!" },
      { t: "To infinity and beyond, through every lifetime ❤️", correct: true, msg: "Forever and always, my love! ✨" }
    ]
  }
];

let currentQuizIndex = 0;
let quizAnswered = false;

function loadQuizQuestion() {
  quizAnswered = false;
  const qData = quizQuestions[currentQuizIndex];
  document.getElementById('quizNumber').textContent = `Question ${currentQuizIndex + 1} of ${quizQuestions.length}`;
  document.getElementById('quizQuestionTitle').textContent = qData.q;
  document.getElementById('quizProgressFill').style.width = `${((currentQuizIndex + 1) / quizQuestions.length) * 100}%`;

  const optionsList = document.getElementById('quizOptionsList');
  optionsList.innerHTML = '';
  document.getElementById('quizFeedbackBox').classList.add('hidden');
  document.getElementById('quizNextBtn').classList.add('hidden');

  qData.options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-option-btn';
    btn.innerHTML = `<span>${opt.t}</span> <span class="opt-indicator">➔</span>`;
    btn.onclick = () => selectQuizOption(btn, opt);
    optionsList.appendChild(btn);
  });
}

function selectQuizOption(btn, opt) {
  if (quizAnswered) return;
  quizAnswered = true;

  const feedbackBox = document.getElementById('quizFeedbackBox');
  feedbackBox.textContent = opt.msg;
  feedbackBox.classList.remove('hidden');

  if (opt.correct) {
    btn.classList.add('correct');
    playSuccessChime();
  } else {
    btn.classList.add('wrong');
    playTone(250, 'sawtooth', 0.2, 0.15);
  }

  const nextBtn = document.getElementById('quizNextBtn');
  nextBtn.classList.remove('hidden');
  if (currentQuizIndex === quizQuestions.length - 1) {
    nextBtn.textContent = "See Final Verdict! 🏆";
  } else {
    nextBtn.textContent = "Next Question →";
  }
}

function nextQuizQuestion() {
  if (currentQuizIndex < quizQuestions.length - 1) {
    currentQuizIndex++;
    loadQuizQuestion();
  } else {
    // Show completed
    document.getElementById('quizBox').classList.add('hidden');
    document.getElementById('quizCompleted').classList.remove('hidden');
    triggerGrandConfettiBlast();
    playSuccessChime();
  }
}

function restartQuiz() {
  currentQuizIndex = 0;
  document.getElementById('quizBox').classList.remove('hidden');
  document.getElementById('quizCompleted').classList.add('hidden');
  loadQuizQuestion();
}

// GAME 4: SPIN WHEEL OF ROMANCE
const wheelPrizes = [
  "A Romantic Special Date On Me 🍷",
  "100 Sweet Forehead Kisses 💋",
  "Full Relaxation Massage 💆‍♂️",
  "Fun Scenic Drive & Ice Cream Treat 🍦",
  "Get-Out-Of-Any-Argument Free Card 🎟️",
  "Homemade Favorite Meal & Dessert 🍰"
];

const wheelColors = ['#ff3b77', '#9d4edd', '#ffd166', '#ff758c', '#6a1b9a', '#fca311'];
let wheelAngle = 0;
let isSpinning = false;

function drawWheel() {
  const canvas = document.getElementById('wheelCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const size = canvas.width;
  const center = size / 2;
  const radius = center - 8;
  const slices = wheelPrizes.length;
  const sliceAngle = (2 * Math.PI) / slices;

  ctx.clearRect(0, 0, size, size);

  for (let i = 0; i < slices; i++) {
    const startA = wheelAngle + i * sliceAngle;
    const endA = startA + sliceAngle;

    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius, startA, endA);
    ctx.fillStyle = wheelColors[i % wheelColors.length];
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Draw text inside slice
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(startA + sliceAngle / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Plus Jakarta Sans, sans-serif';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 4;
    // Shorten label for canvas readability
    const label = wheelPrizes[i].split(' ')[0] + ' ' + (wheelPrizes[i].split(' ')[1] || '');
    ctx.fillText(label, radius - 20, 4);
    ctx.restore();
  }

  // Draw Center Hub
  ctx.beginPath();
  ctx.arc(center, center, 24, 0, 2 * Math.PI);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#ff3b77';
  ctx.stroke();

  ctx.fillStyle = '#ff3b77';
  ctx.font = '16px serif';
  ctx.textAlign = 'center';
  ctx.fillText('💖', center, center + 5);
}

function spinWheelAction() {
  if (isSpinning) return;
  isSpinning = true;
  document.getElementById('spinWheelBtn').disabled = true;
  document.getElementById('wheelPrizeBox').classList.add('hidden');

  const extraSpins = 5 + Math.random() * 5; // 5 to 10 full rotations
  const targetPrizeIndex = Math.floor(Math.random() * wheelPrizes.length);
  const slices = wheelPrizes.length;
  const sliceAngle = (2 * Math.PI) / slices;

  // The pointer is at the top (angle -Math.PI / 2)
  const pointerAngle = -Math.PI / 2;
  const targetSliceMid = targetPrizeIndex * sliceAngle + sliceAngle / 2;
  const finalAngle = extraSpins * (2 * Math.PI) + (pointerAngle - targetSliceMid);

  const startA = wheelAngle;
  const duration = 4000;
  const startTime = performance.now();

  function animateSpin(now) {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / duration);
    // Ease out cubic
    const ease = 1 - Math.pow(1 - progress, 3);
    wheelAngle = startA + (finalAngle - startA) * ease;
    drawWheel();

    if (progress < 1) {
      requestAnimationFrame(animateSpin);
    } else {
      isSpinning = false;
      document.getElementById('spinWheelBtn').disabled = false;
      document.getElementById('wheelPrizeText').textContent = wheelPrizes[targetPrizeIndex];
      document.getElementById('wheelPrizeBox').classList.remove('hidden');
      playSuccessChime();
      triggerGrandConfettiBlast();
    }
  }

  requestAnimationFrame(animateSpin);
}

/* ==========================================================================
   5. AUTOMATIC VIDEO STORY TOUR (Wish Video Walkthrough Mode)
   Smoothly auto-scrolls, reveals popups, and animates celebration!
   ========================================================================== */

const videoTourBtn = document.getElementById('videoTourBtn');
const tourBtnText = document.getElementById('tourBtnText');

function toggleVideoTour() {
  if (isTourActive) {
    stopVideoTour();
  } else {
    startVideoTour();
  }
}

function startVideoTour() {
  isTourActive = true;
  videoTourBtn.classList.add('active');
  tourBtnText.textContent = "Pause Video Tour ⏸️";
  if (!isMusicPlaying) startMusic();

  const scenes = [
    { target: '#heroSection', duration: 4000, action: () => triggerGrandConfettiBlast() },
    { target: '#sectionGoofy', duration: 4500, action: () => openWishModal('goofy') },
    { target: '#sectionSweet', duration: 4500, action: () => openWishModal('sweet') },
    { target: '#sectionClingy', duration: 4500, action: () => openWishModal('clingy') },
    { target: '#wishesGallerySection', duration: 4000, action: () => closeWishModal() },
    { target: '#gamesSection', duration: 5000, action: () => {
      switchGame('game-cake');
      setTimeout(blowCandlesAction, 1500);
    }},
    { target: '#photoReelSection', duration: 4500, action: () => {} },
    { target: '#finaleSection', duration: 6000, action: () => triggerGrandConfettiBlast() }
  ];

  let currentScene = 0;

  function runScene() {
    if (!isTourActive || currentScene >= scenes.length) {
      stopVideoTour();
      return;
    }

    const scene = scenes[currentScene];
    const el = document.querySelector(scene.target);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    if (scene.action) {
      scene.action();
    }

    currentScene++;
    tourTimeout = setTimeout(runScene, scene.duration);
  }

  runScene();
}

function stopVideoTour() {
  isTourActive = false;
  videoTourBtn.classList.remove('active');
  tourBtnText.textContent = "Play as Video Story 🎬";
  if (tourTimeout) {
    clearTimeout(tourTimeout);
    tourTimeout = null;
  }
}

if (videoTourBtn) {
  videoTourBtn.addEventListener('click', toggleVideoTour);
}

const musicToggleBtn = document.getElementById('musicToggleBtn');
if (musicToggleBtn) {
  musicToggleBtn.addEventListener('click', toggleMusic);
}

/* ==========================================================================
   6. CELEBRATORY CONFETTI CANNON
   ========================================================================== */

function triggerGrandConfettiBlast() {
  if (typeof confetti !== 'function') return;

  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    colors: ['#ff3b77', '#ffd166', '#ffffff', '#9d4edd', '#ff758c']
  };

  function fire(particleRatio, opts) {
    confetti(Object.assign({}, defaults, opts, {
      particleCount: Math.floor(count * particleRatio)
    }));
  }

  fire(0.25, { spread: 26, startVelocity: 55 });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ==========================================================================
   7. BACKGROUND STARRY & FLOATING HEARTS CANVAS
   ========================================================================== */

function initStarCanvas() {
  const canvas = document.getElementById('starCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const stars = [];
  const starCount = 80;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.5,
      alpha: Math.random(),
      speed: Math.random() * 0.02 + 0.005,
      isHeart: Math.random() > 0.85
    });
  }

  function renderStars() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.alpha += s.speed;
      if (s.alpha > 1 || s.alpha < 0) s.speed = -s.speed;

      if (s.isHeart) {
        ctx.fillStyle = `rgba(255, 101, 132, ${Math.abs(s.alpha) * 0.7})`;
        ctx.font = `${Math.floor(s.size * 5 + 6)}px serif`;
        ctx.fillText('♥', s.x, s.y);
      } else {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, 2 * Math.PI);
        ctx.fillStyle = `rgba(255, 235, 180, ${Math.abs(s.alpha) * 0.8})`;
        ctx.shadowBlur = s.size * 3;
        ctx.shadowColor = '#ffd166';
        ctx.fill();
      }
    }

    requestAnimationFrame(renderStars);
  }

  renderStars();
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
  initStarCanvas();
  loadQuizQuestion();
  drawWheel();

  // Scroll down hint click
  const scrollDownHint = document.getElementById('scrollDownHint');
  if (scrollDownHint) {
    scrollDownHint.addEventListener('click', () => {
      const nextSection = document.getElementById('sectionGoofy');
      if (nextSection) {
        nextSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
});
