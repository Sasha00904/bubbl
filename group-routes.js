const { users, onlineUsers } = require('./storage');
const {
  groups,
  createGroup,
  getGroupById,
  getUserGroups,
  isGroupAdmin,
  updateGroupInfo,
  addGroupMembers,
  removeGroupMember,
  toggleGroupAdmin
} = require('./groups-storage');

function hydrateGroupMembers(group) {
  if (!group) return null;
  const members = group.memberIds.map(id => {
    const liveUser = users.find(u => u.id === id);
    const savedProfile = Reflect.get(group.memberProfiles || {}, id);
    const base = liveUser || savedProfile || {
      id,
      firstName: 'Пользователь',
      lastName: '',
      username: '@user',
      avatarUrl: null
    };
    const isOnline = onlineUsers.has(id) && onlineUsers.get(id).size > 0;
    return {
      id: base.id,
      firstName: base.firstName,
      lastName: base.lastName || '',
      username: base.username,
      avatarUrl: base.avatarUrl || null,
      online: isOnline,
      isCreator: base.id === group.creatorId,
      isAdmin: group.adminIds.includes(base.id)
    };
  });
  return { ...group, members };
}

function setupGroupRoutes(app, upload) {
  app.get('/api/groups/user/:userId', (req, res) => {
    const list = getUserGroups(req.params.userId).map(hydrateGroupMembers);
    res.json(list);
  });

  app.get('/api/groups/:groupId', (req, res) => {
    const grp = getGroupById(req.params.groupId);
    if (!grp) return res.status(404).json({ error: 'Группа не найдена' });
    res.json(hydrateGroupMembers(grp));
  });

  app.post('/api/groups/create', upload.single('avatar'), (req, res) => {
    const { name, description, creatorUser, memberUsers } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Введите название группы' });

    let parsedCreator = null;
    let parsedMembers = new Array();
    try {
      parsedCreator = JSON.parse(creatorUser);
      parsedMembers = memberUsers ? JSON.parse(memberUsers) : new Array();
    } catch (e) {}

    if (!parsedCreator || !parsedCreator.id) {
      return res.status(400).json({ error: 'Не передан создатель группы' });
    }

    const avatarUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const created = createGroup({
      name,
      description,
      avatarUrl,
      creatorUser: parsedCreator,
      memberUsers: parsedMembers
    });
    res.json({ success: true, group: hydrateGroupMembers(created) });
  });

  app.post('/api/groups/:groupId/update', upload.single('avatar'), (req, res) => {
    const { actorId, name, description } = req.body;
    const grp = getGroupById(req.params.groupId);
    if (!grp) return res.status(404).json({ error: 'Группа не найдена' });
    if (!isGroupAdmin(grp, actorId)) return res.status(403).json({ error: 'Нет прав администратора' });

    const avatarUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const updated = updateGroupInfo(grp.id, { name, description, avatarUrl });
    res.json({ success: true, group: hydrateGroupMembers(updated) });
  });

  app.post('/api/groups/:groupId/members/add', (req, res) => {
    const { actorId, memberUsers } = req.body;
    const grp = getGroupById(req.params.groupId);
    if (!grp) return res.status(404).json({ error: 'Группа не найдена' });
    if (!isGroupAdmin(grp, actorId)) return res.status(403).json({ error: 'Только админы могут добавлять участников' });

    const updated = addGroupMembers(grp.id, memberUsers || new Array());
    res.json({ success: true, group: hydrateGroupMembers(updated) });
  });

  app.post('/api/groups/:groupId/members/remove', (req, res) => {
    const { actorId, targetUserId } = req.body;
    const grp = getGroupById(req.params.groupId);
    if (!grp) return res.status(404).json({ error: 'Группа не найдена' });
    if (actorId !== targetUserId && !isGroupAdmin(grp, actorId)) {
      return res.status(403).json({ error: 'Нет прав' });
    }

    const updated = removeGroupMember(grp.id, targetUserId);
    res.json({ success: true, group: hydrateGroupMembers(updated) });
  });

  app.post('/api/groups/:groupId/admins', (req, res) => {
    const { actorId, targetUserId, makeAdmin } = req.body;
    const grp = getGroupById(req.params.groupId);
    if (!grp) return res.status(404).json({ error: 'Группа не найдена' });
    if (!isGroupAdmin(grp, actorId)) return res.status(403).json({ error: 'Нет прав администратора' });

    const updated = toggleGroupAdmin(grp.id, targetUserId, Boolean(makeAdmin));
    res.json({ success: true, group: hydrateGroupMembers(updated) });
  });

  app.post('/api/groups/:groupId/delete', (req, res) => {
    const { actorId } = req.body;
    const idx = groups.findIndex(g => g.id === req.params.groupId);
    if (idx === -1) return res.status(404).json({ error: 'Группа не найдена' });
    if (groups.at(idx).creatorId !== actorId) return res.status(403).json({ error: 'Только создатель может удалить группу' });

    const deletedGroup = groups.at(idx);
    groups.splice(idx, 1);
    res.json({ success: true, deletedGroup });
  });
}

module.exports = { setupGroupRoutes };
