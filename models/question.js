'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Question extends Model {
    static associate(models) {
      Question.belongsTo(models.Test, {
        foreignKey: 'testId',
        as: 'test'
      });
    }
  }
  Question.init({
    question: DataTypes.STRING,
    options: DataTypes.TEXT,     
    correctAnswer: DataTypes.INTEGER,
    testId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Question',
  });
  return Question;
};