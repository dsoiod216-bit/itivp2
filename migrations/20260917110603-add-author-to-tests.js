'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
  await queryInterface.addColumn('Tests', 'author', {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: 'Неизвестный автор'
  });
},

  async down (queryInterface, Sequelize) {
  await queryInterface.removeColumn('Tests', 'author');
},
};
