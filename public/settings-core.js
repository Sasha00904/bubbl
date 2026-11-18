const ACCENT_THEMES = {
  green: { name: 'Зелёный', hex: '#65C466', hover: '#58b559', darkText: '#ffffff' },
  blue: { name: 'Синий', hex: '#64A2D8', hover: '#528EC4', darkText: '#ffffff' },
  purple: { name: 'Фиолетовый', hex: '#8E7CE8', hover: '#7966D6', darkText: '#ffffff' },
  pink: { name: 'Розовый', hex: '#D86C8B', hover: '#C25877', darkText: '#ffffff' }
};

function getAppSettings() {
  const defaultSettings = {
    theme: 'green',
    fontSize: 'medium',
    soundEnabled: true,
    sendOnEnter: true,
    privacyLastSeen: 'everyone',
    privacyAvatar: 'everyone'
  };
  try {
    const saved = JSON.parse(localStorage.getItem('bubbl_app_settings'));
    return { ...defaultSettings, ...(saved || {}) };
  } catch (e) {
    return defaultSettings;
  }
}

function saveAppSettings(newPartial) {
  const updated = { ...getAppSettings(), ...newPartial };
  localStorage.setItem('bubbl_app_settings', JSON.stringify(updated));
  applyAppSettings(updated);
  return updated;
}

function applyAppSettings(settings = getAppSettings()) {
  const themeObj = ACCENT_THEMES[settings.theme] || ACCENT_THEMES.green;
  const root = document.documentElement;
  root.style.setProperty('--accent', themeObj.hex);
  root.style.setProperty('--accent-hover', themeObj.hover);
  root.style.setProperty('--accent-dark-text', themeObj.darkText);

  document.body.classList.remove('font-small', 'font-medium', 'font-large');
  document.body.classList.add(`font-${settings.fontSize || 'medium'}`);
}

function playIncomingNotificationSound() {
  const settings = getAppSettings();
  if (!settings.soundEnabled) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.09);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.17);
  } catch (e) {}
}

applyAppSettings();
