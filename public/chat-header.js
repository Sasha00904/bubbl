function openSavedChat() {
  activeChat = { type: 'saved' };
  clearInputBarModes();
  if (typeof refreshChatBlockUI === 'function') refreshChatBlockUI();

  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('activeChatContainer').style.display = 'flex';
  const header = document.getElementById('chatHeader');
  header.innerHTML = `<div class="header-user-name">Избранное</div>`;
  header.dataset.currentPartner = '';
  header.dataset.currentActivity = '';
  header.onclick = null;
  renderSidebarDialogs();
  renderMessages();
}

function openGroupChat(groupObj) {
  activeChat = { type: 'group', group: groupObj };
  clearInputBarModes();
  if (groupsMap[groupObj.id]) groupsMap[groupObj.id].unread = 0;

  const formEl = document.getElementById('form');
  const blockedFooter = document.getElementById('blockedChatFooter');
  if (formEl) formEl.style.display = 'flex';
  if (blockedFooter) blockedFooter.style.display = 'none';

  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('activeChatContainer').style.display = 'flex';

  const header = document.getElementById('chatHeader');
  header.dataset.currentPartner = groupObj.id;
  header.dataset.currentActivity = 'group';

  const avHtml = groupObj.avatarUrl ? `<img src="${groupObj.avatarUrl}">` : groupObj.name.at(0).toUpperCase();
  header.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px;">
      <div class="avatar" style="width: 36px; height: 36px; font-size: 14px;">${avHtml}</div>
      <div class="header-user-meta">
        <span class="header-user-name">${groupObj.name}</span>
        <span class="header-user-status">${groupObj.memberIds.length} участн.</span>
      </div>
    </div>
  `;

  header.onclick = () => {
    if (typeof openGroupInfoModal === 'function') openGroupInfoModal(groupObj.id);
  };

  renderSidebarDialogs();
  renderMessages();
}

async function openPrivateChat(partnerUser) {
  activeChat = { type: 'private', user: partnerUser };
  clearInputBarModes();
  if (dialogs[partnerUser.id]) dialogs[partnerUser.id].unread = 0;

  socket.emit('mark_read', { readerId: currentUser.id, senderId: partnerUser.id });
  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('activeChatContainer').style.display = 'flex';

  if (typeof refreshChatBlockUI === 'function') {
    await refreshChatBlockUI();
  }
  renderMessages();
}

function updateChatHeader(partnerUser, liveActivity, forceRedraw = false) {
  if (!activeChat || activeChat.type !== 'private' || activeChat.user.id !== partnerUser.id) return;

  const header = document.getElementById('chatHeader');
  const pInfo = presenceMap[partnerUser.id] || { online: false, lastSeen: null, isLongTimeAgo: false };
  const isBlocked = pInfo.isLongTimeAgo || (typeof isUserInMyBlacklist === 'function' && isUserInMyBlacklist(partnerUser.id));
  const stateSignature = `${isBlocked ? 'blocked' : (liveActivity || 'none')}_${pInfo.online}_${pInfo.lastSeen || 0}`;

  if (!forceRedraw && header.dataset.currentPartner === partnerUser.id && header.dataset.currentActivity === stateSignature) return;

  header.dataset.currentPartner = partnerUser.id;
  header.dataset.currentActivity = stateSignature;

  const avatarHtml = (!isBlocked && partnerUser.avatarUrl) ? `<img src="${partnerUser.avatarUrl}">` : partnerUser.firstName.toUpperCase();
  const statusHtml = isBlocked
    ? `<span class="header-user-status">был(а) давно</span>`
    : (typeof renderAnimatedStatusHtml === 'function'
      ? renderAnimatedStatusHtml(pInfo.online, pInfo.lastSeen, liveActivity)
      : `<span class="header-user-status">${pInfo.online ? 'в сети' : 'был(а) недавно'}</span>`);

  const fullName = `${partnerUser.firstName} ${partnerUser.lastName || ''}`.trim();
  header.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px;">
      <div class="avatar" style="width: 36px; height: 36px; font-size: 14px;">${avatarHtml}</div>
      <div class="header-user-meta">
        <span class="header-user-name">${fullName}</span>
        ${statusHtml}
      </div>
    </div>
  `;

  header.onclick = () => {
    if (typeof openProfileModal === 'function') openProfileModal(partnerUser, false);
  };
}
