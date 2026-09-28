'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Results', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userName: {
        type: Sequelize.STRING
      },
      testId: {
  type: Sequelize.INTEGER,
  allowNull: false,
  references: {
    model: 'Tests',
    key: 'id'
  }
},
      testTitle: {
        type: Sequelize.STRING
      },
      correct: {
        type: Sequelize.INTEGER
      },
      total: {
        type: Sequelize.INTEGER
      },
      percentage: {
        type: Sequelize.INTEGER
      },
      passed: {
        type: Sequelize.BOOLEAN
      },
      certificateCode: {
        type: Sequelize.STRING
      },
      certificateIssuedAt: {
        type: Sequelize.DATE
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
    await queryInterface.dropTable('Results');
  }
};