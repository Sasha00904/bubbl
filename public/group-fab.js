(function initGroupCreateFAB() {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;

  const fabWrap = document.createElement('div');
  fabWrap.className = 'fab-create-wrapper';
  fabWrap.innerHTML = `
    <div class="fab-popover-menu" id="fabCreatePopover">
      <div class="apple-context-item" id="fabOpenCreateGroupBtn">
        <span>Создать группу</span>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
      </div>
    </div>
    <button type="button" class="fab-plus-btn" id="fabMainPlusBtn" title="Создать">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
    </button>
  `;
  sidebar.appendChild(fabWrap);

  const plusBtn = document.getElementById('fabMainPlusBtn');
  const popover = document.getElementById('fabCreatePopover');

  plusBtn.onclick = (e) => {
    e.stopPropagation();
    popover.classList.toggle('active');
  };
  document.addEventListener('click', () => popover.classList.remove('active'));

  document.getElementById('fabOpenCreateGroupBtn').onclick = () => {
    popover.classList.remove('active');
    if (typeof openCreateGroupModal === 'function') openCreateGroupModal();
  };
})();
