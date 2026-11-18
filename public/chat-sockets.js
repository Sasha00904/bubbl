function initChatSockets(socket) {
  socket.on('user_presence', ({ userId, online, lastSeen }) => {
    const prev = presenceMap[userId] || {};
    presenceMap[userId] = { online, lastSeen, isLongTimeAgo: prev.isLongTimeAgo || false };
    if (activeChat && activeChat.type === 'private' && activeChat.user.id === userId) {
      updateChatHeader(activeChat.user, null, false);
    }
  });

  socket.on('blacklist_updated', async ({ partnerId }) => {
    if (typeof loadMyBlacklist === 'function') await loadMyBlacklist(currentUser.id);
    if (activeChat && activeChat.type === 'private' && activeChat.user.id === partnerId) {
      openPrivateChat(activeChat.user);
    } else if (dialogs[partnerId]) {
      try {
        const res = await fetch(`/api/users/${partnerId}/status?viewerId=${currentUser.id}`);
        const st = await res.json();
        presenceMap[partnerId] = { online: st.online, lastSeen: st.lastSeen, isLongTimeAgo: Boolean(st.isLongTimeAgo) };
      } catch (e) {}
      renderSidebarDialogs();
    }
  });

  socket.on('message_blocked_error', () => {
    alert('Невозможно отправить сообщение: пользователь заблокирован.');
  });

  socket.on('typing_activity', ({ senderId, activity }) => {
    if (activeChat && activeChat.type === 'private' && activeChat.user.id === senderId) {
      updateChatHeader(activeChat.user, activity, false);
    }
  });

  socket.on('group_message', async (msg) => {
    if (msg.text && typeof decryptMessageText === 'function') {
      msg.text = await decryptMessageText(msg.text, 'group', msg.groupId);
    }

    if (!groupsMap[msg.groupId]) {
      try {
        const res = await fetch(`/api/groups/${msg.groupId}`);
        if (res.ok) {
          const grpObj = await res.json();
          groupsMap[msg.groupId] = { group: grpObj, messages: new Array(), unread: 0, pinned: false };
        }
      } catch (e) {}
    }

    if (!groupsMap[msg.groupId]) return;
    groupsMap[msg.groupId].messages.push(msg);

    if (msg.sender.id !== currentUser.id && typeof playIncomingNotificationSound === 'function') {
      playIncomingNotificationSound();
    }

    if (activeChat && activeChat.type === 'group' && activeChat.group.id === msg.groupId) {
      appendMessageElement(msg, currentUser, getMessageCallbacks());
    } else {
      groupsMap[msg.groupId].unread += 1;
    }
    renderSidebarDialogs();
  });

  socket.on('group_message_edited', async ({ groupId, msgId, newText }) => {
    if (!groupsMap[groupId]) return;
    const decrypted = typeof decryptMessageText === 'function'
      ? await decryptMessageText(newText, 'group', groupId)
      : newText;

    const found = groupsMap[groupId].messages.find(m => m.msgId === msgId);
    if (found) {
      found.text = decrypted;
      found.isEdited = true;
    }
    if (activeChat && activeChat.type === 'group' && activeChat.group.id === groupId) renderMessages();
    renderSidebarDialogs();
  });

  socket.on('group_message_deleted', ({ groupId, msgId }) => {
    if (!groupsMap[groupId]) return;
    groupsMap[groupId].messages = groupsMap[groupId].messages.filter(m => m.msgId !== msgId);
    if (typeof animateAndRemoveMessageRow === 'function') animateAndRemoveMessageRow(msgId);
    renderSidebarDialogs();
  });

  socket.on('group_synced', ({ group, systemEvent }) => {
    if (!group.memberIds || !group.memberIds.includes(currentUser.id)) {
      Reflect.deleteProperty(groupsMap, group.id);
      if (activeChat && activeChat.type === 'group' && activeChat.group.id === group.id) {
        activeChat = null;
        document.getElementById('activeChatContainer').style.display = 'none';
        document.getElementById('emptyState').style.display = 'flex';
      }
    } else {
      if (!groupsMap[group.id]) {
        groupsMap[group.id] = { group, messages: new Array(), unread: 0, pinned: false };
      } else {
        groupsMap[group.id].group = group;
      }

      if (systemEvent && typeof formatGroupSystemText === 'function') {
        const sysText = formatGroupSystemText(systemEvent, currentUser.id);
        if (sysText) {
          groupsMap[group.id].messages.push({ isSystem: true, text: sysText });
          if (activeChat && activeChat.type === 'group' && activeChat.group.id === group.id) {
            appendGroupSystemPill(sysText);
          }
        }
      }

      if (activeChat && activeChat.type === 'group' && activeChat.group.id === group.id) {
        openGroupChat(group);
      }
    }
    renderSidebarDialogs();
  });

  socket.on('private_message', async (msg) => {
    const partner = msg.sender.id === currentUser.id ? msg.recipient : msg.sender;
    if (msg.text && typeof decryptMessageText === 'function') {
      msg.text = await decryptMessageText(msg.text, 'private', currentUser.id, partner.id);
    }

    if (!dialogs[partner.id]) {
      dialogs[partner.id] = { user: partner, messages: new Array(), unread: 0, pinned: false };
    }
    dialogs[partner.id].messages.push(msg);

    if (msg.sender.id !== currentUser.id && typeof playIncomingNotificationSound === 'function') {
      playIncomingNotificationSound();
    }

    if (activeChat && activeChat.type === 'private' && activeChat.user.id === partner.id) {
      updateChatHeader(partner, null, false);
      appendMessageElement(msg, currentUser, getMessageCallbacks());
      if (msg.sender.id === partner.id && document.hasFocus()) {
        socket.emit('mark_read', { readerId: currentUser.id, senderId: partner.id });
      }
    } else {
      dialogs[partner.id].unread += 1;
    }
    renderSidebarDialogs();
  });

  window.addEventListener('focus', () => {
    if (activeChat && activeChat.type === 'private') {
      socket.emit('mark_read', { readerId: currentUser.id, senderId: activeChat.user.id });
    }
  });

  socket.on('messages_read', ({ readerId }) => {
    if (dialogs[readerId]) {
      dialogs[readerId].messages.forEach(m => {
        if (m.sender.id === currentUser.id) m.isRead = true;
      });
    }
    if (activeChat && activeChat.type === 'private' && activeChat.user.id === readerId) {
      document.querySelectorAll('.msg-row.own .msg-read-checks').forEach(el => {
        if (el.dataset.read !== '1' && typeof getRoundedCheckSvg === 'function') {
          el.dataset.read = '1';
          el.innerHTML = getRoundedCheckSvg(true);
        }
      });
      document.querySelectorAll('.msg-row.own .msg-media-time-pill').forEach(el => {
        if (el.dataset.time && typeof getRoundedCheckSvg === 'function') {
          el.innerHTML = `<span>${el.dataset.time}</span>${getRoundedCheckSvg(true)}`;
        }
      });
    }
  });

  socket.on('message_edited', async ({ msgId, newText }) => {
    for (const d of Object.values(dialogs)) {
      const found = d.messages.find(m => m.msgId === msgId);
      if (found) {
        found.text = typeof decryptMessageText === 'function'
          ? await decryptMessageText(newText, 'private', currentUser.id, d.user.id)
          : newText;
        found.isEdited = true;
      }
    }
    if (activeChat && activeChat.type === 'private') renderMessages();
    renderSidebarDialogs();
  });

  socket.on('message_deleted', ({ msgId }) => {
    Object.values(dialogs).forEach(d => {
      d.messages = d.messages.filter(m => m.msgId !== msgId);
    });
    if (typeof animateAndRemoveMessageRow === 'function') animateAndRemoveMessageRow(msgId);
    renderSidebarDialogs();
  });

  socket.on('chat_deleted', ({ partnerId }) => {
    if (typeof removeDialogLocally === 'function') removeDialogLocally(partnerId);
  });

  let typingTimeout = null;
  let isCurrentlyTyping = false;
  const messageInput = document.getElementById('input');

  messageInput.addEventListener('input', () => {
    if (!activeChat || activeChat.type !== 'private') return;
    if (!isCurrentlyTyping) {
      isCurrentlyTyping = true;
      socket.emit('typing_activity', { senderId: currentUser.id, recipientId: activeChat.user.id, activity: 'typing' });
    }
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      isCurrentlyTyping = false;
      socket.emit('typing_activity', { senderId: currentUser.id, recipientId: activeChat.user.id, activity: null });
    }, 1800);
  });

  const chatForm = document.getElementById('form');
  if (chatForm) {
    chatForm.addEventListener('submit', () => {
      isCurrentlyTyping = false;
      clearTimeout(typingTimeout);
    });
  }
}
