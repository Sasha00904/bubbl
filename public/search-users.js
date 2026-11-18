function initUserSearch(currentUser, onSelectUser) {
  const searchInput = document.getElementById('userSearchInput');
  const clearBtn = document.getElementById('clearSearchBtn');
  const searchResultsBox = document.getElementById('searchResults');
  const chatListBox = document.getElementById('chatList');

  let debounceTimer = null;

  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim();
    clearBtn.style.display = query ? 'block' : 'none';

    clearTimeout(debounceTimer);
    if (!query) {
      searchResultsBox.style.display = 'none';
      chatListBox.style.display = 'block';
      return;
    }

    debounceTimer = setTimeout(async () => {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}&excludeId=${currentUser.id}`);
      const users = await res.json();

      chatListBox.style.display = 'none';
      searchResultsBox.style.display = 'block';
      searchResultsBox.innerHTML = `<div class="sidebar-section-title">Глобальный поиск</div>`;

      if (users.length === 0) {
        searchResultsBox.innerHTML += `<div class="search-empty">Никого не найдено</div>`;
        return;
      }

      users.forEach(user => {
        const avatarHtml = user.avatarUrl
          ? `<img src="${user.avatarUrl}">`
          : user.firstName.toUpperCase();

        const item = document.createElement('div');
        item.className = 'chat-item';
        item.innerHTML = `
          <div class="avatar">${avatarHtml}</div>
          <div style="overflow: hidden;">
            <strong style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
              ${user.firstName} ${user.lastName || ''}
            </strong>
            <small style="color: var(--accent);">${user.username}</small>
          </div>
        `;

        item.onclick = () => {
          // Очищаем поиск и открываем диалог с найденным пользователем
          searchInput.value = '';
          clearBtn.style.display = 'none';
          searchResultsBox.style.display = 'none';
          chatListBox.style.display = 'block';
          onSelectUser(user);
        };

        searchResultsBox.appendChild(item);
      });
    }, 200);
  });

  clearBtn.onclick = () => {
    searchInput.value = '';
    clearBtn.style.display = 'none';
    searchResultsBox.style.display = 'none';
    chatListBox.style.display = 'block';
  };
}
