'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert('Tests', [
      {
        title: 'Основы JavaScript',
        description: 'Базовый тест по JS',
        passingScore: 60,
        timeLimit: 600,
        author: 'Преподаватель',
        createdAt: now,
        updatedAt: now
      },
      {
        title: 'SQL для начинающих',
        description: 'SELECT и JOIN',
        passingScore: 70,
        timeLimit: 900,
        author: 'Преподаватель',
        createdAt: now,
        updatedAt: now
      }
    ]);

    await queryInterface.bulkInsert('Questions', [
      {
        testId: 1,
        question: 'Что вернёт typeof null?',
        options: JSON.stringify(['null', 'object', 'undefined']),
        correctAnswer: 1,
        createdAt: now,
        updatedAt: now
      },
      {
        testId: 1,
        question: 'Как объявить константу?',
        options: JSON.stringify(['var', 'let', 'const']),
        correctAnswer: 2,
        createdAt: now,
        updatedAt: now
      },
      {
        testId: 2,
        question: 'Какой оператор выбирает данные?',
        options: JSON.stringify(['INSERT', 'SELECT', 'UPDATE']),
        correctAnswer: 1,
        createdAt: now,
        updatedAt: now
      }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('Questions', null, {});
    await queryInterface.bulkDelete('Tests', null, {});
  }
};