function renderMySidebarProfile() {
  if (!currentUser) return;
  document.getElementById('myName').textContent = `${currentUser.firstName} ${currentUser.lastName || ''}`;
  document.getElementById('myUsername').textContent = currentUser.username;
  const avatarBox = document.getElementById('myAvatar');
  avatarBox.innerHTML = currentUser.avatarUrl
    ? `<img src="${currentUser.avatarUrl}">`
    : currentUser.firstName.toUpperCase();
}

function openMyProfile() {
  if (typeof openProfileModal === 'function') {
    openProfileModal(currentUser, true, (updatedUser) => {
      currentUser = updatedUser;
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      renderMySidebarProfile();
    });
  }
}

function logout() {
  localStorage.removeItem('currentUser');
  window.location.href = '/login.html';
}

function getPreviewLabel(msg) {
  if (!msg) return null;
  if (msg.isSystem) return msg.text;
  if (msg.mediaType === 'image') return 'Фотография';
  if (msg.mediaType === 'video') return 'Видео';
  if (msg.mediaType === 'audio') return 'Голосовое сообщение';
  return msg.text;
}

function renderSidebarDialogs() {
  document.getElementById('tab-saved').classList.toggle('active', activeChat && activeChat.type === 'saved');
  const listContainer = document.getElementById('privateDialogsList');
  listContainer.innerHTML = '';

  const pinSvgHtml = `<span style="color: #8e8e93; display: inline-flex; align-items: center;" title="Закреплено"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"></path><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"></path></svg></span>`;

  if (typeof groupsMap !== 'undefined') {
    const sortedGroups = Object.values(groupsMap).sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    sortedGroups.forEach(gItem => {
      const g = gItem.group;
      const lastMsg = gItem.messages.at(-1);
      const previewText = lastMsg
        ? (lastMsg.isSystem ? lastMsg.text : `${lastMsg.sender.firstName}: ${getPreviewLabel(lastMsg)}`)
        : `${g.memberIds.length} участн.`;
      const isActive = activeChat && activeChat.type === 'group' && activeChat.group.id === g.id;
      const avatarHtml = g.avatarUrl ? `<img src="${g.avatarUrl}">` : g.name.at(0).toUpperCase();
      const badgeHtml = gItem.unread > 0 ? `<span class="unread-badge">${gItem.unread}</span>` : '';

      const item = document.createElement('div');
      item.className = `chat-item ${isActive ? 'active' : ''}`;
      item.innerHTML = `
        <div class="avatar">${avatarHtml}</div>
        <div style="overflow: hidden; flex: 1;">
          <strong style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${g.name}</strong>
          <small style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${previewText}</small>
        </div>
        <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">${gItem.pinned ? pinSvgHtml : ''}${badgeHtml}</div>
      `;
      item.onclick = () => openGroupChat(g);
      item.oncontextmenu = (e) => {
        if (typeof showGroupContextMenu === 'function') showGroupContextMenu(e, gItem);
      };
      listContainer.appendChild(item);
    });
  }

  const sortedDialogs = Object.values(dialogs).sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  sortedDialogs.forEach(dialog => {
    const u = dialog.user;
    const pInfo = presenceMap[u.id] || {};
    const isBlocked = pInfo.isLongTimeAgo || (typeof isUserInMyBlacklist === 'function' && isUserInMyBlacklist(u.id));
    const previewText = getPreviewLabel(dialog.messages.at(-1)) || u.username;
    const isActive = activeChat && activeChat.type === 'private' && activeChat.user.id === u.id;
    const avatarHtml = (!isBlocked && u.avatarUrl) ? `<img src="${u.avatarUrl}">` : u.firstName.toUpperCase();
    const badgeHtml = dialog.unread > 0 ? `<span class="unread-badge">${dialog.unread}</span>` : '';

    const item = document.createElement('div');
    item.className = `chat-item ${isActive ? 'active' : ''}`;
    item.innerHTML = `
      <div class="avatar">${avatarHtml}</div>
      <div style="overflow: hidden; flex: 1;">
        <strong style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${u.firstName} ${u.lastName || ''}</strong>
        <small style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${previewText}</small>
      </div>
      <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">${dialog.pinned ? pinSvgHtml : ''}${badgeHtml}</div>
    `;
    item.onclick = () => openPrivateChat(u);
    item.oncontextmenu = (e) => {
      if (typeof showDialogContextMenu === 'function') showDialogContextMenu(e, dialog);
    };
    listContainer.appendChild(item);
  });
}
