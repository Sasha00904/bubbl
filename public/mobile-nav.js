(function initMobileNavigation() {
  window.openMobileChatView = function () {
    if (window.innerWidth <= 768) {
      document.body.classList.add('mobile-chat-open');
    }
  };

  window.closeMobileChatView = function () {
    document.body.classList.remove('mobile-chat-open');
    if (typeof activeChat !== 'undefined') {
      activeChat = null;
    }
    if (typeof renderSidebarDialogs === 'function') {
      renderSidebarDialogs();
    }
  };

  // Перехватываем любой клик по элементам списка чатов и результатам поиска
  document.addEventListener('click', (e) => {
    if (window.innerWidth > 768) return;
    const clickedChatItem = e.target.closest('#chatList .chat-item, #searchResults .chat-item');
    if (clickedChatItem) {
      setTimeout(() => {
        window.openMobileChatView();
      }, 20);
    }
  });

  // Автоматически вставляем кнопку "Назад" в шапку чата при её обновлении
  const chatHeader = document.getElementById('chatHeader');
  if (chatHeader) {
    const injectBackButton = () => {
      if (chatHeader.querySelector('.mobile-back-btn')) return;

      const backBtn = document.createElement('button');
      backBtn.type = 'button';
      backBtn.className = 'mobile-back-btn';
      backBtn.title = 'Назад к чатам';
      backBtn.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>`;

      backBtn.onclick = (e) => {
        e.stopPropagation();
        window.closeMobileChatView();
      };

      const firstChild = chatHeader.firstElementChild;
      if (firstChild && firstChild.tagName === 'DIV' && firstChild.style.display === 'flex') {
        firstChild.insertBefore(backBtn, firstChild.firstChild);
      } else {
        chatHeader.style.display = 'flex';
        chatHeader.style.justifyContent = 'flex-start';
        chatHeader.insertBefore(backBtn, chatHeader.firstChild);
      }
    };

    const headerObserver = new MutationObserver(injectBackButton);
    headerObserver.observe(chatHeader, { childList: true });
    injectBackButton();
  }
})();
