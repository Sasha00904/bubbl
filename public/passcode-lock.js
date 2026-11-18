(function initPasscodeLockScreen() {
  const lockOverlay = document.createElement('div');
  lockOverlay.id = 'bubblPasscodeLockScreen';
  lockOverlay.style.cssText = `
    display: none;
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(12, 13, 15, 0.96);
    backdrop-filter: blur(28px);
    -webkit-backdrop-filter: blur(28px);
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #ffffff;
  `;

  lockOverlay.innerHTML = `
    <div style="width: 52px; height: 52px; border-radius: 50%; background: rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: center; margin-bottom: 16px;">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent, #65C466)" stroke-width="2.2" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
    </div>
    <div style="font-size: 20px; font-weight: 700; margin-bottom: 6px;">Bubbl заблокирован</div>
    <div style="font-size: 13.5px; color: #8e8e93; margin-bottom: 22px;">Введите 4-значный код-пароль</div>
    <input type="password" id="unlockPasscodeInput" maxlength="4" inputmode="numeric" placeholder="••••"
      style="width: 150px; text-align: center; letter-spacing: 8px; font-size: 24px; padding: 12px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.12); background: #1c1c1e; color: #ffffff; outline: none;">
    <div id="unlockPasscodeError" style="color: #ff453a; font-size: 13px; min-height: 18px; margin-top: 10px;"></div>
  `;
  document.body.appendChild(lockOverlay);

  const inp = document.getElementById('unlockPasscodeInput');
  const err = document.getElementById('unlockPasscodeError');

  inp.addEventListener('input', () => {
    err.textContent = '';
    const savedPin = localStorage.getItem('bubbl_passcode_pin');
    if (inp.value.length === 4) {
      if (inp.value === savedPin) {
        inp.value = '';
        lockOverlay.style.display = 'none';
        sessionStorage.setItem('bubbl_unlocked_session', '1');
      } else {
        err.textContent = 'Неверный код-пароль';
        inp.value = '';
      }
    }
  });

  // Если код-пароль установлен, блокируем при открытии вкладки
  if (localStorage.getItem('bubbl_passcode_pin') && !sessionStorage.getItem('bubbl_unlocked_session')) {
    lockOverlay.style.display = 'flex';
    setTimeout(() => inp.focus(), 60);
  }
})();

function lockBubblNow() {
  if (!localStorage.getItem('bubbl_passcode_pin')) return;
  sessionStorage.removeItem('bubbl_unlocked_session');
  const screen = document.getElementById('bubblPasscodeLockScreen');
  const inp = document.getElementById('unlockPasscodeInput');
  if (screen) {
    screen.style.display = 'flex';
    if (inp) {
      inp.value = '';
      setTimeout(() => inp.focus(), 50);
    }
  }
}

function openPasscodeSetupModal() {
  let modal = document.getElementById('passcodeSetupModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'settings-overlay';
    modal.id = 'passcodeSetupModal';
    modal.style.zIndex = '1460';
    modal.innerHTML = `
      <div class="settings-card" style="width: 350px;">
        <div class="settings-header">
          <button type="button" class="ios-nav-btn primary" id="backFromPinBtn" style="font-size: 15px; padding: 0; width: 92px; justify-content: flex-start;">
            <span>‹ Настройки</span>
          </button>
          <span style="font-size: 16px;">Код-пароль</span>
          <span style="width: 92px; display: inline-block;"></span>
        </div>
        <div class="settings-body" style="padding-top: 10px;">
          <div style="font-size: 13px; color: #8e8e93; margin-bottom: 12px; line-height: 1.4;">
            Установите 4-значный PIN-код для защиты входа в мессенджер на этом устройстве.
          </div>
          <div class="tg-ios-group" style="margin-bottom: 14px;">
            <div class="tg-info-row">
              <div class="tg-info-label">Новый код-пароль (4 цифры)</div>
              <input type="password" maxlength="4" inputmode="numeric" class="tg-edit-input" id="newPinCodeInput" placeholder="••••" style="letter-spacing: 6px; font-size: 18px;">
            </div>
          </div>
          <div id="pinSetupMsg" style="font-size: 13px; text-align: center; min-height: 18px; margin-bottom: 10px;"></div>
          <button type="button" class="tg-save-btn" id="savePinCodeBtn">Включить код-пароль</button>
          <button type="button" class="settings-logout-btn" id="disablePinCodeBtn" style="margin-top: 8px; display: none;">Отключить код-пароль</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
    document.getElementById('backFromPinBtn').onclick = () => modal.classList.remove('active');
  }

  const hasPin = Boolean(localStorage.getItem('bubbl_passcode_pin'));
  const disableBtn = document.getElementById('disablePinCodeBtn');
  const pinInput = document.getElementById('newPinCodeInput');
  const msgEl = document.getElementById('pinSetupMsg');

  pinInput.value = '';
  msgEl.textContent = '';
  disableBtn.style.display = hasPin ? 'block' : 'none';

  document.getElementById('savePinCodeBtn').onclick = () => {
    const val = pinInput.value.trim();
    if (!/^\d{4}$/.test(val)) {
      msgEl.style.color = '#ff453a';
      msgEl.textContent = 'Введите ровно 4 цифры';
      return;
    }
    localStorage.setItem('bubbl_passcode_pin', val);
    sessionStorage.setItem('bubbl_unlocked_session', '1');
    msgEl.style.color = 'var(--accent, #65C466)';
    msgEl.textContent = 'Код-пароль установлен';
    const statusLbl = document.getElementById('settingsPasscodeStatus');
    if (statusLbl) statusLbl.textContent = 'Вкл';
    setTimeout(() => modal.classList.remove('active'), 800);
  };

  disableBtn.onclick = () => {
    localStorage.removeItem('bubbl_passcode_pin');
    const statusLbl = document.getElementById('settingsPasscodeStatus');
    if (statusLbl) statusLbl.textContent = 'Выкл';
    modal.classList.remove('active');
  };

  modal.classList.add('active');
  setTimeout(() => pinInput.focus(), 60);
}
