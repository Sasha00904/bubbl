const storage = require('./storage');
const { setupUserRoutes, sanitizeUser } = require('./routes-users');
const { setupGroupRoutes } = require('./routes-groups');

const users = storage.users || new Array();

function setupApiRoutes(app, upload) {
  setupUserRoutes(app, upload);
  setupGroupRoutes(app, upload);

  app.post('/api/users/update', upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'banner', maxCount: 1 }]), (req, res) => {
    const { userId, firstName, lastName, bio, username } = req.body;
    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден (перезайдите в аккаунт)' });
    }

    const cleanUsername = String(username || '').trim().startsWith('@')
      ? String(username || '').trim()
      : `@${String(username || '').trim()}`;

    const isTaken = users.some(u => u.id !== userId && u.username.toLowerCase() === cleanUsername.toLowerCase());
    if (isTaken) {
      return res.status(400).json({ error: 'Этот @username уже занят' });
    }

    user.firstName = String(firstName || '').trim();
    user.lastName = String(lastName || '').trim();
    user.bio = String(bio || '').trim();
    user.username = cleanUsername;

    if (req.files && req.files.avatar && req.files.avatar.at(0)) {
      user.avatarUrl = `/uploads/${req.files.avatar.at(0).filename}`;
    }
    if (req.files && req.files.banner && req.files.banner.at(0)) {
      user.bannerUrl = `/uploads/${req.files.banner.at(0).filename}`;
    }

    res.json({ success: true, user: sanitizeUser(user) });
  });

  app.post('/api/users/change-password', (req, res) => {
    const { userId, oldPassword, newPassword } = req.body;
    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден (перезайдите в аккаунт)' });
    }
    if (user.password !== oldPassword) {
      return res.status(400).json({ error: 'Неверный текущий пароль' });
    }
    user.password = newPassword;
    res.json({ success: true });
  });

  app.post('/api/upload', upload.any(), (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Файл не получен сервером' });
    }
    const uploadedFile = req.files.at(0);
    const fileUrl = `/uploads/${uploadedFile.filename}`;
    res.json({ success: true, fileUrl, url: fileUrl });
  });
}

module.exports = { setupApiRoutes };
