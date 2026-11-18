(function initMultiSelectUI() {
  const style = document.createElement('style');
  style.textContent = `
    .selection-toolbar {
      display: none;
      align-items: center;
      justify-content: space-between;
      padding: 12px 24px;
      background: #1c1c1e;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.55);
      z-index: 25;
      animation: smoothMsgFadeIn 0.16s ease-out;
    }
    .selection-toolbar.active { display: flex; }

    .selection-left { display: flex; align-items: center; gap: 14px; }
    .selection-count { font-size: 15px; font-weight: 600; color: #f5f5f7; }

    .selection-actions { display: flex; gap: 10px; }
    .sel-action-btn {
      padding: 8px 16px;
      border-radius: 10px;
      border: none;
      font-size: 13.5px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: transform 0.1s, background-color 0.2s, color 0.2s;
    }
    .sel-action-btn:active { transform: scale(0.96); }
    .sel-action-btn.forward {
      background: var(--accent, #65C466);
      color: var(--accent-dark-text, #0a180a);
    }
    .sel-action-btn.delete { background: rgba(255, 69, 58, 0.16); color: #ff453a; }
    .sel-action-btn.delete:hover { background: #ff453a; color: #fff; }

    .msg-row {
      position: relative;
      transition: background-color 0.15s;
      border-radius: 12px;
      padding: 2px 6px;
    }
    .messages.select-mode .msg-row { cursor: pointer; }
    .messages.select-mode .msg-row:hover { background: rgba(255, 255, 255, 0.04); }
    .msg-row.selected { background: rgba(255, 255, 255, 0.08) !important; }

    .msg-select-checkbox {
      display: none;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 2px solid #8e8e93;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      align-self: center;
      margin-right: 6px;
      transition: all 0.15s;
    }
    .messages.select-mode .msg-select-checkbox { display: flex; }
    .msg-row.selected .msg-select-checkbox {
      background: var(--accent, #65C466);
      border-color: var(--accent, #65C466);
      color: var(--accent-dark-text, #0a180a);
    }
  `;
  document.head.appendChild(style);
})();

let isSelectModeActive = false;
const selectedMessagesMap = new Map();

function enterSelectMode(initialMsg = null) {
  isSelectModeActive = true;
  selectedMessagesMap.clear();

  document.getElementById('messages').classList.add('select-mode');
  document.getElementById('chatHeader').style.display = 'none';
  document.getElementById('selectionToolbar').classList.add('active');

  if (initialMsg && initialMsg.msgId) {
    toggleMessageSelection(initialMsg);
  } else {
    updateSelectionToolbarUI();
  }
}

function exitSelectMode() {
  isSelectModeActive = false;
  selectedMessagesMap.clear();

  const messagesBox = document.getElementById('messages');
  if (messagesBox) messagesBox.classList.remove('select-mode');

  document.querySelectorAll('.msg-row.selected').forEach(el => el.classList.remove('selected'));

  const toolbar = document.getElementById('selectionToolbar');
  if (toolbar) toolbar.classList.remove('active');

  const header = document.getElementById('chatHeader');
  if (header) header.style.display = 'flex';
}

function toggleMessageSelection(msgData) {
  if (!msgData || !msgData.msgId) return;
  const row = document.querySelector(`.msg-row[data-msg-id="${msgData.msgId}"]`);

  if (selectedMessagesMap.has(msgData.msgId)) {
    selectedMessagesMap.delete(msgData.msgId);
    if (row) row.classList.remove('selected');
  } else {
    selectedMessagesMap.set(msgData.msgId, msgData);
    if (row) row.classList.add('selected');
  }

  if (selectedMessagesMap.size === 0) {
    exitSelectMode();
  } else {
    updateSelectionToolbarUI();
  }
}

function updateSelectionToolbarUI() {
  const count = selectedMessagesMap.size;
  document.getElementById('selectionCountText').textContent = `Выбрано: ${count}`;
  document.getElementById('bulkForwardBtn').textContent = `Переслать (${count})`;
  document.getElementById('bulkDeleteBtn').textContent = `Удалить (${count})`;
}

function getSelectedMessagesList() {
  return Array.from(selectedMessagesMap.values());
}
