// MindUP Application Logic

// -------------------------------------------------------------
// Mood Config & Descriptions
// -------------------------------------------------------------
const MOOD_DATA = {
  increible: {
    title: "Estado: Increíble",
    desc: "¡Excelente energía! Aprovecha este momento de alta motivación para atacar desafíos complejos y tomar decisiones estratégicas."
  },
  tranquilo: {
    title: "Estado: Tranquilo",
    desc: "Ideal para avanzar en tareas que requieren análisis profundo, diseño reflexivo y trabajo creativo sostenido."
  },
  enfocado: {
    title: "Estado: Enfocado",
    desc: "Tu nivel de atención está al máximo. Activa el temporizador Pomodoro y elimina notificaciones para mantener la zona de flujo."
  },
  estresado: {
    title: "Estado: Estresado",
    desc: "Tómate 2 minutos para realizar la sesión de Respiración Guiada (4-7-8). Reorganiza tus prioridades antes de continuar."
  },
  agotado: {
    title: "Estado: Agotado",
    desc: "Es momento de recargar. Realiza una pausa corta, camina 5 minutos y bebe agua. La salud cognitiva es tu prioridad."
  }
};

// -------------------------------------------------------------
// App State
// -------------------------------------------------------------
let state = {
  currentTab: 'dashboard',
  currentMood: 'tranquilo',
  timer: {
    minutes: 25,
    seconds: 0,
    totalSeconds: 25 * 60,
    remainingSeconds: 25 * 60,
    intervalId: null,
    isRunning: false,
    label: "Sesión de Trabajo"
  },
  breathing: {
    active: false,
    phase: 'idle', // 'inhale', 'hold', 'exhale'
    timeoutId: null
  },
  soundscapes: {
    rain: false,
    waves: false,
    forest: false
  },
  journalEntries: [
    {
      id: 1,
      title: "Inicio del Proyecto MindUP",
      content: "Repositorio en Git listo con su initial commit. La arquitectura base y el sistema de diseño están completamente configurados.",
      time: "Hoy, hace 10 min"
    }
  ]
};

// -------------------------------------------------------------
// Web Audio Synth for Ambient Sounds
// -------------------------------------------------------------
class AmbientSynth {
  constructor() {
    this.ctx = null;
    this.nodes = {};
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  toggleSound(soundName) {
    this.init();
    if (this.nodes[soundName]) {
      // Stop sound
      this.nodes[soundName].stop();
      delete this.nodes[soundName];
      return false;
    } else {
      // Start sound
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      const gainNode = this.ctx.createGain();

      if (soundName === 'rain') {
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, this.ctx.currentTime);
        gainNode.gain.setValueAtTime(0.08, this.ctx.currentTime);
      } else if (soundName === 'waves') {
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(400, this.ctx.currentTime);
        gainNode.gain.setValueAtTime(0.06, this.ctx.currentTime);
      } else { // forest / gentle breeze
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, this.ctx.currentTime);
        gainNode.gain.setValueAtTime(0.04, this.ctx.currentTime);
      }

      whiteNoise.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      whiteNoise.start();
      this.nodes[soundName] = whiteNoise;
      return true;
    }
  }
}

const synth = new AmbientSynth();

// -------------------------------------------------------------
// DOM Initialization & Event Listeners
// -------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initMoodSelector();
  initSoundscapes();
  initPomodoroTimer();
  initBreathing();
  initJournal();
  initTeamModal();
});

// -------------------------------------------------------------
// Tab Navigation
// -------------------------------------------------------------
function initTabs() {
  const navBtns = document.querySelectorAll('.nav-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      navBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(tc => tc.classList.remove('active'));

      btn.classList.add('active');
      const targetEl = document.getElementById(`tab-${targetTab}`);
      if (targetEl) targetEl.classList.add('active');
    });
  });
}

// -------------------------------------------------------------
// Mood Selector
// -------------------------------------------------------------
function initMoodSelector() {
  const moodBtns = document.querySelectorAll('.mood-btn');
  const moodTitle = document.getElementById('mood-title');
  const moodDesc = document.getElementById('mood-desc');

  moodBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      moodBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const moodKey = btn.getAttribute('data-mood');
      state.currentMood = moodKey;

      if (MOOD_DATA[moodKey]) {
        moodTitle.textContent = MOOD_DATA[moodKey].title;
        moodDesc.textContent = MOOD_DATA[moodKey].desc;
      }
    });
  });
}

// -------------------------------------------------------------
// Ambient Soundscapes
// -------------------------------------------------------------
function initSoundscapes() {
  const soundItems = document.querySelectorAll('.sound-item');

  soundItems.forEach(item => {
    const playBtn = item.querySelector('.play-btn');
    const soundKey = item.getAttribute('data-sound');

    playBtn.addEventListener('click', () => {
      const isPlaying = synth.toggleSound(soundKey);
      if (isPlaying) {
        playBtn.classList.add('playing');
        playBtn.textContent = '⏸';
      } else {
        playBtn.classList.remove('playing');
        playBtn.textContent = '▶';
      }
    });
  });
}

