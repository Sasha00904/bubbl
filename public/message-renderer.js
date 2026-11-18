function getRoundedCheckSvg(isRead) {
  if (isRead) {
    return `<svg width="17" height="12" viewBox="0 0 20 14" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 7.5L5.5 11.5L13.5 3"></path><path d="M8.5 11.5L10 13L18.5 3"></path></svg>`;
  }
  return `<svg width="14" height="12" viewBox="0 0 16 14" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M2 7.5L6 11.5L14 3"></path></svg>`;
}

function appendMessageElement(msg, currentUser, callbacks = {}) {
  const messagesBox = document.getElementById('messages');
  if (!messagesBox) return;

  const isOwn = msg.sender && msg.sender.id === currentUser.id;
  const isGroupChat = typeof activeChat !== 'undefined' && activeChat && activeChat.type === 'group';

  const row = document.createElement('div');
  row.className = `msg-row ${isOwn ? 'own' : 'other'}`;
  if (msg.msgId) row.dataset.msgId = msg.msgId;

  const selectCircle = document.createElement('div');
  selectCircle.className = 'msg-select-circle';
  selectCircle.innerHTML = '✓';
  row.appendChild(selectCircle);

  if (!isOwn && msg.sender) {
    const av = document.createElement('div');
    av.className = 'msg-avatar';
    av.title = `${msg.sender.firstName} (@${msg.sender.username.replace(/^@/, '')})`;
    av.innerHTML = msg.sender.avatarUrl
      ? `<img src="${msg.sender.avatarUrl}">`
      : msg.sender.firstName.at(0).toUpperCase();
    av.onclick = (e) => {
      e.stopPropagation();
      if (typeof openProfileModal === 'function') openProfileModal(msg.sender, false);
    };
    row.appendChild(av);
  }

  const bubble = document.createElement('div');
  bubble.className = 'msg';

  // В группе показываем имя отправителя сверху чужого сообщения
  if (!isOwn && isGroupChat && msg.sender) {
    const authorTag = document.createElement('div');
    authorTag.style.fontSize = '12px';
    authorTag.style.fontWeight = '600';
    authorTag.style.color = 'var(--accent, #65C466)';
    authorTag.style.marginBottom = '3px';
    authorTag.style.cursor = 'pointer';
    authorTag.textContent = `${msg.sender.firstName} ${msg.sender.lastName || ''}`.trim();
    authorTag.onclick = (e) => {
      e.stopPropagation();
      if (typeof openProfileModal === 'function') openProfileModal(msg.sender, false);
    };
    bubble.appendChild(authorTag);
  }

  if (msg.forwardedFrom) {
    const fwdHeader = document.createElement('div');
    fwdHeader.className = 'msg-forwarded-header';
    fwdHeader.textContent = `Переслано от ${msg.forwardedFrom}`;
    bubble.appendChild(fwdHeader);
  }

  if (msg.replyTo) {
    const quoteBox = document.createElement('div');
    quoteBox.className = 'msg-reply-quote';
    if (msg.replyTo.thumbUrl) {
      const thumbImg = document.createElement('img');
      thumbImg.className = 'msg-reply-quote-thumb';
      thumbImg.src = msg.replyTo.thumbUrl;
      quoteBox.appendChild(thumbImg);
    }
    const textWrap = document.createElement('div');
    textWrap.className = 'msg-reply-quote-texts';
    textWrap.innerHTML = `
      <span class="msg-reply-quote-author">${msg.replyTo.senderName}</span>
      <span class="msg-reply-quote-text">${msg.replyTo.previewText}</span>
    `;
    quoteBox.appendChild(textWrap);
    if (msg.replyTo.msgId) {
      quoteBox.onclick = (e) => {
        e.stopPropagation();
        if (typeof scrollToAndHighlightMessage === 'function') {
          scrollToAndHighlightMessage(msg.replyTo.msgId);
        }
      };
    }
    bubble.appendChild(quoteBox);
  }

  const isVisualMediaOnly = (msg.mediaType === 'image' || msg.mediaType === 'video') && !msg.text;

  if (msg.mediaUrl) {
    if (isVisualMediaOnly) bubble.classList.add('media-only');

    if (msg.mediaType === 'image') {
      const imgWrap = document.createElement('div');
      imgWrap.className = 'msg-media-wrap';
      const img = document.createElement('img');
      img.src = msg.mediaUrl;
      img.className = 'msg-media-img';
      img.onclick = () => {
        if (typeof openMediaLightbox === 'function') openMediaLightbox(msg.mediaUrl, 'image');
      };
      imgWrap.appendChild(img);

      if (isVisualMediaOnly) {
        const pill = document.createElement('span');
        pill.className = 'msg-media-time-pill';
        pill.dataset.time = msg.time;
        pill.innerHTML = `<span>${msg.time}</span>${isOwn ? getRoundedCheckSvg(Boolean(msg.isRead)) : ''}`;
        imgWrap.appendChild(pill);
      }
      bubble.appendChild(imgWrap);
    } else if (msg.mediaType === 'video') {
      const vidWrap = document.createElement('div');
      vidWrap.className = 'msg-media-wrap';
      const vid = document.createElement('video');
      vid.src = msg.mediaUrl;
      vid.controls = true;
      vid.className = 'msg-media-video';
      vidWrap.appendChild(vid);

      if (isVisualMediaOnly) {
        const pill = document.createElement('span');
        pill.className = 'msg-media-time-pill';
        pill.dataset.time = msg.time;
        pill.innerHTML = `<span>${msg.time}</span>${isOwn ? getRoundedCheckSvg(Boolean(msg.isRead)) : ''}`;
        vidWrap.appendChild(pill);
      }
      bubble.appendChild(vidWrap);
    } else if (msg.mediaType === 'audio') {
      if (typeof createCustomVoicePlayer === 'function') {
        bubble.appendChild(createCustomVoicePlayer(msg.mediaUrl, isOwn));
      } else {
        const aud = document.createElement('audio');
        aud.src = msg.mediaUrl;
        aud.controls = true;
        bubble.appendChild(aud);
      }
    }
  }

  if (msg.text) {
    const textEl = document.createElement('div');
    textEl.className = 'msg-text';
    textEl.textContent = msg.text;
    bubble.appendChild(textEl);
  }

  if (!isVisualMediaOnly) {
    const footerEl = document.createElement('div');
    footerEl.className = 'msg-footer';

    const editedBadgeHtml = msg.isEdited ? `<span class="msg-edited-label">изменено</span>` : '';
    const checksHtml = isOwn
      ? `<span class="msg-read-checks" data-read="${msg.isRead ? '1' : '0'}">${getRoundedCheckSvg(Boolean(msg.isRead))}</span>`
      : '';

    footerEl.innerHTML = `${editedBadgeHtml}<span>${msg.time}</span>${checksHtml}`;
    bubble.appendChild(footerEl);
  }

  row.appendChild(bubble);

  row.addEventListener('click', (e) => {
    if (typeof isSelectionMode !== 'undefined' && isSelectionMode) {
      e.preventDefault();
      e.stopPropagation();
      if (typeof toggleMessageSelection === 'function') toggleMessageSelection(msg, row);
    }
  });

  row.addEventListener('contextmenu', (e) => {
    if (typeof showMessageContextMenu === 'function') {
      showMessageContextMenu(e, msg, isOwn, callbacks);
    }
  });

  messagesBox.appendChild(row);
  messagesBox.scrollTop = messagesBox.scrollHeight;
}
