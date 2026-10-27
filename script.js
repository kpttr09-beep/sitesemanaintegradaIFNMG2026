// Configurações do Áudio
const totalSeconds = 448; // 7 minutos e 28 segundos
const audioElement = document.getElementById('audio-element');
let previousVolume = 85;

// Formata segundos em MM:SS
function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
}

// Inicia / Pausa a reprodução do áudio real
function toggleMainPlay() {
  if (!audioElement) return;

  if (audioElement.paused) {
    audioElement.play().catch((err) => {
      console.warn("Erro ao iniciar reprodução:", err);
    });
  } else {
    audioElement.pause();
  }
}

// Atualiza botões e interface quando o áudio toca ou pausa
if (audioElement) {
  audioElement.addEventListener('play', () => {
    const playIcon = document.getElementById('main-play-icon');
    const playLabel = document.getElementById('main-play-label');
    if (playIcon) playIcon.textContent = 'pause';
    if (playLabel) playLabel.textContent = 'Pausar Gravação';
  });

  audioElement.addEventListener('pause', () => {
    const playIcon = document.getElementById('main-play-icon');
    const playLabel = document.getElementById('main-play-label');
    if (playIcon) playIcon.textContent = 'play_arrow';
    if (playLabel) playLabel.textContent = 'Reproduzir Gravação';
  });

  // Atualiza a interface em tempo real enquanto o áudio roda
  audioElement.addEventListener('timeupdate', () => {
    updatePlayerUI(audioElement.currentTime);
  });

  // Reseta ao finalizar o áudio
  audioElement.addEventListener('ended', () => {
    audioElement.currentTime = 0;
    updatePlayerUI(0);
  });
}

// Avança ou retrocede N segundos
function skipAudio(amount) {
  if (!audioElement) return;
  const duration = (audioElement.duration && !isNaN(audioElement.duration)) ? audioElement.duration : totalSeconds;
  const targetTime = Math.max(0, Math.min(duration, audioElement.currentTime + amount));
  audioElement.currentTime = targetTime;
  updatePlayerUI(targetTime);
}

// Salta direto para o trecho indicado pelo timecode (ex: "01:30")
function playSnippet(timecode) {
  if (!audioElement) return;
  const parts = timecode.split(':');
  const targetSeconds = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);

  audioElement.currentTime = targetSeconds;
  if (audioElement.paused) {
    audioElement.play().catch(() => {});
  }
  updatePlayerUI(targetSeconds);

  const playerEl = document.getElementById('entrevista');
  if (playerEl) {
    playerEl.scrollIntoView({ behavior: 'smooth' });
  }
}

// Navega no áudio ao clicar na barra de progresso ou na forma de onda
function seekAudio(event) {
  if (!audioElement) return;
  const container = event.currentTarget;
  const rect = container.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const percentage = Math.max(0, Math.min(1, clickX / rect.width));

  const duration = (audioElement.duration && !isNaN(audioElement.duration)) ? audioElement.duration : totalSeconds;
  const targetSeconds = percentage * duration;

  audioElement.currentTime = targetSeconds;
  updatePlayerUI(targetSeconds);
}

// Atualiza mostradores de tempo, preenchimento da barra e barras da onda
function updatePlayerUI(currentSecs) {
  const currentTime = currentSecs !== undefined ? currentSecs : (audioElement ? audioElement.currentTime : 0);
  const currentTimeDisplay = document.getElementById('current-time-display');
  const fillBar = document.getElementById('playback-fill');

  if (currentTimeDisplay) {
    currentTimeDisplay.textContent = formatTime(currentTime);
  }

  const duration = (audioElement && audioElement.duration && !isNaN(audioElement.duration)) ? audioElement.duration : totalSeconds;
  const pct = Math.min(100, (currentTime / duration) * 100);

  if (fillBar) {
    fillBar.style.width = pct + '%';
  }

  // Atualiza cores das barras da onda sonora conforme o progresso
  const bars = document.querySelectorAll('#waveform-bars .waveform-bar');
  const totalBars = bars.length;
  const activeBarsCount = Math.floor((currentTime / duration) * totalBars);

  bars.forEach((bar, index) => {
    if (index <= activeBarsCount && currentTime > 0) {
      bar.classList.add('active');
    } else {
      bar.classList.remove('active');
    }
  });
}

// Controle de volume e ícones
function changeVolume(val) {
  const volumeDisplay = document.getElementById('volume-display');
  const volumeIcon = document.getElementById('volume-icon');
  const slider = document.getElementById('volume-slider');

  const numericVal = parseInt(val, 10);
  if (volumeDisplay) volumeDisplay.textContent = numericVal + '%';
  if (slider) slider.value = numericVal;

  if (audioElement) {
    audioElement.volume = numericVal / 100;
  }

  if (volumeIcon) {
    if (numericVal === 0) {
      volumeIcon.textContent = 'volume_off';
    } else if (numericVal < 50) {
      volumeIcon.textContent = 'volume_down';
    } else {
      volumeIcon.textContent = 'volume_up';
    }
  }
}

// Alterna mudo/som
function toggleMute() {
  const slider = document.getElementById('volume-slider');
  if (!slider) return;
  const currentVal = parseInt(slider.value, 10);

  if (currentVal > 0) {
    previousVolume = currentVal;
    changeVolume(0);
  } else {
    changeVolume(previousVolume || 85);
  }
}

// Abre/fecha transcrição do bloco
function toggleTranscript(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.toggle('hidden');
  }
}

// Destaca a aba ativa no cabeçalho conforme o scroll
const sections = document.querySelectorAll('section[id]');
const navTabs = document.querySelectorAll('#desktop-navbar a');

function setActiveTab(targetId) {
  navTabs.forEach((tab) => {
    const href = tab.getAttribute('href').replace('#', '');
    if (href === targetId) {
      tab.classList.add('active');
      tab.setAttribute('aria-current', 'page');
    } else {
      tab.classList.remove('active');
      tab.removeAttribute('aria-current');
    }
  });
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', function () {
    const targetId = this.getAttribute('href').replace('#', '');
    if (targetId) setActiveTab(targetId);
  });
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        setActiveTab(entry.target.id);
      }
    });
  },
  {
    root: null,
    rootMargin: '-25% 0px -65% 0px',
    threshold: 0,
  }
);

sections.forEach((sec) => observer.observe(sec));

// Funções globais no escopo de window
window.toggleMainPlay = toggleMainPlay;
window.skipAudio = skipAudio;
window.playSnippet = playSnippet;
window.seekAudio = seekAudio;
window.changeVolume = changeVolume;
window.toggleMute = toggleMute;
window.toggleTranscript = toggleTranscript;

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  if (audioElement) {
    audioElement.volume = 0.85;
  }
  updatePlayerUI(0);
});