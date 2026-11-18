function animateAndRemoveMessageRow(msgId) {
  const row = document.querySelector(`.msg-row[data-msg-id="${msgId}"]`);
  if (!row || row.classList.contains('deleting')) return;
  row.classList.add('deleting');
  setTimeout(() => row.remove(), 185);
}

function setReplyState(msgData) {
  clearInputBarModes();
  const thumbUrl = msgData.mediaType === 'image' ? msgData.mediaUrl : null;
  replyingToMessage = {
    msgId: msgData.msgId || null,
    senderName: msgData.sender.firstName,
    previewText: getPreviewLabel(msgData) || 'Сообщение',
    thumbUrl
  };

  document.getElementById('replyAuthorLabel').textContent = `Ответ для ${replyingToMessage.senderName}`;
  document.getElementById('replyTextLabel').textContent = replyingToMessage.previewText;

  const thumbEl = document.getElementById('replyBarThumb');
  if (thumbUrl) {
    thumbEl.src = thumbUrl;
    thumbEl.style.display = 'block';
  } else {
    thumbEl.style.display = 'none';
  }

  document.getElementById('replyPreviewBar').classList.add('active');
  document.getElementById('input').focus();
}

function setEditState(msgData) {
  clearInputBarModes();
  editingMessageData = msgData;

  document.getElementById('replyAuthorLabel').textContent = 'Редактирование сообщения';
  document.getElementById('replyTextLabel').textContent = msgData.text;
  document.getElementById('replyBarThumb').style.display = 'none';
  document.getElementById('replyPreviewBar').classList.add('active');

  const input = document.getElementById('input');
  input.value = msgData.text;
  input.focus();
}

function clearInputBarModes() {
  replyingToMessage = null;
  if (editingMessageData) {
    document.getElementById('input').value = '';
    editingMessageData = null;
  }
  document.getElementById('replyPreviewBar').classList.remove('active');
}

async function sendChatPayload({ text, mediaUrl = null, mediaType = null, forwardedFrom = null }) {
  if (!activeChat) return;

  if (editingMessageData && text) {
    if (activeChat.type === 'saved') {
      const key = `saved_messages_${currentUser.id}`;
      const list = JSON.parse(localStorage.getItem(key)) || new Array();
      const found = list.find(m => m.msgId === editingMessageData.msgId);
      if (found) {
        found.text = text;
        found.isEdited = true;
        localStorage.setItem(key, JSON.stringify(list));
      }
      clearInputBarModes();
      renderMessages();
    } else if (activeChat.type === 'private') {
      const encryptedNewText = typeof encryptMessageText === 'function'
        ? await encryptMessageText(text, 'private', currentUser.id, activeChat.user.id)
        : text;
      socket.emit('edit_message', {
        msgId: editingMessageData.msgId,
        newText: encryptedNewText,
        senderId: currentUser.id,
        recipientId: activeChat.user.id
      });
      clearInputBarModes();
    } else if (activeChat.type === 'group') {
      const encryptedNewText = typeof encryptMessageText === 'function'
        ? await encryptMessageText(text, 'group', activeChat.group.id)
        : text;
      socket.emit('group_edit_message', {
        groupId: activeChat.group.id,
        msgId: editingMessageData.msgId,
        newText: encryptedNewText
      });
      clearInputBarModes();
    }
    return;
  }

  if (activeChat.type === 'saved') {
    const msg = {
      msgId: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      sender: currentUser,
      text,
      mediaUrl,
      mediaType,
      replyTo: replyingToMessage,
      forwardedFrom,
      isRead: true,
      isEdited: false,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    if (typeof addSavedMessage === 'function') addSavedMessage(currentUser.id, msg);
    clearInputBarModes();
    appendMessageElement(msg, currentUser, getMessageCallbacks());
  } else if (activeChat.type === 'private') {
    const encryptedText = typeof encryptMessageText === 'function'
      ? await encryptMessageText(text, 'private', currentUser.id, activeChat.user.id)
      : text;
    socket.emit('typing_activity', { senderId: currentUser.id, recipientId: activeChat.user.id, activity: null });
    socket.emit('private_message', {
      sender: currentUser,
      recipient: activeChat.user,
      text: encryptedText,
      mediaUrl,
      mediaType,
      replyTo: replyingToMessage,
      forwardedFrom
    });
    clearInputBarModes();
  } else if (activeChat.type === 'group') {
    const encryptedText = typeof encryptMessageText === 'function'
      ? await encryptMessageText(text, 'group', activeChat.group.id)
      : text;
    socket.emit('group_message', {
      groupId: activeChat.group.id,
      sender: currentUser,
      text: encryptedText,
      mediaUrl,
      mediaType,
      replyTo: replyingToMessage,
      forwardedFrom
    });
    clearInputBarModes();
  }
}

function deleteMessagesForEveryone(msgsArray) {
  if (!activeChat || !msgsArray || msgsArray.length === 0) return;

  if (activeChat.type === 'saved') {
    const key = `saved_messages_${currentUser.id}`;
    const idsToDelete = new Set(msgsArray.map(m => m.msgId));
    const list = (JSON.parse(localStorage.getItem(key)) || new Array()).filter(m => !idsToDelete.has(m.msgId));
    localStorage.setItem(key, JSON.stringify(list));
    msgsArray.forEach(m => animateAndRemoveMessageRow(m.msgId));
  } else if (activeChat.type === 'private') {
    msgsArray.forEach(m => {
      socket.emit('delete_message_everyone', {
        msgId: m.msgId,
        senderId: currentUser.id,
        recipientId: activeChat.user.id
      });
    });
  } else if (activeChat.type === 'group') {
    msgsArray.forEach(m => {
      socket.emit('group_delete_message', {
        groupId: activeChat.group.id,
        msgId: m.msgId
      });
    });
  }
  if (typeof exitSelectMode === 'function') exitSelectMode();
}

function forwardMessagesBatch(messagesArray) {
  if (!messagesArray || messagesArray.length === 0) return;
  if (typeof openForwardModal === 'function') {
    openForwardModal(messagesArray, dialogs, async (target, msgsList) => {
      if (typeof exitSelectMode === 'function') exitSelectMode();
      if (target.type === 'saved') openSavedChat();
      else openPrivateChat(target.user);

      for (const originalMsg of msgsList) {
        const senderTag = `${originalMsg.sender.firstName} (${originalMsg.sender.username})`;
        await sendChatPayload({
          text: originalMsg.text,
          mediaUrl: originalMsg.mediaUrl,
          mediaType: originalMsg.mediaType,
          forwardedFrom: senderTag
        });
      }
    });
  }
}
