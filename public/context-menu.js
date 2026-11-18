(function initAppleContextMenuDOM() {
  if (!document.getElementById('appleContextMenu')) {
    const menu = document.createElement('div');
    menu.className = 'apple-context-menu';
    menu.id = 'appleContextMenu';
    document.body.appendChild(menu);
  }

  document.addEventListener('click', () => {
    const m = document.getElementById('appleContextMenu');
    if (m) m.style.display = 'none';
  });
})();

function showMessageContextMenu(event, msgData, isOwn, callbacks = {}) {
  event.preventDefault();
  event.stopPropagation();

  const menu = document.getElementById('appleContextMenu');
  if (!menu) return;

  const canEdit = isOwn && Boolean(msgData.text);

  menu.innerHTML = `
    <div class="apple-context-item" id="ctxMsgReply">
      <span>Ответить</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 17 4 12 9 7"></polyline><path d="M20 18v-2a4 4 0 0 0-4-4H4"></path></svg>
    </div>
    ${msgData.text ? `
      <div class="apple-context-item" id="ctxMsgCopy">
        <span>Копировать</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
      </div>
    ` : ''}
    ${canEdit ? `
      <div class="apple-context-item" id="ctxMsgEdit">
        <span>Редактировать</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
      </div>
    ` : ''}
    <div class="apple-context-item" id="ctxMsgForward">
      <span>Переслать</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 17 20 12 15 7"></polyline><path d="M4 18v-2a4 4 0 0 1 4-4h12"></path></svg>
    </div>
    <div class="apple-context-item" id="ctxMsgSelect">
      <span>Выделить</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"></circle><polyline points="9 12 11 14 15 10"></polyline></svg>
    </div>
    <div class="apple-context-divider"></div>
    <div class="apple-context-item danger" id="ctxMsgDelete">
      <span>Удалить</span>
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

  document.getElementById('ctxMsgReply').onclick = () => {
    menu.style.display = 'none';
    if (callbacks.onReply) callbacks.onReply(msgData);
  };

  const copyBtn = document.getElementById('ctxMsgCopy');
  if (copyBtn) {
    copyBtn.onclick = () => {
      menu.style.display = 'none';
      if (navigator.clipboard && msgData.text) {
        navigator.clipboard.writeText(msgData.text);
      }
    };
  }

  const editBtn = document.getElementById('ctxMsgEdit');
  if (editBtn) {
    editBtn.onclick = () => {
      menu.style.display = 'none';
      if (callbacks.onEdit) callbacks.onEdit(msgData);
    };
  }

  document.getElementById('ctxMsgForward').onclick = () => {
    menu.style.display = 'none';
    if (callbacks.onForward) callbacks.onForward(msgData);
  };

  document.getElementById('ctxMsgSelect').onclick = () => {
    menu.style.display = 'none';
    if (callbacks.onSelect) callbacks.onSelect(msgData);
  };

  document.getElementById('ctxMsgDelete').onclick = () => {
    menu.style.display = 'none';
    if (callbacks.onDelete) callbacks.onDelete(msgData);
  };
}
