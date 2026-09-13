const express = require('express');
const app = express();
app.use(express.json());
const PORT = 3000;

let tests = [];
let testIdCounter = 1;
let results = [];
let resultIdCounter = 1;

const findTest = (id) => tests.find(t => t.id === id);
const findTestIndex = (id) => tests.findIndex(t => t.id === id);
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


app.get('/tests', (req, res) => {
    res.json({
        success: true,
        count: tests.length,
        data: tests.map(t => ({
            id: t.id,
            title: t.title,
            description: t.description,
            questionsCount: t.questions.length,
            passingScore: t.passingScore,
            createdAt: t.createdAt
        }))
    });
});


app.get('/tests/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const test = findTest(id);

    if (!test) {
        return res.status(404).json({
            success: false,
            error: 'Тест не найден'
        });
    }

    const questionsForClient = test.questions.map(q => ({
        id: q.id,
        question: q.question,
        options: q.options
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
});


app.post('/tests', (req, res) => {
    const { title, description, questions, passingScore, timeLimit } = req.body;
    if (!title) {
        return res.status(400).json({
            success: false,
            error: 'Поле title обязательно'
        }); }
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({
            success: false,
            error: 'Требуется массив questions (минимум 1 вопрос)'
        }); }
    for (let q of questions) {
        if (!q.question || !q.options || !Array.isArray(q.options) || q.options.length < 2) {
            return res.status(400).json({
                success: false,
                error: 'Каждый вопрос должен иметь question и options (минимум 2)'
            }); }
        if (q.correctAnswer === undefined || q.correctAnswer >= q.options.length) {
            return res.status(400).json({
                success: false,
                error: 'Некорректный индекс правильного ответа'
            });} }
    const newTest = {
        id: testIdCounter++,
        title,
        description: description || '',
        timeLimit: timeLimit || 30,
        passingScore: passingScore || 60,
        questions: questions.map((q, index) => ({
            id: index + 1,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer
        })),
        createdAt: new Date().toISOString()
    };

    tests.push(newTest);

    res.status(201).json({
        success: true,
        message: 'Тест создан',
        data: {
            id: newTest.id,
            title: newTest.title,
            questionsCount: newTest.questions.length
        }
    });
});


app.put('/tests/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = findTestIndex(id);

    if (index === -1) {
        return res.status(404).json({
            success: false,
            error: 'Тест не найден'
        });
    }

    const { title, description, timeLimit, passingScore } = req.body;

    if (!title) {
        return res.status(400).json({
            success: false,
            error: 'Поле title обязательно'
        });
    }

    tests[index] = {
        ...tests[index],
        title,
        description: description || tests[index].description,
        timeLimit: timeLimit || tests[index].timeLimit,
        passingScore: passingScore || tests[index].passingScore
    };

    res.json({
        success: true,
        message: 'Тест обновлен',
        data: {
            id: tests[index].id,
            title: tests[index].title
        }
    });
});


app.delete('/tests/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = findTestIndex(id);

    if (index === -1) {
        return res.status(404).json({
            success: false,
            error: 'Тест не найден'
        });
    }

    const deletedTest = tests[index];
    tests.splice(index, 1);

    res.json({
        success: true,
        message: 'Тест удален',
        data: {
            id: deletedTest.id,
            title: deletedTest.title
        }
    });
});


app.post('/tests/:id/submit', (req, res) => {
    const id = parseInt(req.params.id);
    const test = findTest(id);

    if (!test) {
        return res.status(404).json({
            success: false,
            error: 'Тест не найден'
        });
    }

    const { userName, answers } = req.body;

    if (!userName) {
        return res.status(400).json({
            success: false,
            error: 'Поле userName обязательно'
        });
    }

    if (!answers || !Array.isArray(answers)) {
        return res.status(400).json({
            success: false,
            error: 'Требуется массив answers'
        });
    }

    if (answers.length !== test.questions.length) {
        return res.status(400).json({
            success: false,
            error: `Требуется ${test.questions.length} ответов`
        });
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
    const result = {
        id: resultIdCounter++,
        testId: test.id,
        testTitle: test.title,
        userName,
        correct,
        total,
        percentage,
        passed,
        details,
        completedAt: new Date().toISOString()
    };
    results.push(result);

    let certificate = null;
    if (passed) {
        certificate = generateCertificate(userName, test.title, correct, total);
    }

    res.status(201).json({
        success: true,
        data: {
            result: {
                id: result.id,
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
});

app.get('/results', (req, res) => {
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
            completedAt: r.completedAt
        }))
    });
});


app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        error: 'Внутренняя ошибка сервера'
    });
});


app.listen(PORT, () => {
    console.log(`🚀 Платформа тестирования запущена на порту ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
});

module.exports = app;