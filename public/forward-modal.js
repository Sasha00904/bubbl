(function initForwardModalDOM() {
  const style = document.createElement('style');
  style.textContent = `
    .bubbl-fwd-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.72);
      z-index: 1800;
      align-items: center;
      justify-content: center;
    }
    .bubbl-fwd-overlay.active { display: flex; }

    .bubbl-fwd-card {
      width: 350px;
      max-height: 76vh;
      background: #1c1c1e;
      color: #f5f5f7;
      border-radius: 24px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 28px 70px rgba(0, 0, 0, 0.9), inset 0 1px 0 rgba(255, 255, 255, 0.1);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .bubbl-fwd-header {
      padding: 16px 18px 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 16px;
      font-weight: 600;
    }

    .bubbl-fwd-search {
      margin: 0 16px 10px;
      padding: 9px 14px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      background: #262629;
      color: #ffffff;
      font-size: 13.5px;
      outline: none;
    }
    .bubbl-fwd-search:focus { border-color: var(--accent, #65C466); }

    .bubbl-fwd-list {
      padding: 0 10px 14px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .bubbl-fwd-row {
      padding: 9px 12px;
      border-radius: 13px;
      display: flex;
      align-items: center;
      gap: 11px;
      cursor: pointer;
      transition: background 0.12s;
    }
    .bubbl-fwd-row:hover { background: rgba(255, 255, 255, 0.08); }
  `;
  document.head.appendChild(style);

  // Удаляем старый незастилизованный блок, если он остался в DOM
  const oldBroken = document.getElementById('forwardModal');
  if (oldBroken) oldBroken.remove();

  const overlay = document.createElement('div');
  overlay.className = 'bubbl-fwd-overlay';
  overlay.id = 'bubblForwardModal';
  overlay.innerHTML = `
    <div class="bubbl-fwd-card">
      <div class="bubbl-fwd-header">
        <span>Переслать...</span>
        <button type="button" class="tg-icon-btn" id="closeBubblFwdBtn" title="Закрыть">✕</button>
      </div>
      <input type="text" class="bubbl-fwd-search" id="bubblFwdSearchInput" placeholder="Поиск чата..." autocomplete="off">
      <div class="bubbl-fwd-list" id="bubblFwdTargetsList"></div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('active');
  });
  document.getElementById('closeBubblFwdBtn').onclick = () => overlay.classList.remove('active');
})();

function openForwardModal(messagesArray, dialogsMap, onSelectTarget) {
  const overlay = document.getElementById('bubblForwardModal');
  const searchInput = document.getElementById('bubblFwdSearchInput');
  const listEl = document.getElementById('bubblFwdTargetsList');
  if (!overlay) return;

  searchInput.value = '';

  function renderTargets(filterQuery = '') {
    const q = filterQuery.trim().toLowerCase();
    listEl.innerHTML = '';

    // 1. Избранное
    if (!q || 'избранное'.includes(q)) {
      const savedRow = document.createElement('div');
      savedRow.className = 'bubbl-fwd-row';
      savedRow.innerHTML = `
        <div class="chat-icon" style="width: 36px; height: 36px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
        </div>
        <div>
          <div style="font-size: 14px; font-weight: 600;">Избранное</div>
          <div style="font-size: 12px; color: #8e8e93;">Сохранённые сообщения</div>
        </div>
      `;
      savedRow.onclick = () => {
        overlay.classList.remove('active');
        onSelectTarget({ type: 'saved' }, messagesArray);
      };
      listEl.appendChild(savedRow);
    }

    // 2. Личные диалоги
    Object.values(dialogsMap || {}).forEach(d => {
      const u = d.user;
      if (!u) return;
      const fullName = `${u.firstName} ${u.lastName || ''}`.trim();
      if (q && !fullName.toLowerCase().includes(q) && !u.username.toLowerCase().includes(q)) return;

      const avHtml = u.avatarUrl ? `<img src="${u.avatarUrl}">` : u.firstName.at(0).toUpperCase();
      const row = document.createElement('div');
      row.className = 'bubbl-fwd-row';
      row.innerHTML = `
        <div class="avatar" style="width: 36px; height: 36px; font-size: 14px;">${avHtml}</div>
        <div>
          <div style="font-size: 14px; font-weight: 600;">${fullName}</div>
          <div style="font-size: 12px; color: #8e8e93;">${u.username}</div>
        </div>
      `;
      row.onclick = () => {
        overlay.classList.remove('active');
        onSelectTarget({ type: 'private', user: u }, messagesArray);
      };
      listEl.appendChild(row);
    });
  }

  renderTargets();
  searchInput.oninput = () => renderTargets(searchInput.value);
  overlay.classList.add('active');
}
