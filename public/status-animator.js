(function initStatusAnimatorStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .live-status-wrap {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12.5px;
      font-weight: 500;
      color: var(--accent, #65C466);
      margin-top: 2px;
      animation: statusFadeIn 0.2s ease-out;
    }
    @keyframes statusFadeIn {
      from { opacity: 0; transform: translateY(2px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Анимация 3 точек ("печатает...") */
    .typing-dots-anim {
      display: inline-flex;
      align-items: center;
      gap: 2.5px;
      height: 12px;
    }
    .typing-dots-anim span {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: var(--accent, #65C466);
      animation: typingBounce 1.2s infinite ease-in-out;
    }
    .typing-dots-anim span:nth-child(2) { animation-delay: 0.16s; }
    .typing-dots-anim span:nth-child(3) { animation-delay: 0.32s; }

    @keyframes typingBounce {
      0%, 60%, 100% { transform: translateY(0); opacity: 0.45; }
      30% { transform: translateY(-3.5px); opacity: 1; }
    }

    /* Анимация звуковой волны ("записывает голосовое...") */
    .voice-rec-anim {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      height: 13px;
    }
    .voice-rec-anim span {
      width: 2.5px;
      height: 4px;
      border-radius: 2px;
      background: var(--accent, #65C466);
      animation: voiceWavePulse 0.85s infinite ease-in-out;
    }
    .voice-rec-anim span:nth-child(1) { animation-delay: 0.0s; }
    .voice-rec-anim span:nth-child(2) { animation-delay: 0.15s; }
    .voice-rec-anim span:nth-child(3) { animation-delay: 0.3s; }
    .voice-rec-anim span:nth-child(4) { animation-delay: 0.12s; }

    @keyframes voiceWavePulse {
      0%, 100% { height: 4px; opacity: 0.55; }
      50% { height: 13px; opacity: 1; }
    }

    /* Анимация пульсации ("отправляет фото/видео...") */
    .media-send-anim {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--accent, #65C466);
      box-shadow: 0 0 0 0 var(--accent, #65C466);
      animation: mediaPulseRing 1.3s infinite ease-out;
    }
    @keyframes mediaPulseRing {
      0% { transform: scale(0.9); opacity: 1; }
      70% { transform: scale(1.25); opacity: 0.4; }
      100% { transform: scale(0.9); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
})();

function formatLastSeenText(online, lastSeenTimestamp) {
  if (online) return 'в сети';
  if (!lastSeenTimestamp) return 'был(а) недавно';

  const diffSec = Math.floor((Date.now() - lastSeenTimestamp) / 1000);
  if (diffSec < 60) return 'был(а) только что';

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `был(а) ${diffMin} мин. назад`;

  const date = new Date(lastSeenTimestamp);
  const now = new Date();
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const isToday = date.toDateString() === now.toDateString();
  if (isToday) return `был(а) сегодня в ${timeStr}`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `был(а) вчера в ${timeStr}`;
  }

  const dateStr = date.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
  return `был(а) ${dateStr} в ${timeStr}`;
}

function renderAnimatedStatusHtml(online, lastSeenTimestamp, liveActivity) {
  if (liveActivity === 'typing') {
    return `
      <div class="live-status-wrap">
        <div class="typing-dots-anim"><span></span><span></span><span></span></div>
        <span>печатает</span>
      </div>
    `;
  }

  if (liveActivity === 'recording') {
    return `
      <div class="live-status-wrap">
        <div class="voice-rec-anim"><span></span><span></span><span></span><span></span></div>
        <span>записывает голосовое</span>
      </div>
    `;
  }

  if (liveActivity === 'sending_media') {
    return `
      <div class="live-status-wrap">
        <span class="media-send-anim"></span>
        <span>отправляет медиа</span>
      </div>
    `;
  }

  const text = formatLastSeenText(online, lastSeenTimestamp);
  const cls = online ? 'header-user-status active-status' : 'header-user-status';
  return `<span class="${cls}">${text}</span>`;
}
