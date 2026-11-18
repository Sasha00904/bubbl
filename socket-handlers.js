const { onlineUsers, lastSeenMap, isUserBlocked } = require('./storage');
const { getGroupById } = require('./groups-storage');

function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    let authenticatedUserId = null;

    socket.on('register_socket', (userId) => {
      if (!userId || typeof userId !== 'string') return;
      authenticatedUserId = userId;
      socket.join(userId);

      if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
      onlineUsers.get(userId).add(socket.id);

      io.emit('user_presence', { userId, online: true, lastSeen: null });
    });

    socket.on('typing_activity', (payload) => {
      if (!authenticatedUserId || payload.senderId !== authenticatedUserId) return;
      if (isUserBlocked(authenticatedUserId, payload.recipientId) || isUserBlocked(payload.recipientId, authenticatedUserId)) {
        return;
      }
      io.to(payload.recipientId).emit('typing_activity', {
        senderId: authenticatedUserId,
        activity: payload.activity
      });
    });

    socket.on('private_message', (data) => {
      if (!authenticatedUserId || !data || !data.sender || data.sender.id !== authenticatedUserId) return;
      const recipientId = data.recipient && data.recipient.id;
      if (!recipientId) return;

      if (isUserBlocked(authenticatedUserId, recipientId) || isUserBlocked(recipientId, authenticatedUserId)) {
        io.to(authenticatedUserId).emit('message_blocked_error', { recipientId });
        return;
      }

      const msgPayload = {
        msgId: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        sender: data.sender,
        recipient: data.recipient,
        text: data.text || '',
        mediaUrl: data.mediaUrl || null,
        mediaType: data.mediaType || null,
        replyTo: data.replyTo || null,
        forwardedFrom: data.forwardedFrom || null,
        isRead: false,
        isEdited: false,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      io.to(recipientId).emit('private_message', msgPayload);
      io.to(authenticatedUserId).emit('private_message', msgPayload);
    });

    socket.on('group_message', (data) => {
      if (!authenticatedUserId || !data || !data.sender || data.sender.id !== authenticatedUserId) return;
      const grp = getGroupById(data.groupId);
      if (!grp || !grp.memberIds.includes(authenticatedUserId)) return;

      const msgPayload = {
        msgId: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        groupId: grp.id,
        sender: data.sender,
        text: data.text || '',
        mediaUrl: data.mediaUrl || null,
        mediaType: data.mediaType || null,
        replyTo: data.replyTo || null,
        forwardedFrom: data.forwardedFrom || null,
        isRead: true,
        isEdited: false,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      grp.memberIds.forEach(memberId => {
        io.to(memberId).emit('group_message', msgPayload);
      });
    });

    socket.on('group_edit_message', (payload) => {
      if (!authenticatedUserId || !payload) return;
      const grp = getGroupById(payload.groupId);
      if (!grp || !grp.memberIds.includes(authenticatedUserId)) return;

      grp.memberIds.forEach(memberId => {
        io.to(memberId).emit('group_message_edited', {
          groupId: grp.id,
          msgId: payload.msgId,
          newText: payload.newText
        });
      });
    });

    socket.on('group_delete_message', (payload) => {
      if (!authenticatedUserId || !payload) return;
      const grp = getGroupById(payload.groupId);
      if (!grp || !grp.memberIds.includes(authenticatedUserId)) return;

      grp.memberIds.forEach(memberId => {
        io.to(memberId).emit('group_message_deleted', {
          groupId: grp.id,
          msgId: payload.msgId
        });
      });
    });

    socket.on('notify_group_sync', ({ group, extraUserIds, systemEvent }) => {
      if (!authenticatedUserId || !group) return;
      const targets = new Set([...(group.memberIds || new Array()), ...(extraUserIds || new Array())]);
      targets.forEach(uid => {
        io.to(uid).emit('group_synced', { group, systemEvent: systemEvent || null });
      });
    });

    socket.on('edit_message', (payload) => {
      if (!authenticatedUserId || payload.senderId !== authenticatedUserId) return;
      io.to(authenticatedUserId).emit('message_edited', {
        msgId: payload.msgId,
        newText: payload.newText
      });
      io.to(payload.recipientId).emit('message_edited', {
        msgId: payload.msgId,
        newText: payload.newText
      });
    });

    socket.on('mark_read', (payload) => {
      if (!authenticatedUserId || payload.readerId !== authenticatedUserId) return;
      io.to(payload.senderId).emit('messages_read', { readerId: authenticatedUserId });
    });

    socket.on('delete_message_everyone', (payload) => {
      if (!authenticatedUserId || payload.senderId !== authenticatedUserId) return;
      io.to(authenticatedUserId).emit('message_deleted', { msgId: payload.msgId });
      if (payload.recipientId) {
        io.to(payload.recipientId).emit('message_deleted', { msgId: payload.msgId });
      }
    });

    socket.on('delete_chat_everyone', (payload) => {
      if (!authenticatedUserId || payload.senderId !== authenticatedUserId) return;
      io.to(authenticatedUserId).emit('chat_deleted', { partnerId: payload.recipientId });
      io.to(payload.recipientId).emit('chat_deleted', { partnerId: authenticatedUserId });
    });

    socket.on('blacklist_changed', (payload) => {
      if (!authenticatedUserId || payload.ownerId !== authenticatedUserId) return;
      io.to(authenticatedUserId).emit('blacklist_updated', { partnerId: payload.targetId });
      io.to(payload.targetId).emit('blacklist_updated', { partnerId: authenticatedUserId });
    });

    socket.on('disconnect', () => {
      if (authenticatedUserId && onlineUsers.has(authenticatedUserId)) {
        const set = onlineUsers.get(authenticatedUserId);
        set.delete(socket.id);
        if (set.size === 0) {
          onlineUsers.delete(authenticatedUserId);
          const now = Date.now();
          lastSeenMap.set(authenticatedUserId, now);
          io.emit('user_presence', { userId: authenticatedUserId, online: false, lastSeen: now });
        }
      }
    });
  });
}

module.exports = { setupSocketHandlers };
