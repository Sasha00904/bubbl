(function initGroupInfoModalDOM() {
  const modal = document.createElement('div');
  modal.className = 'tg-modal-overlay';
  modal.id = 'groupInfoModal';
  modal.innerHTML = `
    <div class="ios-group-card" style="width: 380px;">
      <div id="groupInfoViewMode">
        <div class="ios-nav-header">
          <span style="width: 30px; display: inline-block;"></span>
          <span class="ios-nav-title">Информация</span>
          <button class="tg-icon-btn" id="closeGroupInfoBtn" title="Закрыть">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div class="tg-profile-top" style="margin-top: 8px; padding-bottom: 12px;">
          <div class="tg-profile-avatar" id="grpModalAvatar" style="margin-top: 0;"></div>
          <div class="tg-profile-name" id="grpModalName"></div>
          <div class="tg-profile-status" id="grpModalMembersCount" style="color: #8e8e93;"></div>
        </div>

        <div class="tg-profile-body" style="padding-top: 0;">
          <div class="grp-action-tiles" id="grpAdminTilesRow" style="display: none; margin-top: 4px;">
            <button type="button" class="grp-tile-btn" id="grpTileManageBtn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>
              <span>Управление</span>
            </button>
            <button type="button" class="grp-tile-btn" id="grpTileAddMemberBtn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
              <span>Добавить</span>
            </button>
          </div>

          <div class="tg-ios-group" id="grpModalDescBox" style="margin-bottom: 14px; display: none;">
            <div class="tg-info-row">
              <div class="tg-info-label">Описание</div>
              <div class="tg-info-val" id="grpModalDesc"></div>
            </div>
          </div>

          <div id="grpAddMemberSearchBox" style="display: none; margin-bottom: 12px;">
            <input type="text" id="grpAddMemberInput" class="search-input" placeholder="Поиск по имени или @username..." autocomplete="off">
            <div class="tg-ios-group" id="grpAddMemberResults" style="margin-top: 6px;"></div>
          </div>

          <div class="settings-section-label" id="grpMembersSectionTitle">Участники</div>
          <div class="tg-ios-group" id="grpMembersListContainer"></div>
        </div>
      </div>

      <div id="groupInfoEditMode" style="display: none;">
        <div class="ios-nav-header">
          <button type="button" class="ios-nav-btn primary" id="grpCancelEditBtn">
            <span style="font-size: 18px; line-height: 1;">‹</span><span>Назад</span>
          </button>
          <span class="ios-nav-title">Управление</span>
          <button type="button" class="ios-nav-btn primary" id="grpSaveEditBtn">Готово</button>
        </div>

        <div class="tg-profile-body" style="padding-top: 6px;">
          <label for="grpEditAvatarInput" class="ios-group-avatar-picker" id="grpEditAvatarPreview" title="Сменить фото группы" style="width: 80px; height: 80px; margin-bottom: 16px;"></label>
          <input type="file" id="grpEditAvatarInput" accept="image/*" style="display: none;">

          <div class="tg-ios-group" style="margin-bottom: 16px;">
            <div class="tg-info-row">
              <div class="tg-info-label">Название группы</div>
              <input type="text" class="tg-edit-input" id="grpEditNameInput">
            </div>
            <div class="tg-info-row">
              <div class="tg-info-label">Описание</div>
              <input type="text" class="tg-edit-input" id="grpEditDescInput" placeholder="Добавить описание...">
            </div>
          </div>

          <div class="settings-section-label">Администраторы</div>
          <div class="tg-ios-group" id="grpManageAdminsList"></div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });
  document.getElementById('closeGroupInfoBtn').onclick = () => modal.classList.remove('active');
})();

function switchGroupToManageMode(grp) {
  document.getElementById('groupInfoViewMode').style.display = 'none';
  document.getElementById('groupInfoEditMode').style.display = 'block';

  let newAvatarFile = null;
  const prevEl = document.getElementById('grpEditAvatarPreview');
  prevEl.innerHTML = grp.avatarUrl
    ? `<img src="${grp.avatarUrl}" style="width:100%; height:100%; object-fit:cover;">`
    : `<span style="font-size: 28px; font-weight: 700;">${grp.name.at(0).toUpperCase()}</span>`;
  document.getElementById('grpEditNameInput').value = grp.name;
  document.getElementById('grpEditDescInput').value = grp.description || '';

  if (typeof renderGroupAdminsManageList === 'function') {
    renderGroupAdminsManageList(grp, (updatedGrp) => {
      if (updatedGrp) grp = updatedGrp;
    });
  }

  document.getElementById('grpEditAvatarInput').onchange = (e) => {
    const f = e.target.files.item(0);
    if (!f) return;
    if (typeof openAvatarCropper === 'function') {
      openAvatarCropper(f, (cropped, url) => {
        newAvatarFile = cropped;
        prevEl.innerHTML = `<img src="${url}" style="width:100%; height:100%; object-fit:cover;">`;
      });
    }
  };

  document.getElementById('grpCancelEditBtn').onclick = () => openGroupInfoModal(grp.id);

  document.getElementById('grpSaveEditBtn').onclick = async () => {
    const fd = new FormData();
    fd.append('actorId', currentUser.id);
    fd.append('name', document.getElementById('grpEditNameInput').value.trim());
    fd.append('description', document.getElementById('grpEditDescInput').value.trim());
    if (newAvatarFile) fd.append('avatar', newAvatarFile, 'grp.png');

    const updRes = await fetch(`/api/groups/${grp.id}/update`, { method: 'POST', body: fd });
    const updData = await updRes.json();
    if (updRes.ok) {
      socket.emit('notify_group_sync', { group: updData.group, extraUserIds: new Array() });
      if (activeChat && activeChat.type === 'group' && activeChat.group.id === grp.id) {
        openGroupChat(updData.group);
      }
      openGroupInfoModal(grp.id);
    }
  };
}

async function openGroupInfoModal(groupId) {
  const modal = document.getElementById('groupInfoModal');
  document.getElementById('groupInfoViewMode').style.display = 'block';
  document.getElementById('groupInfoEditMode').style.display = 'none';
  document.getElementById('grpAddMemberSearchBox').style.display = 'none';

  const res = await fetch(`/api/groups/${groupId}`);
  if (!res.ok) return;
  const grp = await res.json();
  if (groupsMap[grp.id]) groupsMap[grp.id].group = grp;

  const amIAdmin = grp.creatorId === currentUser.id || grp.adminIds.includes(currentUser.id);
  document.getElementById('grpAdminTilesRow').style.display = amIAdmin ? 'flex' : 'none';

  document.getElementById('grpModalAvatar').innerHTML = grp.avatarUrl
    ? `<img src="${grp.avatarUrl}">`
    : grp.name.at(0).toUpperCase();
  document.getElementById('grpModalName').textContent = grp.name;
  document.getElementById('grpModalMembersCount').textContent = `${grp.members.length} участн.`;
  document.getElementById('grpMembersSectionTitle').textContent = `Участники (${grp.members.length})`;

  const descBox = document.getElementById('grpModalDescBox');
  if (grp.description) {
    descBox.style.display = 'block';
    document.getElementById('grpModalDesc').textContent = grp.description;
  } else {
    descBox.style.display = 'none';
  }

  const reloadModal = () => openGroupInfoModal(grp.id);
  if (typeof renderGroupMembersList === 'function') renderGroupMembersList(grp, amIAdmin, reloadModal);
  if (typeof bindGroupAddMemberTile === 'function') bindGroupAddMemberTile(grp, reloadModal);

  document.getElementById('grpTileManageBtn').onclick = () => switchGroupToManageMode(grp);
  modal.classList.add('active');
}
