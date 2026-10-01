const router = require('express').Router();
const bcrypt = require('bcrypt');         // или require('bcryptjs')
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { authenticate } = require('../middleware/auth');

const SALT_ROUNDS = 10;

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );
};

// ---------- POST /auth/register ----------
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Поля email и password обязательны'
      });
    }
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Пароль должен содержать минимум 6 символов'
      });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Пользователь с таким email уже существует'
      });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
      email,
      passwordHash,
      role: role || 'user'
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Пользователь успешно зарегистрирован',
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt
        },
        token
      }
    });
  } catch (e) { next(e); }
});

// ---------- POST /auth/login ----------
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Поля email и password обязательны'
      });
    }

    const user = await User.findOne({ where: { email } });

    // Одинаковый ответ для «email не найден» и «неверный пароль»
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Неверный email или пароль'
      });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Неверный email или пароль'
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Вход выполнен',
      data: {
        user: { id: user.id, email: user.email, role: user.role },
        token
      }
    });
  } catch (e) { next(e); }
});

// ---------- GET /auth/profile (защищённый) ----------
router.get('/profile', authenticate, async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role
      }
    });
  } catch (e) { next(e); }
});

module.exports = router;