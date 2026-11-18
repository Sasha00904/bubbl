function renderGroupMembersList(grp, amIAdmin, onReloadCallback) {
  const membersListEl = document.getElementById('grpMembersListContainer');
  membersListEl.innerHTML = '';

  grp.members.forEach(m => {
    const avHtml = m.avatarUrl ? `<img src="${m.avatarUrl}">` : m.firstName.toUpperCase();
    const roleLabel = m.isCreator ? 'creator' : (m.isAdmin ? 'admin' : '');
    const roleHtml = roleLabel ? `<span class="tg-role-tag">${roleLabel}</span>` : '';

    const canKick = amIAdmin && !m.isCreator && m.id !== currentUser.id;
    const kickBtnHtml = canKick
      ? `<button type="button" class="tg-icon-btn grp-kick-btn" title="Удалить из группы" style="width:26px; height:26px; color:#ff453a;">✕</button>`
      : '';

    const statusLine = m.online
      ? `<span style="color: var(--accent, #65C466);">в сети</span>`
      : `<span>${m.username}</span>`;

    const row = document.createElement('div');
    row.className = 'settings-row';
    row.style.gap = '10px';
    row.innerHTML = `
      <div style="display:flex; align-items:center; gap:10px; overflow:hidden;">
        <div class="avatar" style="width:36px; height:36px; font-size:14px;">${avHtml}</div>
        <div style="overflow:hidden;">
          <div style="font-size:14px; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${m.firstName} ${m.lastName || ''}</div>
          <div style="font-size:12px; color:#8e8e93;">${statusLine}</div>
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:8px; flex-shrink:0;">
        ${roleHtml}
        ${kickBtnHtml}
      </div>
    `;

    if (canKick) {
      row.querySelector('.grp-kick-btn').onclick = async () => {
        const r = await fetch(`/api/groups/${grp.id}/members/remove`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ actorId: currentUser.id, targetUserId: m.id })
        });
        const d = await r.json();
        if (r.ok) {
          socket.emit('notify_group_sync', { group: d.group, extraUserIds: new Array(m.id) });
          if (onReloadCallback) onReloadCallback();
        }
      };
    }

    membersListEl.appendChild(row);
  });
}

function renderGroupAdminsManageList(grp, onReloadCallback) {
  const container = document.getElementById('grpManageAdminsList');
  if (!container) return;
  container.innerHTML = '';

  const nonCreators = grp.members.filter(m => !m.isCreator);
  if (nonCreators.length === 0) {
    container.innerHTML = `<div style="padding: 12px 14px; font-size: 13px; color: #8e8e93;">Добавьте участников, чтобы назначить администраторов</div>`;
    return;
  }

  nonCreators.forEach(m => {
    const avHtml = m.avatarUrl ? `<img src="${m.avatarUrl}">` : m.firstName.toUpperCase();
    const row = document.createElement('div');
    row.className = 'settings-row';
    row.innerHTML = `
      <div style="display:flex; align-items:center; gap:10px;">
        <div class="avatar" style="width:32px; height:32px; font-size:13px;">${avHtml}</div>
        <span style="font-size:13.5px; font-weight:500;">${m.firstName} ${m.lastName || ''}</span>
      </div>
      <label class="ios-switch">
        <input type="checkbox" ${m.isAdmin ? 'checked' : ''}>
        <span class="ios-slider"></span>
      </label>
    `;

    row.querySelector('input').onchange = async (e) => {
      const r = await fetch(`/api/groups/${grp.id}/admins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actorId: currentUser.id, targetUserId: m.id, makeAdmin: e.target.checked })
      });
      const d = await r.json();
      if (r.ok) {
        socket.emit('notify_group_sync', { group: d.group, extraUserIds: new Array() });
        if (onReloadCallback) onReloadCallback(d.group);
      }
    };

    container.appendChild(row);
  });
}

function bindGroupAddMemberTile(grp, onReloadCallback) {
  const tileBtn = document.getElementById('grpTileAddMemberBtn');
  tileBtn.onclick = () => {
    const box = document.getElementById('grpAddMemberSearchBox');
    box.style.display = box.style.display === 'none' ? 'block' : 'none';
    const inp = document.getElementById('grpAddMemberInput');
    const resBox = document.getElementById('grpAddMemberResults');
    inp.value = '';

    function showCandidates(list) {
      const candidates = list.filter(u => !grp.memberIds.includes(u.id));
      resBox.innerHTML = '';
      if (candidates.length === 0) {
        resBox.innerHTML = `<div style="padding: 10px 14px; font-size: 12.5px; color: #8e8e93;">Нет доступных контактов</div>`;
        return;
      }
      candidates.forEach(u => {
        const item = document.createElement('div');
        item.className = 'settings-row clickable';
        item.innerHTML = `<span>${u.firstName} (${u.username})</span><span style="color:var(--accent); font-weight:600;">+ Добавить</span>`;
        item.onclick = async () => {
          const addR = await fetch(`/api/groups/${grp.id}/members/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ actorId: currentUser.id, memberUsers: new Array(u) })
          });
          const addData = await addR.json();
          if (addR.ok) {
            socket.emit('notify_group_sync', {
              group: addData.group,
              extraUserIds: new Array(u.id),
              systemEvent: { type: 'added', actor: currentUser, target: u }
            });
            if (onReloadCallback) onReloadCallback();
          }
        };
        resBox.appendChild(item);
      });
    }

    const recentUsers = Object.values(dialogs).map(d => d.user).filter(Boolean);
    showCandidates(recentUsers);

    inp.oninput = async () => {
      const q = inp.value.trim();
      if (!q) {
        showCandidates(recentUsers);
        return;
      }
      const searchRes = await fetch(`/api/users/search?q=${encodeURIComponent(q)}&excludeId=${currentUser.id}`);
      const found = await searchRes.json();
      showCandidates(found);
    };
  };
}
