const router = require('express').Router();
const { User } = require('../models');
const { authenticate, isAdmin } = require('../middleware/auth');

// ---------- GET /admin/users ----------
router.get('/users', authenticate, isAdmin, async (req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'email', 'role', 'createdAt'] // без passwordHash
    });
    res.json({ success: true, count: users.length, data: users });
  } catch (e) { next(e); }
});

// ---------- PUT /admin/users/:id/role ----------
router.put('/users/:id/role', authenticate, isAdmin, async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['user', 'teacher', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Недопустимая роль. Допустимо: user, teacher, admin'
      });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Пользователь не найден' });
    }

    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Нельзя изменить свою собственную роль'
      });
    }

    await user.update({ role });
    res.json({
      success: true,
      message: 'Роль обновлена',
      data: { id: user.id, email: user.email, role: user.role }
    });
  } catch (e) { next(e); }
});

// ---------- DELETE /admin/users/:id ----------
router.delete('/users/:id', authenticate, isAdmin, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Пользователь не найден' });
    }
    if (user.id === req.user.id) {
      return res.status(400).json({ success: false, error: 'Нельзя удалить самого себя' });
    }
    const deleted = { id: user.id, email: user.email };
    await user.destroy();
    res.json({ success: true, message: 'Пользователь удалён', data: deleted });
  } catch (e) { next(e); }
});

module.exports = router;