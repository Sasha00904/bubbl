const groups = new Array();

function createGroup({ name, description, avatarUrl, creatorUser, memberUsers }) {
  const profilesMap = new Map();
  if (creatorUser && creatorUser.id) {
    profilesMap.set(creatorUser.id, creatorUser);
  }
  (memberUsers || new Array()).forEach(u => {
    if (u && u.id) profilesMap.set(u.id, u);
  });

  const memberIds = Array.from(profilesMap.keys());
  const newGroup = {
    id: `grp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: name.trim(),
    description: description ? description.trim() : '',
    avatarUrl: avatarUrl || null,
    creatorId: creatorUser.id,
    adminIds: new Array(creatorUser.id),
    memberIds,
    memberProfiles: Object.fromEntries(profilesMap),
    createdAt: Date.now()
  };
  groups.push(newGroup);
  return newGroup;
}

function getGroupById(groupId) {
  return groups.find(g => g.id === groupId) || null;
}

function getUserGroups(userId) {
  return groups.filter(g => g.memberIds.includes(userId));
}

function isGroupAdmin(group, userId) {
  return group && (group.creatorId === userId || group.adminIds.includes(userId));
}

function updateGroupInfo(groupId, { name, description, avatarUrl }) {
  const group = getGroupById(groupId);
  if (!group) return null;
  if (name && name.trim()) group.name = name.trim();
  if (typeof description === 'string') group.description = description.trim();
  if (avatarUrl) group.avatarUrl = avatarUrl;
  return group;
}

function addGroupMembers(groupId, newMembersArray) {
  const group = getGroupById(groupId);
  if (!group) return null;
  (newMembersArray || new Array()).forEach(u => {
    if (u && u.id) {
      if (!group.memberIds.includes(u.id)) group.memberIds.push(u.id);
      Reflect.set(group.memberProfiles, u.id, u);
    }
  });
  return group;
}

function removeGroupMember(groupId, targetUserId) {
  const group = getGroupById(groupId);
  if (!group || group.creatorId === targetUserId) return group;
  group.memberIds = group.memberIds.filter(id => id !== targetUserId);
  group.adminIds = group.adminIds.filter(id => id !== targetUserId);
  Reflect.deleteProperty(group.memberProfiles, targetUserId);
  return group;
}

function toggleGroupAdmin(groupId, targetUserId, makeAdmin) {
  const group = getGroupById(groupId);
  if (!group || group.creatorId === targetUserId) return group;
  if (makeAdmin) {
    if (!group.adminIds.includes(targetUserId)) group.adminIds.push(targetUserId);
  } else {
    group.adminIds = group.adminIds.filter(id => id !== targetUserId);
  }
  return group;
}

module.exports = {
  groups,
  createGroup,
  getGroupById,
  getUserGroups,
  isGroupAdmin,
  updateGroupInfo,
  addGroupMembers,
  removeGroupMember,
  toggleGroupAdmin
};
