const users = new Array();
const onlineUsers = new Map();
const lastSeenMap = new Map();
const blockedUsersMap = new Map(); // userId -> Set of blockedUserIds

function getBlockedSet(userId) {
  if (!blockedUsersMap.has(userId)) {
    blockedUsersMap.set(userId, new Set());
  }
  return blockedUsersMap.get(userId);
}

function isUserBlocked(ownerId, targetId) {
  return getBlockedSet(ownerId).has(targetId);
}

function blockUser(ownerId, targetId) {
  getBlockedSet(ownerId).add(targetId);
}

function unblockUser(ownerId, targetId) {
  getBlockedSet(ownerId).delete(targetId);
}

function getBlockedUsersList(ownerId) {
  const blockedIds = Array.from(getBlockedSet(ownerId));
  return blockedIds
    .map(id => users.find(u => u.id === id))
    .filter(Boolean)
    .map(({ password, login, ...safeUser }) => safeUser);
}

module.exports = {
  users,
  onlineUsers,
  lastSeenMap,
  isUserBlocked,
  blockUser,
  unblockUser,
  getBlockedUsersList
};
