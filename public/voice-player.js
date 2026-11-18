function extractWaveformFromUrl(mediaUrl) {
  const wfMatch = mediaUrl.match(/#wf=([0-9,]+)/);
  if (wfMatch && wfMatch.at(1)) {
    const parsed = wfMatch.at(1).split(',').map(n => Math.max(4, Math.min(24, Number(n) || 5)));
    if (parsed.length > 0) return parsed;
  }

  // Резервная генерация уникального рисунка для старых ГС без хэша #wf
  let hash = 2166136261;
  for (let i = 0; i < mediaUrl.length; i++) {
    hash ^= mediaUrl.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Array.from({ length: 34 }, () => {
    hash ^= hash << 13;
    hash ^= hash >>> 17;
    hash ^= hash << 5;
    const norm = ((hash >>> 0) % 100) / 100;
    return Math.round(4 + norm * 19);
  });
}

function createCustomVoicePlayer(mediaUrl, isOwn) {
  const cleanAudioSrc = mediaUrl.split('#').at(0);
  const barsHeights = extractWaveformFromUrl(mediaUrl);

  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.alignItems = 'center';
  container.style.gap = '10px';
  container.style.padding = '4px 2px';
  container.style.minWidth = '215px';

  const audio = new Audio(cleanAudioSrc);

  const playBtn = document.createElement('button');
  playBtn.type = 'button';
  playBtn.style.width = '36px';
  playBtn.style.height = '36px';
  playBtn.style.borderRadius = '50%';
  playBtn.style.border = 'none';
  playBtn.style.cursor = 'pointer';
  playBtn.style.display = 'flex';
  playBtn.style.alignItems = 'center';
  playBtn.style.justifyContent = 'center';
  playBtn.style.flexShrink = '0';
  playBtn.style.background = '#ffffff';
  playBtn.style.color = isOwn ? 'var(--accent, #65C466)' : '#1c1c1e';
  playBtn.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
  playBtn.style.transition = 'transform 0.12s';

  const playIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="margin-left:2px;"><polygon points="6 4 20 12 6 20 6 4"></polygon></svg>`;
  const pauseIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"></rect><rect x="14" y="4" width="4" height="16" rx="1"></rect></svg>`;
  playBtn.innerHTML = playIcon;

  const rightCol = document.createElement('div');
  rightCol.style.flex = '1';
  rightCol.style.display = 'flex';
  rightCol.style.flexDirection = 'column';
  rightCol.style.gap = '5px';

  const waveRow = document.createElement('div');
  waveRow.style.display = 'flex';
  waveRow.style.alignItems = 'center';
  waveRow.style.gap = '2.5px';
  waveRow.style.height = '24px';
  waveRow.style.cursor = 'pointer';

  const activeBarColor = isOwn ? '#ffffff' : 'var(--accent, #65C466)';
  const inactiveBarColor = isOwn ? 'rgba(255, 255, 255, 0.38)' : 'rgba(255, 255, 255, 0.22)';

  const barEls = barsHeights.map((h) => {
    const bar = document.createElement('span');
    bar.style.display = 'inline-block';
    bar.style.width = '2.5px';
    bar.style.height = `${h}px`;
    bar.style.borderRadius = '2px';
    bar.style.background = inactiveBarColor;
    bar.style.transition = 'background 0.1s';
    waveRow.appendChild(bar);
    return bar;
  });

  const metaRow = document.createElement('div');
  metaRow.style.display = 'flex';
  metaRow.style.alignItems = 'center';
  metaRow.style.gap = '6px';
  metaRow.style.fontSize = '11.5px';
  metaRow.style.opacity = '0.9';

  const durationLabel = document.createElement('span');
  durationLabel.textContent = '0:00';

  const unplayedDot = document.createElement('span');
  unplayedDot.style.width = '5px';
  unplayedDot.style.height = '5px';
  unplayedDot.style.borderRadius = '50%';
  unplayedDot.style.background = activeBarColor;

  metaRow.appendChild(durationLabel);
  metaRow.appendChild(unplayedDot);

  rightCol.appendChild(waveRow);
  rightCol.appendChild(metaRow);

  container.appendChild(playBtn);
  container.appendChild(rightCol);

  function formatSec(sec) {
    if (!Number.isFinite(sec) || sec < 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  audio.addEventListener('loadedmetadata', () => {
    if (Number.isFinite(audio.duration) && audio.duration !== Infinity) {
      durationLabel.textContent = formatSec(audio.duration);
    }
  });

  audio.addEventListener('timeupdate', () => {
    if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
    const progress = audio.currentTime / audio.duration;
    durationLabel.textContent = formatSec(audio.currentTime);
    const activeCount = Math.floor(progress * barEls.length);
    barEls.forEach((b, idx) => {
      b.style.background = idx <= activeCount ? activeBarColor : inactiveBarColor;
    });
  });

  audio.addEventListener('ended', () => {
    playBtn.innerHTML = playIcon;
    barEls.forEach(b => { b.style.background = inactiveBarColor; });
    if (Number.isFinite(audio.duration)) durationLabel.textContent = formatSec(audio.duration);
  });

  waveRow.onclick = (e) => {
    e.stopPropagation();
    if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
    const rect = waveRow.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * audio.duration;
  };

  playBtn.onclick = (e) => {
    e.stopPropagation();
    unplayedDot.style.display = 'none';
    if (audio.paused) {
      audio.play().catch(() => {});
      playBtn.innerHTML = pauseIcon;
    } else {
      audio.pause();
      playBtn.innerHTML = playIcon;
    }
  };

  return container;
}
