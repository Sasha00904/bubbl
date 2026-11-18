let currentUser = JSON.parse(localStorage.getItem('currentUser'));
if (!currentUser) window.location.href = '/login.html';

const socket = io();
const dialogs = {};
const groupsMap = {};
const presenceMap = {};
let activeChat = null;
let replyingToMessage = null;
let editingMessageData = null;

async function syncUserGroupsFromServer() {
  if (!currentUser) return;
  try {
    const res = await fetch(`/api/groups/user/${currentUser.id}`);
    const list = await res.json();
    list.forEach(g => {
      if (!groupsMap[g.id]) {
        groupsMap[g.id] = { group: g, messages: new Array(), unread: 0, pinned: false };
      } else {
        groupsMap[g.id].group = g;
      }
    });
    renderSidebarDialogs();
  } catch (e) {}
}

socket.on('connect', () => {
  if (currentUser) {
    socket.emit('register_socket', currentUser.id);
    if (typeof loadMyBlacklist === 'function') loadMyBlacklist(currentUser.id);
    syncUserGroupsFromServer();
  }
});

renderMySidebarProfile();
initChatSockets(socket);

if (typeof initUserSearch === 'function') {
  initUserSearch(currentUser, (foundUser) => {
    if (!dialogs[foundUser.id]) {
      dialogs[foundUser.id] = { user: foundUser, messages: new Array(), unread: 0, pinned: false };
      renderSidebarDialogs();
    }
    openPrivateChat(foundUser);
  });
}

if (typeof initMediaAndVoice === 'function') {
  initMediaAndVoice((mediaUrl, mediaType, captionText = '') => {
    sendChatPayload({ text: captionText, mediaUrl, mediaType });
  });
}

document.getElementById('cancelReplyBtn').onclick = clearInputBarModes;

document.getElementById('form').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = document.getElementById('input');
  const text = input.value.trim();
  if (!text) return;
  sendChatPayload({ text });
  input.value = '';
});

document.getElementById('cancelSelectBtn').onclick = () => {
  if (typeof exitSelectMode === 'function') exitSelectMode();
};

document.getElementById('bulkForwardBtn').onclick = () => {
  if (typeof getSelectedMessagesList === 'function') forwardMessagesBatch(getSelectedMessagesList());
};

document.getElementById('bulkDeleteBtn').onclick = () => {
  if (typeof getSelectedMessagesList === 'function') deleteMessagesForEveryone(getSelectedMessagesList());
};

function getMessageCallbacks() {
  return {
    onReply: (msgData) => setReplyState(msgData),
    onEdit: (msgData) => setEditState(msgData),
    onForward: (msgData) => forwardMessagesBatch(new Array(msgData)),
    onSelect: (msgData) => {
      if (typeof enterSelectMode === 'function') enterSelectMode(msgData);
    },
    onDelete: (msgData) => deleteMessagesForEveryone(new Array(msgData))
  };
}

function renderMessages() {
  if (typeof exitSelectMode === 'function') exitSelectMode();
  const messagesBox = document.getElementById('messages');
  messagesBox.innerHTML = '';
  if (!activeChat) return;

  let list = new Array();
  if (activeChat.type === 'saved') {
    list = typeof getSavedMessages === 'function' ? getSavedMessages(currentUser.id) : new Array();
  } else if (activeChat.type === 'private') {
    list = dialogs[activeChat.user.id]?.messages || new Array();
  } else if (activeChat.type === 'group') {
    list = groupsMap[activeChat.group.id]?.messages || new Array();
  }

  list.forEach(msg => {
    if (msg.isSystem && typeof appendGroupSystemPill === 'function') {
      appendGroupSystemPill(msg.text);
    } else {
      appendMessageElement(msg, currentUser, getMessageCallbacks());
    }
  });
}
