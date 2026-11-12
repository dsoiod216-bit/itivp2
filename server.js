require('dotenv').config();
const cors = require('cors');
const express = require('express');
const { Op } = require('sequelize'); // Вынесли сюда для чистоты
const { Test, Question, Result, sequelize } = require('./models');
const { authenticate, isTeacherOrAdmin } = require('./middleware/auth');

const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.use('/auth',  require('./routes/auth'));
app.use('/admin', require('./routes/admin'));

app.get('/tests', authenticate, async (req, res, next) => {
  try {
    const { search } = req.query; 
 
    let whereCondition = {};
    if (search) {
      whereCondition.title = { [Op.iLike]: `%${search}%` }; 
    }

    const tests = await Test.findAll({
      where: whereCondition,
      include: [{ model: Question, as: 'questions' }]
    });

    res.json({
      success: true,
      count: tests.length,
      data: tests.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        questionsCount: t.questions.length,
        passingScore: t.passingScore,
        timeLimit: t.timeLimit,
        createdAt: t.createdAt
      }))
    });
  } catch (e) { next(e); }
});

app.get('/tests/:id', authenticate, async (req, res, next) => {
  try {
    const test = await Test.findByPk(req.params.id, {
      include: [{ model: Question, as: 'questions' }]
    });

    if (!test) {
      return res.status(404).json({ success: false, error: 'Тест не найден' });
    }

    const questionsForClient = test.questions.map(q => ({
      id: q.id,
      question: q.question,
      options: JSON.parse(q.options)
    }));

    res.json({
      success: true,
      data: {
        id: test.id,
        title: test.title,
        description: test.description,
        timeLimit: test.timeLimit,
        passingScore: test.passingScore,
        questions: questionsForClient,
        createdAt: test.createdAt
      }
    });
  } catch (e) { next(e); }
});

app.post('/tests', authenticate, isTeacherOrAdmin, async (req, res, next) => {
  try {
    const { title, description, questions, passingScore, timeLimit } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: 'Поле title обязательно' });
    }

    const questionsData = (questions && Array.isArray(questions) && questions.length > 0) 
      ? questions 
      : [{ question: 'Вопрос по умолчанию', options: ['Да', 'Нет'], correctAnswer: 0 }];

    for (let q of questionsData) {
      if (!q.question || !q.options || !Array.isArray(q.options) || q.options.length < 2) {
        return res.status(400).json({ success: false, error: 'Каждый вопрос должен иметь question и options (минимум 2)' });
      }
      if (q.correctAnswer === undefined || q.correctAnswer >= q.options.length) {
        return res.status(400).json({ success: false, error: 'Некорректный индекс правильного ответа' });
      }
    }

    const newTest = await sequelize.transaction(async (t) => {
      const test = await Test.create({
        title,
        description: description || '',
        timeLimit: timeLimit || 600,
        passingScore: passingScore || 60
      }, { transaction: t });

      await Question.bulkCreate(
        questionsData.map(q => ({
          question: q.question,
          options: JSON.stringify(q.options),
          correctAnswer: q.correctAnswer,
          testId: test.id
        })),
        { transaction: t }
      );

      return test;
    });

    res.status(201).json({
      success: true,
      message: 'Тест создан',
      data: {
        id: newTest.id,
        title: newTest.title,
        description: newTest.description,
        passingScore: newTest.passingScore,
        timeLimit: newTest.timeLimit,
        questionsCount: questionsData.length,
        createdAt: newTest.createdAt
      }
    });
  } catch (e) { next(e); }
});

app.put('/tests/:id', authenticate, isTeacherOrAdmin, async (req, res, next) => {
  try {
    const test = await Test.findByPk(req.params.id);
    if (!test) {
      return res.status(404).json({ success: false, error: 'Тест не найден' });
    }

    const { title, description, timeLimit, passingScore } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, error: 'Поле title обязательно' });
    }

    await test.update({
      title,
      description: description ?? test.description,
      timeLimit: timeLimit ?? test.timeLimit,
      passingScore: passingScore ?? test.passingScore
    });

    res.json({
      success: true,
      message: 'Тест обновлен',
      data: { 
        id: test.id, 
        title: test.title,
        description: test.description,
        passingScore: test.passingScore,
        timeLimit: test.timeLimit
      }
    });
  } catch (e) { next(e); }
});

