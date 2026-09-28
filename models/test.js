'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Test extends Model {
    static associate(models) {
      Test.hasMany(models.Question, {
        foreignKey: 'testId',
        as: 'questions',
        onDelete: 'CASCADE'
      });
      Test.hasMany(models.Result, {
        foreignKey: 'testId',
        as: 'results'
      });
    }
  }
  Test.init({
  title: DataTypes.STRING,
  description: DataTypes.STRING,
  passingScore: DataTypes.INTEGER,
  timeLimit: DataTypes.INTEGER,
  author: DataTypes.STRING            // ← добавлено
}, {
  sequelize,
  modelName: 'Test',
});
  return Test;
};