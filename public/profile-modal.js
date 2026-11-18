(function initProfileModalDOM() {
  if (document.getElementById('userProfileModal')) return;

  const modal = document.createElement('div');
  modal.className = 'tg-modal-overlay';
  modal.id = 'userProfileModal';
  modal.innerHTML = `
    <div class="tg-profile-card" style="padding: 0; overflow: hidden;">
      <div id="profileModalBanner" style="height: 150px; width: 100%; background: linear-gradient(180deg, #3a3b40 0%, #242528 100%); background-size: cover; background-position: center; position: relative; padding: 14px 16px;">
        <div class="tg-profile-top" style="display: flex; align-items: center; justify-content: space-between; position: relative; z-index: 2;">
          <div id="profileTopLeftSlot" style="display: flex; align-items: center; gap: 6px;"></div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <button type="button" class="tg-icon-btn" id="editMyProfileBtn" title="Редактировать" style="display: none; backdrop-filter: blur(10px); background: rgba(0,0,0,0.45);">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
            </button>
            <button type="button" class="tg-icon-btn" id="closeProfileBtn" title="Закрыть" style="backdrop-filter: blur(10px); background: rgba(0,0,0,0.45);">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        </div>
      </div>

      <div style="padding: 0 18px 20px;">
        <div class="tg-profile-hero" style="text-align: center; margin: -44px 0 16px; position: relative; z-index: 2;">
          <div class="avatar" id="profileModalAvatar" style="width: 84px; height: 84px; font-size: 28px; margin: 0 auto 10px; border: 3px solid #1c1c1e; box-shadow: 0 6px 18px rgba(0,0,0,0.45);"></div>
          <div id="profileModalFullName" style="font-size: 18.5px; font-weight: 700;"></div>
          <div id="profileModalStatus" style="font-size: 13px; color: var(--accent, #65C466); margin-top: 2px;"></div>
        </div>

        <div class="tg-ios-group">
          <div class="tg-info-row" id="profileModalBioRow" style="display: none;">
            <div class="tg-info-label">О себе</div>
            <div id="profileModalBio" style="font-size: 14.5px; white-space: pre-wrap;"></div>
          </div>
          <div class="tg-info-row">
            <div class="tg-info-label">Имя пользователя</div>
            <div id="profileModalUsername" style="font-size: 14.5px; color: var(--accent, #65C466); font-weight: 500;"></div>
          </div>
          <div class="tg-info-row">
            <div class="tg-info-label">Имя</div>
            <div id="profileModalFirstName" style="font-size: 14.5px;"></div>
          </div>
          <div class="tg-info-row" id="profileModalLastNameRow">
            <div class="tg-info-label">Фамилия</div>
            <div id="profileModalLastName" style="font-size: 14.5px;"></div>
          </div>
        </div>

        <button type="button" class="tg-block-btn" id="blockUserProfileBtn" style="display: none;">Заблокировать</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });
  document.getElementById('closeProfileBtn').onclick = () => modal.classList.remove('active');
})();

function openProfileModal(userObj, isOwnProfile = false, onSaveCallback = null) {
  const modal = document.getElementById('userProfileModal');
  if (!modal || !userObj) return;

  const fullName = `${userObj.firstName} ${userObj.lastName || ''}`.trim();
  const pInfo = typeof presenceMap !== 'undefined' ? (presenceMap[userObj.id] || {}) : {};
  const isBlockedByMe = !isOwnProfile && typeof isUserInMyBlacklist === 'function' && isUserInMyBlacklist(userObj.id);
  const isHiddenStatus = pInfo.isLongTimeAgo || isBlockedByMe;

  const bannerEl = document.getElementById('profileModalBanner');
  if (!isHiddenStatus && userObj.bannerUrl) {
    bannerEl.style.backgroundImage = `url('${userObj.bannerUrl}')`;
  } else {
    bannerEl.style.backgroundImage = 'linear-gradient(180deg, #3a3b40 0%, #242528 100%)';
  }

  const avatarEl = document.getElementById('profileModalAvatar');
  avatarEl.innerHTML = (!isHiddenStatus && userObj.avatarUrl)
    ? `<img src="${userObj.avatarUrl}">`
    : userObj.firstName.at(0).toUpperCase();

  document.getElementById('profileModalFullName').textContent = fullName;
  const statusEl = document.getElementById('profileModalStatus');
  if (isOwnProfile) {
    statusEl.textContent = 'в сети';
    statusEl.style.color = 'var(--accent, #65C466)';
  } else if (isHiddenStatus) {
    statusEl.textContent = 'был(а) давно';
    statusEl.style.color = '#8e8e93';
  } else {
    statusEl.textContent = pInfo.online ? 'в сети' : 'был(а) недавно';
    statusEl.style.color = pInfo.online ? 'var(--accent, #65C466)' : '#8e8e93';
  }

  const bioRow = document.getElementById('profileModalBioRow');
  const bioEl = document.getElementById('profileModalBio');
  if (!isHiddenStatus && userObj.bio && userObj.bio.trim()) {
    bioRow.style.display = 'flex';
    bioEl.textContent = userObj.bio.trim();
  } else {
    bioRow.style.display = 'none';
  }

  document.getElementById('profileModalUsername').textContent = userObj.username;
  document.getElementById('profileModalFirstName').textContent = userObj.firstName;
  document.getElementById('profileModalLastName').textContent = userObj.lastName || '—';

  const leftSlot = document.getElementById('profileTopLeftSlot');
  const editBtn = document.getElementById('editMyProfileBtn');
  const blockBtn = document.getElementById('blockUserProfileBtn');

  leftSlot.innerHTML = '';

  if (isOwnProfile) {
    const settingsBtn = document.createElement('button');
    settingsBtn.type = 'button';
    settingsBtn.className = 'tg-icon-btn';
    settingsBtn.title = 'Настройки';
    settingsBtn.style.cssText = 'backdrop-filter: blur(10px); background: rgba(0,0,0,0.45);';
    settingsBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`;
    settingsBtn.onclick = () => {
      modal.classList.remove('active');
      if (typeof openSettingsModal === 'function') openSettingsModal();
    };
    leftSlot.appendChild(settingsBtn);

    editBtn.style.display = 'flex';
    blockBtn.style.display = 'none';

    editBtn.onclick = () => {
      modal.classList.remove('active');
      if (typeof openProfileEditModal === 'function') {
        openProfileEditModal(userObj, onSaveCallback);
      }
    };
  } else {
    editBtn.style.display = 'none';

    const lockBtn = document.createElement('button');
    lockBtn.type = 'button';
    lockBtn.className = 'profile-e2ee-btn';
    lockBtn.title = 'Сквозное шифрование';
    lockBtn.style.cssText = 'backdrop-filter: blur(10px); background: rgba(0,0,0,0.45);';
    lockBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`;
    lockBtn.onclick = () => {
      if (typeof showE2EEInfoModal === 'function') showE2EEInfoModal(fullName);
    };
    leftSlot.appendChild(lockBtn);

    blockBtn.style.display = 'block';
    blockBtn.textContent = isBlockedByMe ? 'Разблокировать' : 'Заблокировать';

    blockBtn.onclick = async () => {
      const shouldBlock = !isBlockedByMe;
      if (typeof toggleBlockUser === 'function') {
        await toggleBlockUser(currentUser.id, userObj.id, shouldBlock);
      } else {
        const endpoint = shouldBlock ? '/api/blacklist/add' : '/api/blacklist/remove';
        await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ownerId: currentUser.id, targetId: userObj.id })
        });
      }

      if (typeof myBlockedUserIds !== 'undefined') {
        if (shouldBlock) myBlockedUserIds.add(userObj.id);
        else myBlockedUserIds.delete(userObj.id);
      }
      if (typeof socket !== 'undefined') {
        socket.emit('blacklist_changed', { ownerId: currentUser.id, targetId: userObj.id });
      }
      modal.classList.remove('active');
      if (typeof openPrivateChat === 'function') openPrivateChat(userObj);
    };
  }

  modal.classList.add('active');
}
