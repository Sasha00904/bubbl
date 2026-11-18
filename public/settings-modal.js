(function initSettingsModalDOM() {
  const modal = document.createElement('div');
  modal.className = 'settings-overlay';
  modal.id = 'appSettingsModal';
  modal.innerHTML = `
    <div class="settings-card">
      <div class="settings-header">
        <span>Настройки</span>
        <button class="tg-icon-btn" id="closeSettingsBtn" title="Закрыть">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      <div class="settings-body">
        <div class="settings-section-label">Оформление</div>
        <div class="tg-ios-group">
          <div class="settings-row">
            <div class="settings-row-left">
              <div class="settings-icon-badge">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"></circle><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"></circle><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"></circle><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"></circle><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path></svg>
              </div>
              <span class="settings-row-title">Тема</span>
            </div>
            <div class="theme-dots-row" id="settingsThemeDots"></div>
          </div>

          <div class="settings-row">
            <div class="settings-row-left">
              <div class="settings-icon-badge">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>
              </div>
              <span class="settings-row-title">Шрифт</span>
            </div>
            <div class="font-size-pills" id="settingsFontPills">
              <button type="button" class="font-size-btn" data-size="small">Мелкий</button>
              <button type="button" class="font-size-btn" data-size="medium">Обычный</button>
              <button type="button" class="font-size-btn" data-size="large">Крупный</button>
            </div>
          </div>
        </div>

        <div class="settings-section-label">Чаты и звук</div>
        <div class="tg-ios-group">
          <div class="settings-row">
            <div class="settings-row-left">
              <div class="settings-icon-badge">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
              </div>
              <span class="settings-row-title">Звук сообщений</span>
            </div>
            <label class="ios-switch">
              <input type="checkbox" id="settingSoundToggle">
              <span class="ios-slider"></span>
            </label>
          </div>

          <div class="settings-row">
            <div class="settings-row-left">
              <div class="settings-icon-badge">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 10 4 15 9 20"></polyline><path d="M20 4v7a4 4 0 0 1-4 4H4"></path></svg>
              </div>
              <span class="settings-row-title">Отправка по Enter</span>
            </div>
            <label class="ios-switch">
              <input type="checkbox" id="settingEnterToggle">
              <span class="ios-slider"></span>
            </label>
          </div>
        </div>

        <div class="settings-section-label">Безопасность</div>
        <div class="tg-ios-group">
          <div class="settings-row clickable" id="openBlacklistSubmodalBtn">
            <div class="settings-row-left">
              <div class="settings-icon-badge">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
              </div>
              <span class="settings-row-title">Чёрный список</span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px; color: #8e8e93; font-size: 13.5px;">
              <span id="settingsBlacklistCount">0</span>
              <span>›</span>
            </div>
          </div>

          <div class="settings-row clickable" id="openPasswordSubmodalBtn">
            <div class="settings-row-left">
              <div class="settings-icon-badge">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              </div>
              <span class="settings-row-title">Сменить пароль</span>
            </div>
            <span style="color: #8e8e93; font-size: 14px;">›</span>
          </div>
        </div>

        <button type="button" class="settings-logout-btn" id="settingsLogoutBtn">Выйти из аккаунта</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });
  document.getElementById('closeSettingsBtn').onclick = () => modal.classList.remove('active');
  document.getElementById('settingsLogoutBtn').onclick = () => {
    if (typeof logout === 'function') logout();
  };
})();

function openAppSettingsModal() {
  const modal = document.getElementById('appSettingsModal');
  if (!modal) return;
  const currentSettings = getAppSettings();

  const dotsContainer = document.getElementById('settingsThemeDots');
  dotsContainer.innerHTML = '';
  Object.entries(ACCENT_THEMES).forEach(([key, themeObj]) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = `theme-dot ${currentSettings.theme === key ? 'active' : ''}`;
    dot.style.background = themeObj.hex;
    dot.title = themeObj.name;
    dot.onclick = () => {
      saveAppSettings({ theme: key });
      dotsContainer.querySelectorAll('.theme-dot').forEach(d => d.classList.remove('active'));
      dot.classList.add('active');
    };
    dotsContainer.appendChild(dot);
  });

  const fontButtons = document.querySelectorAll('#settingsFontPills .font-size-btn');
  fontButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.size === currentSettings.fontSize);
    btn.onclick = () => {
      saveAppSettings({ fontSize: btn.dataset.size });
      fontButtons.forEach(b => b.classList.toggle('active', b === btn));
    };
  });

  const soundToggle = document.getElementById('settingSoundToggle');
  soundToggle.checked = Boolean(currentSettings.soundEnabled);
  soundToggle.onchange = () => {
    saveAppSettings({ soundEnabled: soundToggle.checked });
    if (soundToggle.checked) playIncomingNotificationSound();
  };

  const enterToggle = document.getElementById('settingEnterToggle');
  enterToggle.checked = Boolean(currentSettings.sendOnEnter);
  enterToggle.onchange = () => {
    saveAppSettings({ sendOnEnter: enterToggle.checked });
  };

  const blCountEl = document.getElementById('settingsBlacklistCount');
  if (blCountEl && typeof myBlockedUserIds !== 'undefined') {
    blCountEl.textContent = myBlockedUserIds.size;
  }

  document.getElementById('openBlacklistSubmodalBtn').onclick = () => {
    if (typeof openBlacklistModal === 'function') openBlacklistModal();
    else if (typeof openBlacklistSubmodal === 'function') openBlacklistSubmodal();
  };

  document.getElementById('openPasswordSubmodalBtn').onclick = () => {
    if (typeof openChangePasswordModal === 'function') openChangePasswordModal();
    else if (typeof openPasswordModal === 'function') openPasswordModal();
    else if (typeof openChangePasswordSubmodal === 'function') openChangePasswordSubmodal();
  };

  modal.classList.add('active');
}

function openSettingsModal() {
  openAppSettingsModal();
}
