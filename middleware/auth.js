const jwt = require('jsonwebtoken');
const { User } = require('../models');

// ---------- Проверка JWT ----------
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Требуется авторизация. Заголовок Authorization отсутствует или некорректен.'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Пользователь не найден'
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };
    next();
  } catch (e) {
    if (e.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Токен истёк' });
    }
    if (e.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, error: 'Недействительный токен' });
    }
    next(e);
  }
};

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Требуется авторизация' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Недостаточно прав для выполнения операции'
      });
    }
    next();
  };
};

const isAdmin = requireRole('admin');
const isTeacherOrAdmin = requireRole('teacher', 'admin');

module.exports = {
  authenticate,
  requireRole,
  isAdmin,
  isTeacherOrAdmin
};