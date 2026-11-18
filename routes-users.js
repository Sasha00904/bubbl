const storage = require('./storage');

const users = storage.users || new Array();
const onlineUsers = storage.onlineUsers || new Map();
const lastSeenMap = storage.lastSeenMap || new Map();
const blacklistMap = storage.blacklistMap || new Map();

function sanitizeUser(userObj) {
  if (!userObj) return null;
  const { password, ...safeUser } = userObj;
  return safeUser;
}

function setupUserRoutes(app, upload) {
  app.post('/api/login', (req, res) => {
    const { login, password } = req.body;
    const found = users.find(
      u => u.login && u.login.toLowerCase() === String(login || '').trim().toLowerCase() && u.password === password
    );
    if (!found) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }
    res.json({ success: true, user: sanitizeUser(found) });
  });

  app.post('/api/register', upload.single('avatar'), (req, res) => {
    const { firstName, lastName, username, login, password } = req.body;
    if (!firstName || !username || !login || !password) {
      return res.status(400).json({ error: 'Заполните все обязательные поля' });
    }

    const cleanLogin = login.trim();
    const cleanUsername = username.trim().startsWith('@') ? username.trim() : `@${username.trim()}`;

    if (users.some(u => u.login.toLowerCase() === cleanLogin.toLowerCase())) {
      return res.status(400).json({ error: 'Этот логин уже занят' });
    }
    if (users.some(u => u.username.toLowerCase() === cleanUsername.toLowerCase())) {
      return res.status(400).json({ error: 'Этот @username уже занят' });
    }

    const newUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      firstName: firstName.trim(),
      lastName: (lastName || '').trim(),
      bio: '',
      username: cleanUsername,
      login: cleanLogin,
      password,
      avatarUrl: req.file ? `/uploads/${req.file.filename}` : null,
      bannerUrl: null
    };

    users.push(newUser);
    res.json({ success: true, user: sanitizeUser(newUser) });
  });

  app.get('/api/users/search', (req, res) => {
    const q = String(req.query.q || '').trim().toLowerCase();
    const excludeId = req.query.excludeId;
    if (!q) return res.json(new Array());

    const results = users
      .filter(u => u.id !== excludeId)
      .filter(u =>
        u.username.toLowerCase().includes(q) ||
        `${u.firstName} ${u.lastName || ''}`.toLowerCase().includes(q)
      )
      .map(sanitizeUser);

    res.json(results);
  });

  app.get('/api/users', (req, res) => {
    res.json(users.map(sanitizeUser));
  });

  app.get('/api/users/:id/status', (req, res) => {
    const targetId = req.params.id;
    const viewerId = req.query.viewerId;

    const blockedByTarget = typeof storage.isUserBlocked === 'function'
      ? storage.isUserBlocked(targetId, viewerId)
      : (blacklistMap.get(targetId)?.has(viewerId) || false);

    const blockedByViewer = typeof storage.isUserBlocked === 'function'
      ? storage.isUserBlocked(viewerId, targetId)
      : (blacklistMap.get(viewerId)?.has(targetId) || false);

    if (blockedByTarget || blockedByViewer) {
      return res.json({ online: false, lastSeen: null, isLongTimeAgo: true });
    }

    const isOnline = onlineUsers.has(targetId) && onlineUsers.get(targetId).size > 0;
    const lastSeen = lastSeenMap.get(targetId) || null;
    res.json({ online: isOnline, lastSeen, isLongTimeAgo: false });
  });

  app.get('/api/blacklist/:userId', (req, res) => {
    const ownerId = req.params.userId;
    const blockedSet = typeof storage.getUserBlacklist === 'function'
      ? storage.getUserBlacklist(ownerId)
      : (blacklistMap.get(ownerId) || new Set());

    const blockedUsers = Array.from(blockedSet)
      .map(id => users.find(u => u.id === id))
      .filter(Boolean)
      .map(sanitizeUser);

    res.json(blockedUsers);
  });

  app.post('/api/blacklist/add', (req, res) => {
    const { ownerId, targetId } = req.body;
    if (typeof storage.addToBlacklist === 'function') {
      storage.addToBlacklist(ownerId, targetId);
    } else {
      if (!blacklistMap.has(ownerId)) blacklistMap.set(ownerId, new Set());
      blacklistMap.get(ownerId).add(targetId);
    }
    res.json({ success: true });
  });

  app.post('/api/blacklist/remove', (req, res) => {
    const { ownerId, targetId } = req.body;
    if (typeof storage.removeFromBlacklist === 'function') {
      storage.removeFromBlacklist(ownerId, targetId);
    } else if (blacklistMap.has(ownerId)) {
      blacklistMap.get(ownerId).delete(targetId);
    }
    res.json({ success: true });
  });
}

module.exports = { setupUserRoutes, sanitizeUser };
