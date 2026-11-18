const groupsStorage = require('./groups-storage');

const groupsList = groupsStorage.groups || new Array();

function setupGroupRoutes(app, upload) {
  app.get('/api/groups/user/:userId', (req, res) => {
    const uid = req.params.userId;
    const userGroups = groupsList.filter(g => Array.isArray(g.memberIds) && g.memberIds.includes(uid));
    res.json(userGroups);
  });

  app.get('/api/groups/:groupId', (req, res) => {
    const grp = typeof groupsStorage.getGroupById === 'function'
      ? groupsStorage.getGroupById(req.params.groupId)
      : groupsList.find(g => g.id === req.params.groupId);

    if (!grp) return res.status(404).json({ error: 'Группа не найдена' });
    res.json(grp);
  });

  app.post('/api/groups', upload.single('avatar'), (req, res) => {
    const { name, creatorId, memberIds } = req.body;
    let parsedMembers = new Array();
    try {
      parsedMembers = typeof memberIds === 'string' ? JSON.parse(memberIds) : (memberIds || new Array());
    } catch (e) {
      parsedMembers = new Array();
    }
    if (creatorId && !parsedMembers.includes(creatorId)) {
      parsedMembers.unshift(creatorId);
    }

    const newGroup = {
      id: `group_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: String(name || 'Новая группа').trim(),
      creatorId,
      adminIds: creatorId ? [creatorId] : new Array(),
      memberIds: parsedMembers,
      avatarUrl: req.file ? `/uploads/${req.file.filename}` : null
    };

    if (typeof groupsStorage.createGroup === 'function') {
      const created = groupsStorage.createGroup(newGroup);
      return res.json({ success: true, group: created || newGroup });
    }

    groupsList.push(newGroup);
    res.json({ success: true, group: newGroup });
  });

  app.post('/api/groups/:groupId/update', upload.single('avatar'), (req, res) => {
    const grp = typeof groupsStorage.getGroupById === 'function'
      ? groupsStorage.getGroupById(req.params.groupId)
      : groupsList.find(g => g.id === req.params.groupId);

    if (!grp) return res.status(404).json({ error: 'Группа не найдена' });

    if (req.body.name) grp.name = req.body.name.trim();
    if (req.file) grp.avatarUrl = `/uploads/${req.file.filename}`;
    res.json({ success: true, group: grp });
  });

  app.post('/api/groups/:groupId/members', (req, res) => {
    const grp = typeof groupsStorage.getGroupById === 'function'
      ? groupsStorage.getGroupById(req.params.groupId)
      : groupsList.find(g => g.id === req.params.groupId);

    if (!grp) return res.status(404).json({ error: 'Группа не найдена' });

    const { memberIds, addIds, removeId } = req.body;
    if (Array.isArray(memberIds)) {
      grp.memberIds = memberIds;
    } else if (Array.isArray(addIds)) {
      addIds.forEach(id => {
        if (!grp.memberIds.includes(id)) grp.memberIds.push(id);
      });
    } else if (removeId) {
      grp.memberIds = grp.memberIds.filter(id => id !== removeId);
      if (Array.isArray(grp.adminIds)) {
        grp.adminIds = grp.adminIds.filter(id => id !== removeId);
      }
    }

    res.json({ success: true, group: grp });
  });
}

module.exports = { setupGroupRoutes };
