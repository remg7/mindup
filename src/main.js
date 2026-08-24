// MindUP Application Logic
import { fetchJournalEntries, saveJournalEntry, saveMoodLog, isSupabaseConfigured } from './lib/supabase.js';

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
  journalEntries: []
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

  // Cargar estado de ánimo guardado si existe
  const savedMood = localStorage.getItem('mindup_mood');
  if (savedMood && MOOD_DATA[savedMood]) {
    state.currentMood = savedMood;
    moodBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-mood') === savedMood));
    moodTitle.textContent = MOOD_DATA[savedMood].title;
    moodDesc.textContent = MOOD_DATA[savedMood].desc;
  }

  moodBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      moodBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const moodKey = btn.getAttribute('data-mood');
      state.currentMood = moodKey;
      localStorage.setItem('mindup_mood', moodKey);

      if (MOOD_DATA[moodKey]) {
        moodTitle.textContent = MOOD_DATA[moodKey].title;
        moodDesc.textContent = MOOD_DATA[moodKey].desc;
      }

      // Guardar en Supabase (si está configurado)
      await saveMoodLog(moodKey);
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
  const breathingBtn = document.getElementById('breathing-btn');
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

  breathingBtn.addEventListener('click', () => {
    if (!state.breathing.active) {
      state.breathing.active = true;
      breathingBtn.className = "btn-secondary";
      breathingBtn.textContent = "Detener Ejercicio";
      runBreathingCycle();
    } else {
      state.breathing.active = false;
      breathingBtn.className = "btn-primary";
      breathingBtn.textContent = "Iniciar Ejercicio";
      clearTimeout(state.breathing.timeoutId);
      breathCircle.className = "breath-circle";
      breathText.textContent = "Presiona Iniciar";
    }
  });
}

// -------------------------------------------------------------
// Daily Mindful Journal
// -------------------------------------------------------------
async function initJournal() {
  const form = document.getElementById('journal-form');
  const titleInput = document.getElementById('journal-title');
  const contentInput = document.getElementById('journal-content');
  const entriesList = document.getElementById('journal-entries-list');

  function renderEntries() {
    entriesList.innerHTML = '';
    if (state.journalEntries.length === 0) {
      entriesList.innerHTML = '<div class="empty-state" style="text-align: center; padding: 1.5rem 1rem; color: var(--text-muted); font-size: 0.9rem; font-style: italic;">No hay entradas aún. Escribe tu primera reflexión arriba para comenzar.</div>';
      return;
    }
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

  // Cargar desde Supabase o localStorage al iniciar
  if (isSupabaseConfigured()) {
    const remoteEntries = await fetchJournalEntries();
    if (remoteEntries && remoteEntries.length > 0) {
      state.journalEntries = remoteEntries;
    }
  } else {
    const localSaved = localStorage.getItem('mindup_journal_entries');
    if (localSaved) {
      try {
        state.journalEntries = JSON.parse(localSaved);
      } catch (e) {
        console.warn('Error parsing local journal entries:', e);
      }
    }
  }

  renderEntries();

  form.addEventListener('submit', async (e) => {
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

      // Guardar localmente
      localStorage.setItem('mindup_journal_entries', JSON.stringify(state.journalEntries));

      // Guardar en Supabase
      await saveJournalEntry({ title, content });
    }
  });
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
