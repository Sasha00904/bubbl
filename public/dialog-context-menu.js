function removeDialogLocally(partnerId) {
  Reflect.deleteProperty(dialogs, partnerId);
  if (activeChat && activeChat.type === 'private' && activeChat.user.id === partnerId) {
    activeChat = null;
    document.getElementById('activeChatContainer').style.display = 'none';
    document.getElementById('emptyState').style.display = 'flex';
  }
  if (typeof renderSidebarDialogs === 'function') {
    renderSidebarDialogs();
  }
}

function showDialogContextMenu(event, dialog) {
  event.preventDefault();
  const menu = document.getElementById('appleContextMenu');
  if (!menu) return;

  const isPinned = Boolean(dialog.pinned);
  const isBlocked = typeof isUserInMyBlacklist === 'function' && isUserInMyBlacklist(dialog.user.id);

  menu.innerHTML = `
    <div class="apple-context-item" id="ctxPinDialog">
      <span>${isPinned ? 'Открепить' : 'Закрепить'}</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"></path><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"></path></svg>
    </div>
    <div class="apple-context-item" id="ctxBlockDialog">
      <span>${isBlocked ? 'Разблокировать' : 'Заблокировать'}</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
    </div>
    <div class="apple-context-divider"></div>
    <div class="apple-context-item danger" id="ctxDeleteDialog">
      <span>Удалить чат</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
    </div>
  `;

  menu.style.display = 'block';
  const menuWidth = menu.offsetWidth;
  const menuHeight = menu.offsetHeight;
  let x = event.clientX;
  let y = event.clientY;

  if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 10;
  if (y + menuHeight > window.innerHeight) y = window.innerHeight - menuHeight - 10;

  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;

  document.getElementById('ctxPinDialog').onclick = () => {
    dialog.pinned = !dialog.pinned;
    menu.style.display = 'none';
    renderSidebarDialogs();
  };

  document.getElementById('ctxBlockDialog').onclick = async () => {
    menu.style.display = 'none';
    if (typeof setUserBlockedState === 'function') {
      await setUserBlockedState(currentUser.id, dialog.user, !isBlocked);
    }
  };

  document.getElementById('ctxDeleteDialog').onclick = () => {
    menu.style.display = 'none';
    const partner = dialog.user;

    openIosActionDialog({
      title: 'Удалить чат?',
      description: 'Выберите, у кого удалить всю историю переписки.',
      buttons: new Array(
        {
          label: 'Удалить у всех',
          styleClass: 'danger',
          onClick: () => {
            socket.emit('delete_chat_everyone', {
              senderId: currentUser.id,
              recipientId: partner.id
            });
            removeDialogLocally(partner.id);
          }
        },
        {
          label: 'Удалить только у меня',
          styleClass: 'secondary',
          onClick: () => {
            removeDialogLocally(partner.id);
          }
        },
        {
          label: 'Отмена',
          styleClass: 'secondary'
        }
      )
    });
  };
}