app.delete('/tests/:id', authenticate, isTeacherOrAdmin, async (req, res, next) => {
  try {
    const test = await Test.findByPk(req.params.id);
    if (!test) {
      return res.status(404).json({ success: false, error: 'Тест не найден' });
    }

    const deleted = { id: test.id, title: test.title };
    await test.destroy();

    res.json({ success: true, message: 'Тест удален', data: deleted });
  } catch (e) { next(e); }
});

const generateCertificate = (userName, testTitle, score, total) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'CERT-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return {
    code,
    userName,
    testTitle,
    score: `${score}/${total}`,
    percentage: Math.round((score / total) * 100),
    issuedAt: new Date().toISOString()
  };
};

app.post('/tests/:id/submit', authenticate, async (req, res, next) => {
  try {
    const test = await Test.findByPk(req.params.id, {
      include: [{ model: Question, as: 'questions' }]
    });
    if (!test) {
      return res.status(404).json({ success: false, error: 'Тест не найден' });
    }

    const { answers } = req.body;
    const userName = req.user.email;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ success: false, error: 'Требуется массив answers' });
    }
    if (answers.length !== test.questions.length) {
      return res.status(400).json({ success: false, error: `Требуется ${test.questions.length} ответов` });
    }

    let correct = 0;
    const details = test.questions.map((q, index) => {
      const isCorrect = answers[index] === q.correctAnswer;
      if (isCorrect) correct++;
      return {
        questionId: q.id,
        question: q.question,
        userAnswer: answers[index],
        correctAnswer: q.correctAnswer,
        isCorrect
      };
    });

    const total = test.questions.length;
    const percentage = Math.round((correct / total) * 100);
    const passed = percentage >= test.passingScore;

    let certificate = null;
    if (passed) {
      certificate = generateCertificate(userName, test.title, correct, total);
    }

    const saved = await Result.create({
      userName,
      userId: req.user.id,
      testId: test.id,
      testTitle: test.title,
      correct,
      total,
      percentage,
      passed,
      certificateCode: certificate ? certificate.code : null,
      certificateIssuedAt: certificate ? new Date() : null
    });

    res.status(201).json({
      success: true,
      data: {
        result: {
          id: saved.id,
          correct,
          total,
          percentage,
          passed
        },
        certificate,
        details: details.map(d => ({
          questionId: d.questionId,
          isCorrect: d.isCorrect
        })),
        message: passed ? '🎉 Поздравляем! Тест пройден!' : '😔 Тест не пройден. Попробуйте еще раз.'
      }
    });
  } catch (e) { next(e); }
});

app.get('/results', authenticate, async (req, res, next) => {
  try {
    const results = await Result.findAll({ order: [['createdAt', 'DESC']] });

    res.json({
      success: true,
      count: results.length,
      data: results.map(r => ({
        id: r.id,
        userName: r.userName,
        testTitle: r.testTitle,
        correct: r.correct,
        total: r.total,
        percentage: r.percentage,
        passed: r.passed,
        completedAt: r.createdAt
      }))
    });
  } catch (e) { next(e); }
});

app.get('/certificates/:code', async (req, res, next) => {
  try {
    const result = await Result.findOne({
      where: { certificateCode: req.params.code }
    });
    if (!result) {
      return res.status(404).json({ success: false, error: 'Сертификат не найден' });
    }
    res.json({
      success: true,
      data: {
        code: result.certificateCode,
        userName: result.userName,
        testTitle: result.testTitle,
        score: `${result.correct}/${result.total}`,
        percentage: result.percentage,
        issuedAt: result.certificateIssuedAt
      }
    });
  } catch (e) { next(e); }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Внутренняя ошибка сервера' });
});

sequelize.authenticate()
  .then(() => {
    console.log('✅ Подключение к Supabase работает');
    app.listen(PORT, () => {
      console.log(`🚀 Платформа тестирования запущена на порту ${PORT}`);
      console.log(`📍 http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Ошибка подключения к БД:', err.message);
    process.exit(1);
  });

module.exports = app;