// -------------------------------------------------------------
// Pomodoro Focus Timer
// -------------------------------------------------------------
function initPomodoroTimer() {
  const startBtn = document.getElementById('timer-start');
  const pauseBtn = document.getElementById('timer-pause');
  const resetBtn = document.getElementById('timer-reset');
  const modeBtns = document.querySelectorAll('.mode-btn');
  const timerText = document.getElementById('timer-text');
  const timerStatus = document.getElementById('timer-status');
  const progressCircle = document.getElementById('timer-progress');

  const circleLength = 2 * Math.PI * 110; // r=110 -> 691.15

  function updateDisplay() {
    const mins = Math.floor(state.timer.remainingSeconds / 60);
    const secs = state.timer.remainingSeconds % 60;
    timerText.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    // Update circular progress
    const progressRatio = state.timer.remainingSeconds / state.timer.totalSeconds;
    const dashOffset = circleLength * (1 - progressRatio);
    progressCircle.style.strokeDashoffset = dashOffset;
  }

  function startTimer() {
    if (state.timer.isRunning) return;

    state.timer.isRunning = true;
    startBtn.disabled = true;
    pauseBtn.disabled = false;

    state.timer.intervalId = setInterval(() => {
      if (state.timer.remainingSeconds > 0) {
        state.timer.remainingSeconds--;
        updateDisplay();
      } else {
        clearInterval(state.timer.intervalId);
        state.timer.isRunning = false;
        alert(`¡Tiempo completado! (${state.timer.label})`);
        resetTimer();
      }
    }, 1000);
  }

  function pauseTimer() {
    if (!state.timer.isRunning) return;

    clearInterval(state.timer.intervalId);
    state.timer.isRunning = false;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
  }

  function resetTimer() {
    pauseTimer();
    state.timer.remainingSeconds = state.timer.totalSeconds;
    updateDisplay();
  }

  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const minutes = parseInt(btn.getAttribute('data-minutes'), 10);
      const label = btn.getAttribute('data-label');

      state.timer.minutes = minutes;
      state.timer.totalSeconds = minutes * 60;
      state.timer.remainingSeconds = minutes * 60;
      state.timer.label = label;

      timerStatus.textContent = label;
      resetTimer();
    });
  });

  startBtn.addEventListener('click', startTimer);
  pauseBtn.addEventListener('click', pauseTimer);
  resetBtn.addEventListener('click', resetTimer);

  updateDisplay();
}

// -------------------------------------------------------------
// Guided Breathing (4-7-8)
// -------------------------------------------------------------
function initBreathing() {
  const startBtn = document.getElementById('start-breathing');
  const stopBtn = document.getElementById('stop-breathing');
  const breathCircle = document.getElementById('breath-circle');
  const breathText = breathCircle.querySelector('span');

  function runBreathingCycle() {
    if (!state.breathing.active) return;

    // Phase 1: Inhale (4s)
    breathText.textContent = "Inhala...";
    breathCircle.className = "breath-circle inhale";

    state.breathing.timeoutId = setTimeout(() => {
      if (!state.breathing.active) return;

      // Phase 2: Hold (7s)
      breathText.textContent = "Manten...";
      breathCircle.className = "breath-circle hold";

      state.breathing.timeoutId = setTimeout(() => {
        if (!state.breathing.active) return;

        // Phase 3: Exhale (8s)
        breathText.textContent = "Exhala...";
        breathCircle.className = "breath-circle exhale";

        state.breathing.timeoutId = setTimeout(() => {
          if (state.breathing.active) {
            runBreathingCycle(); // Loop
          }
        }, 8000);

      }, 7000);

    }, 4000);
  }

  startBtn.addEventListener('click', () => {
    state.breathing.active = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    runBreathingCycle();
  });

  stopBtn.addEventListener('click', () => {
    state.breathing.active = false;
    clearTimeout(state.breathing.timeoutId);
    startBtn.disabled = false;
    stopBtn.disabled = true;
    breathCircle.className = "breath-circle";
    breathText.textContent = "Presiona Iniciar";
  });
}

// -------------------------------------------------------------
// Daily Mindful Journal
// -------------------------------------------------------------
function initJournal() {
  const form = document.getElementById('journal-form');
  const titleInput = document.getElementById('journal-title');
  const contentInput = document.getElementById('journal-content');
  const entriesList = document.getElementById('journal-entries-list');

  function renderEntries() {
    entriesList.innerHTML = '';
    state.journalEntries.forEach(entry => {
      const item = document.createElement('div');
      item.className = 'journal-item';
      item.innerHTML = `
        <h4>${escapeHtml(entry.title)}</h4>
        <p>${escapeHtml(entry.content)}</p>
        <span class="time">${entry.time}</span>
      `;
      entriesList.appendChild(item);
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();

    if (title && content) {
      const newEntry = {
        id: Date.now(),
        title,
        content,
        time: "Hace un momento"
      };

      state.journalEntries.unshift(newEntry);
      renderEntries();
      form.reset();
    }
  });

  renderEntries();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// -------------------------------------------------------------
// Team Readiness Modal
// -------------------------------------------------------------
function initTeamModal() {
  const modalBtn = document.getElementById('team-checklist-btn');
  const modalBackdrop = document.getElementById('team-modal');
  const closeBtn = document.getElementById('close-modal-btn');
  const closeFooterBtn = document.getElementById('close-modal-footer-btn');

  function openModal() {
    modalBackdrop.classList.remove('hidden');
  }

  function closeModal() {
    modalBackdrop.classList.add('hidden');
  }

  modalBtn.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);
  closeFooterBtn.addEventListener('click', closeModal);

  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) closeModal();
  });
}
