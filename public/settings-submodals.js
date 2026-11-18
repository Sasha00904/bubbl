(function initSettingsSubmodalsDOM() {
  // 1. Окно "Чёрный список"
  if (!document.getElementById('blacklistSubmodal')) {
    const blModal = document.createElement('div');
    blModal.className = 'settings-overlay';
    blModal.id = 'blacklistSubmodal';
    blModal.style.zIndex = '1450';
    blModal.innerHTML = `
      <div class="settings-card" style="width: 360px;">
        <div class="settings-header">
          <button type="button" class="ios-nav-btn primary" id="backFromBlacklistBtn" style="font-size: 15px; padding: 0; width: 92px; justify-content: flex-start;">
            <span>‹ Настройки</span>
          </button>
          <span style="font-size: 16px;">Чёрный список</span>
          <span style="width: 92px; display: inline-block;"></span>
        </div>
        <div class="settings-body" style="padding-top: 8px;">
          <div class="tg-ios-group" id="blacklistUsersContainer"></div>
        </div>
      </div>
    `;
    document.body.appendChild(blModal);

    blModal.addEventListener('click', (e) => {
      if (e.target === blModal) blModal.classList.remove('active');
    });
    document.getElementById('backFromBlacklistBtn').onclick = () => {
      blModal.classList.remove('active');
    };
  }

  // 2. Окно "Сменить пароль"
  if (!document.getElementById('changePasswordSubmodal')) {
    const pwModal = document.createElement('div');
    pwModal.className = 'settings-overlay';
    pwModal.id = 'changePasswordSubmodal';
    pwModal.style.zIndex = '1450';
    pwModal.innerHTML = `
      <div class="settings-card" style="width: 360px;">
        <div class="settings-header">
          <button type="button" class="ios-nav-btn primary" id="backFromPasswordBtn" style="font-size: 15px; padding: 0; width: 92px; justify-content: flex-start;">
            <span>‹ Настройки</span>
          </button>
          <span style="font-size: 16px;">Смена пароля</span>
          <span style="width: 92px; display: inline-block;"></span>
        </div>
        <div class="settings-body" style="padding-top: 10px;">
          <div class="tg-ios-group" style="margin-bottom: 14px;">
            <div class="tg-info-row">
              <div class="tg-info-label">Текущий пароль</div>
              <input type="password" class="tg-edit-input" id="oldPasswordInput" placeholder="••••••••">
            </div>
            <div class="tg-info-row">
              <div class="tg-info-label">Новый пароль</div>
              <input type="password" class="tg-edit-input" id="newPasswordInput" placeholder="••••••••">
            </div>
            <div class="tg-info-row">
              <div class="tg-info-label">Повторите новый пароль</div>
              <input type="password" class="tg-edit-input" id="confirmNewPasswordInput" placeholder="••••••••">
            </div>
          </div>

          <div id="changePasswordStatusMsg" style="font-size: 13px; text-align: center; min-height: 18px; margin-bottom: 10px;"></div>
          <button type="button" class="tg-save-btn" id="submitChangePasswordBtn">Сохранить пароль</button>
        </div>
      </div>
    `;
    document.body.appendChild(pwModal);

    pwModal.addEventListener('click', (e) => {
      if (e.target === pwModal) pwModal.classList.remove('active');
    });
    document.getElementById('backFromPasswordBtn').onclick = () => {
      pwModal.classList.remove('active');
    };
  }
})();

async function openBlacklistSubmodal() {
  const modal = document.getElementById('blacklistSubmodal');
  const container = document.getElementById('blacklistUsersContainer');
  if (!modal || !container) return;

  container.innerHTML = `<div style="padding: 16px; text-align: center; font-size: 13.5px; color: #8e8e93;">Загрузка...</div>`;
  modal.classList.add('active');

  try {
    const res = await fetch(`/api/blacklist/${currentUser.id}`);
    const list = await res.json();

    container.innerHTML = '';
    if (!Array.isArray(list) || list.length === 0) {
      container.innerHTML = `<div style="padding: 18px; text-align: center; font-size: 13.5px; color: #8e8e93;">Чёрный список пуст</div>`;
      return;
    }

    list.forEach(u => {
      const avHtml = u.avatarUrl ? `<img src="${u.avatarUrl}">` : u.firstName.at(0).toUpperCase();
      const row = document.createElement('div');
      row.className = 'settings-row';
      row.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px; overflow: hidden;">
          <div class="avatar" style="width: 34px; height: 34px; font-size: 13px;">${avHtml}</div>
          <div style="overflow: hidden;">
            <div style="font-size: 14px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${u.firstName} ${u.lastName || ''}</div>
            <div style="font-size: 12px; color: #8e8e93;">${u.username}</div>
          </div>
        </div>
        <button type="button" class="ios-nav-btn primary unblock-row-btn" style="font-size: 13px;">Разблокировать</button>
      `;

      row.querySelector('.unblock-row-btn').onclick = async () => {
        if (typeof toggleBlockUser === 'function') {
          await toggleBlockUser(currentUser.id, u.id, false);
        } else {
          await fetch('/api/blacklist/remove', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ownerId: currentUser.id, targetId: u.id })
          });
        }
        socket.emit('blacklist_changed', { ownerId: currentUser.id, targetId: u.id });
        const countEl = document.getElementById('settingsBlacklistCount');
        if (countEl && typeof myBlockedUserIds !== 'undefined') {
          myBlockedUserIds.delete(u.id);
          countEl.textContent = myBlockedUserIds.size;
        }
        openBlacklistSubmodal();
      };

      container.appendChild(row);
    });
  } catch (err) {
    container.innerHTML = `<div style="padding: 16px; text-align: center; font-size: 13.5px; color: #ff453a;">Не удалось загрузить список</div>`;
  }
}

function openChangePasswordSubmodal() {
  const modal = document.getElementById('changePasswordSubmodal');
  if (!modal) return;

  const oldInp = document.getElementById('oldPasswordInput');
  const newInp = document.getElementById('newPasswordInput');
  const confInp = document.getElementById('confirmNewPasswordInput');
  const msgEl = document.getElementById('changePasswordStatusMsg');
  const submitBtn = document.getElementById('submitChangePasswordBtn');

  oldInp.value = '';
  newInp.value = '';
  confInp.value = '';
  msgEl.textContent = '';
  msgEl.style.color = '#ff453a';

  submitBtn.onclick = async () => {
    const oldPassword = oldInp.value;
    const newPassword = newInp.value;
    const confirmPassword = confInp.value;

    if (!oldPassword || !newPassword) {
      msgEl.textContent = 'Заполните все поля';
      return;
    }
    if (newPassword.length < 4) {
      msgEl.textContent = 'Новый пароль должен быть не короче 4 символов';
      return;
    }
    if (newPassword !== confirmPassword) {
      msgEl.textContent = 'Новые пароли не совпадают';
      return;
    }

    submitBtn.disabled = true;
    try {
      const res = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          oldPassword,
          newPassword
        })
      });
      const data = await res.json();

      if (!res.ok) {
        msgEl.style.color = '#ff453a';
        msgEl.textContent = data.error || 'Неверный текущий пароль';
      } else {
        msgEl.style.color = 'var(--accent, #65C466)';
        msgEl.textContent = 'Пароль успешно изменён';
        setTimeout(() => modal.classList.remove('active'), 900);
      }
    } catch (err) {
      msgEl.style.color = '#ff453a';
      msgEl.textContent = 'Ошибка соединения с сервером';
    } finally {
      submitBtn.disabled = false;
    }
  };

  modal.classList.add('active');
  setTimeout(() => oldInp.focus(), 60);
}
