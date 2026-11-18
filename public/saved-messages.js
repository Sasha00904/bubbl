function getSavedKey(userId) {
  return `saved_messages_${userId}`;
}

function getSavedMessages(userId) {
  return JSON.parse(localStorage.getItem(getSavedKey(userId))) || [];
}

function addSavedMessage(userId, msgObj) {
  const list = getSavedMessages(userId);
  list.push(msgObj);
  localStorage.setItem(getSavedKey(userId), JSON.stringify(list));
}
