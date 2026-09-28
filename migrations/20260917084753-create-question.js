'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Questions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      question: {
        type: Sequelize.STRING
      },
      options: {
        type: Sequelize.TEXT
      },
      correctAnswer: {
        type: Sequelize.INTEGER
      },
      testId: {
  type: Sequelize.INTEGER,
  allowNull: false,
  references: {
    model: 'Tests',
    key: 'id'
  },
  onDelete: 'CASCADE'
},
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Questions');
  }
};