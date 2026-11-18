function formatGroupSystemText(sysEvent, myUserId) {
  if (!sysEvent) return '';
  const actorName = `${sysEvent.actor.firstName} ${sysEvent.actor.lastName || ''}`.trim();

  if (sysEvent.type === 'created') {
    return `${actorName} создал(а) группу`;
  }

  if (sysEvent.type === 'added' && sysEvent.target) {
    if (sysEvent.target.id === myUserId) {
      return 'Вы были добавлены в группу';
    }
    const targetName = `${sysEvent.target.firstName} ${sysEvent.target.lastName || ''}`.trim();
    return `${actorName} добавил(а) ${targetName}`;
  }

  return '';
}

function appendGroupSystemPill(text) {
  if (!text) return;
  const messagesBox = document.getElementById('messages');
  if (!messagesBox) return;

  const wrap = document.createElement('div');
  wrap.style.display = 'flex';
  wrap.style.justifyContent = 'center';
  wrap.style.margin = '8px 0';

  const pill = document.createElement('span');
  pill.textContent = text;
  pill.style.fontSize = '12px';
  pill.style.fontWeight = '500';
  pill.style.color = '#d1d1d6';
  pill.style.background = 'rgba(255, 255, 255, 0.08)';
  pill.style.padding = '5px 13px';
  pill.style.borderRadius = '14px';
  pill.style.border = '1px solid rgba(255, 255, 255, 0.06)';

  wrap.appendChild(pill);
  messagesBox.appendChild(wrap);
  messagesBox.scrollTop = messagesBox.scrollHeight;
}

function showGroupContextMenu(event, gItem) {
  event.preventDefault();
  const menu = document.getElementById('appleContextMenu');
  if (!menu) return;

  const grp = gItem.group;
  const isPinned = Boolean(gItem.pinned);
  const isCreator = grp.creatorId === currentUser.id;

  menu.innerHTML = `
    <div class="apple-context-item" id="ctxPinGroup">
      <span>${isPinned ? 'Открепить' : 'Закрепить'}</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 17v5"></path><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"></path></svg>
    </div>
    <div class="apple-context-divider"></div>
    <div class="apple-context-item danger" id="ctxLeaveOrDeleteGroup">
      <span>${isCreator ? 'Удалить группу' : 'Покинуть группу'}</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
    </div>
  `;

  menu.style.display = 'block';
  let x = event.clientX;
  let y = event.clientY;
  if (x + menu.offsetWidth > window.innerWidth) x = window.innerWidth - menu.offsetWidth - 10;
  if (y + menu.offsetHeight > window.innerHeight) y = window.innerHeight - menu.offsetHeight - 10;
  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;

  document.getElementById('ctxPinGroup').onclick = () => {
    gItem.pinned = !gItem.pinned;
    menu.style.display = 'none';
    renderSidebarDialogs();
  };

  document.getElementById('ctxLeaveOrDeleteGroup').onclick = async () => {
    menu.style.display = 'none';
    if (isCreator) {
      const res = await fetch(`/api/groups/${grp.id}/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actorId: currentUser.id })
      });
      if (res.ok) {
        const emptyGroup = { ...grp, memberIds: new Array() };
        socket.emit('notify_group_sync', { group: emptyGroup, extraUserIds: grp.memberIds });
      }
    } else {
      const res = await fetch(`/api/groups/${grp.id}/members/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actorId: currentUser.id, targetUserId: currentUser.id })
      });
      const data = await res.json();
      if (res.ok) {
        socket.emit('notify_group_sync', { group: data.group, extraUserIds: new Array(currentUser.id) });
      }
    }
  };
}
