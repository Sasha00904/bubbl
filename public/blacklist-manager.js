const myBlacklistIds = new Set();

async function loadMyBlacklist(userId) {
  try {
    const res = await fetch(`/api/blacklist/${userId}`);
    const list = await res.json();
    myBlacklistIds.clear();
    list.forEach(u => myBlacklistIds.add(u.id));
    return list;
  } catch (e) {
    return new Array();
  }
}

function isUserInMyBlacklist(targetId) {
  return myBlacklistIds.has(targetId);
}

async function setUserBlockedState(ownerId, targetUser, shouldBlock) {
  const endpoint = shouldBlock ? '/api/blacklist/block' : '/api/blacklist/unblock';
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ownerId, targetId: targetUser.id })
    });
    if (res.ok) {
      if (shouldBlock) myBlacklistIds.add(targetUser.id);
      else myBlacklistIds.delete(targetUser.id);

      if (typeof socket !== 'undefined') {
        socket.emit('blacklist_changed', { ownerId, targetId: targetUser.id });
      }
      await refreshChatBlockUI();
    }
  } catch (e) {
    console.error('Ошибка обновления чёрного списка:', e);
  }
}

async function refreshChatBlockUI() {
  const formEl = document.getElementById('form');
  const blockedFooter = document.getElementById('blockedChatFooter');
  const unblockBtn = document.getElementById('unblockUserFooterBtn');
  if (!formEl || !blockedFooter) return;

  const isPrivateChat = typeof activeChat !== 'undefined' && activeChat && activeChat.type === 'private';
  const isBlockedNow = isPrivateChat && isUserInMyBlacklist(activeChat.user.id);

  if (isBlockedNow) {
    formEl.style.display = 'none';
    blockedFooter.style.display = 'flex';

    // Привязываем клик напрямую к кнопке "Разблокировать" внизу чата
    if (unblockBtn) {
      unblockBtn.onclick = async () => {
        unblockBtn.disabled = true;
        await setUserBlockedState(currentUser.id, activeChat.user, false);
        unblockBtn.disabled = false;
      };
    }
  } else {
    blockedFooter.style.display = 'none';
    formEl.style.display = 'flex';
  }

  if (isPrivateChat) {
    try {
      const res = await fetch(`/api/users/${activeChat.user.id}/status?viewerId=${currentUser.id}`);
      const st = await res.json();
      presenceMap[activeChat.user.id] = {
        online: st.online,
        lastSeen: st.lastSeen,
        isLongTimeAgo: Boolean(st.isLongTimeAgo)
      };
    } catch (e) {}

    if (typeof updateChatHeader === 'function') {
      updateChatHeader(activeChat.user, null, true);
    }
  }

  if (typeof renderSidebarDialogs === 'function') {
    renderSidebarDialogs();
  }
}
