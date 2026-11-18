(function initGroupCreateModalDOM() {
  const modal = document.createElement('div');
  modal.className = 'settings-overlay';
  modal.id = 'createGroupModal';
  modal.innerHTML = `
    <div class="ios-group-card">
      <div id="createGroupStep1">
        <div class="ios-nav-header">
          <button type="button" class="ios-nav-btn" id="cancelGroupStep1Btn">Отмена</button>
          <span class="ios-nav-title">Новая группа</span>
          <button type="button" class="ios-nav-btn primary" id="nextGroupStep1Btn">Далее</button>
        </div>

        <div style="padding: 8px 18px 22px;">
          <label for="newGroupAvatarInput" class="ios-group-avatar-picker" id="newGroupAvatarPreview" title="Выбрать фото группы"></label>
          <input type="file" id="newGroupAvatarInput" accept="image/*" style="display: none;">

          <div class="tg-ios-group">
            <div class="tg-info-row" style="padding: 12px 14px;">
              <input type="text" class="tg-edit-input" id="newGroupNameInput" autocomplete="off" placeholder="Название группы" style="font-size: 15px; text-align: center;">
            </div>
          </div>

          <div id="createGroupStep1Error" style="color: #ff453a; font-size: 12.5px; text-align: center; margin-top: 10px; min-height: 16px;"></div>
        </div>
      </div>

      <div id="createGroupStep2" style="display: none;">
        <div class="ios-nav-header">
          <button type="button" class="ios-nav-btn primary" id="backGroupStep2Btn">
            <span style="font-size: 18px; line-height: 1;">‹</span><span>Назад</span>
          </button>
          <div style="text-align: center;">
            <div class="ios-nav-title">Участники</div>
            <div id="grpSelectedCounter" style="font-size: 11px; color: #8e8e93; margin-top: 1px;">выбрано: 0</div>
          </div>
          <button type="button" class="ios-nav-btn primary" id="submitCreateGroupBtn">Создать</button>
        </div>

        <div style="padding: 6px 16px 10px;">
          <div class="search-wrapper" style="padding: 0;">
            <span class="search-icon" style="left: 12px; display:flex; align-items:center;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </span>
            <input type="text" id="groupMemberSearchInput" class="search-input" placeholder="Поиск по имени или @username" autocomplete="off">
          </div>
        </div>

        <div style="padding: 0 16px 18px; max-height: 290px; overflow-y: auto;">
          <div class="tg-ios-group" id="groupMembersPickList"></div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });
})();

function renderGroupMemberCandidateList(usersArray, selectedUsersMap) {
  const pickList = document.getElementById('groupMembersPickList');
  const counterEl = document.getElementById('grpSelectedCounter');
  pickList.innerHTML = '';

  if (usersArray.length === 0) {
    pickList.innerHTML = `<div style="padding: 18px; text-align: center; font-size: 13px; color: #8e8e93; line-height: 1.4;">Нет недавних диалогов.<br>Нажмите «Создать», чтобы создать группу одному, или найдите людей через поиск.</div>`;
    return;
  }

  usersArray.forEach(u => {
    const isSelected = selectedUsersMap.has(u.id);
    const avHtml = u.avatarUrl ? `<img src="${u.avatarUrl}">` : u.firstName.toUpperCase();
    const row = document.createElement('div');
    row.className = `group-member-pick-row ${isSelected ? 'selected' : ''}`;
    row.innerHTML = `
      <div style="display: flex; align-items: center; gap: 11px; overflow: hidden;">
        <div class="avatar" style="width: 36px; height: 36px; font-size: 14px;">${avHtml}</div>
        <div style="overflow: hidden;">
          <div style="font-size: 14px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${u.firstName} ${u.lastName || ''}</div>
          <div style="font-size: 12px; color: #8e8e93;">${u.username}</div>
        </div>
      </div>
      <div class="ios-radio-check">✓</div>
    `;
    row.onclick = () => {
      if (selectedUsersMap.has(u.id)) selectedUsersMap.delete(u.id);
      else selectedUsersMap.set(u.id, u);
      row.classList.toggle('selected', selectedUsersMap.has(u.id));
      counterEl.textContent = `выбрано: ${selectedUsersMap.size}`;
    };
    pickList.appendChild(row);
  });
}

function openCreateGroupModal() {
  const modal = document.getElementById('createGroupModal');
  const step1 = document.getElementById('createGroupStep1');
  const step2 = document.getElementById('createGroupStep2');
  const nameInput = document.getElementById('newGroupNameInput');
  const avatarInput = document.getElementById('newGroupAvatarInput');
  const avatarPreview = document.getElementById('newGroupAvatarPreview');
  const errEl = document.getElementById('createGroupStep1Error');
  const searchInput = document.getElementById('groupMemberSearchInput');

  let croppedGroupAvatarFile = null;
  const selectedUsersMap = new Map();
  const chatContacts = Object.values(dialogs).map(d => d.user).filter(Boolean);

  step1.style.display = 'block';
  step2.style.display = 'none';
  nameInput.value = '';
  errEl.textContent = '';
  searchInput.value = '';
  document.getElementById('grpSelectedCounter').textContent = 'выбрано: 0';
  avatarPreview.innerHTML = `
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
    <span style="font-size: 10.5px; font-weight: 600; color: #8e8e93;">Фото</span>
  `;

  avatarInput.onchange = (e) => {
    const file = e.target.files.item(0);
    if (!file) return;
    if (typeof openAvatarCropper === 'function') {
      openAvatarCropper(file, (croppedFile, previewUrl) => {
        croppedGroupAvatarFile = croppedFile;
        avatarPreview.innerHTML = `<img src="${previewUrl}" style="width:100%; height:100%; object-fit:cover;">`;
      });
    } else {
      croppedGroupAvatarFile = file;
    }
  };

  document.getElementById('cancelGroupStep1Btn').onclick = () => modal.classList.remove('active');

  document.getElementById('nextGroupStep1Btn').onclick = () => {
    if (!nameInput.value.trim()) {
      errEl.textContent = 'Введите название группы';
      nameInput.focus();
      return;
    }
    errEl.textContent = '';
    step1.style.display = 'none';
    step2.style.display = 'block';
    renderGroupMemberCandidateList(chatContacts, selectedUsersMap);
  };

  document.getElementById('backGroupStep2Btn').onclick = () => {
    step2.style.display = 'none';
    step1.style.display = 'block';
  };

  searchInput.oninput = async () => {
    const q = searchInput.value.trim();
    if (!q) {
      renderGroupMemberCandidateList(chatContacts, selectedUsersMap);
      return;
    }
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}&excludeId=${currentUser.id}`);
      const found = await res.json();
      renderGroupMemberCandidateList(found, selectedUsersMap);
    } catch (e) {}
  };

  document.getElementById('submitCreateGroupBtn').onclick = async () => {
    const btn = document.getElementById('submitCreateGroupBtn');
    btn.disabled = true;

    const invitedUsers = Array.from(selectedUsersMap.values());
    const formData = new FormData();
    formData.append('name', nameInput.value.trim());
    formData.append('description', '');
    formData.append('creatorUser', JSON.stringify(currentUser));
    formData.append('memberUsers', JSON.stringify(invitedUsers));
    if (croppedGroupAvatarFile) formData.append('avatar', croppedGroupAvatarFile, 'group_avatar.png');

    const res = await fetch('/api/groups/create', { method: 'POST', body: formData });
    const data = await res.json();
    btn.disabled = false;

    if (res.ok) {
      modal.classList.remove('active');
      groupsMap[data.group.id] = { group: data.group, messages: new Array(), unread: 0, pinned: false };

      socket.emit('notify_group_sync', {
        group: data.group,
        extraUserIds: new Array(),
        systemEvent: { type: 'created', actor: currentUser }
      });

      invitedUsers.forEach(invited => {
        socket.emit('notify_group_sync', {
          group: data.group,
          extraUserIds: new Array(),
          systemEvent: { type: 'added', actor: currentUser, target: invited }
        });
      });

      renderSidebarDialogs();
      openGroupChat(data.group);
    }
  };

  modal.classList.add('active');
  setTimeout(() => nameInput.focus(), 50);
}
