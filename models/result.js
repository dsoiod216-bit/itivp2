'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Result extends Model {
    static associate(models) {
      Result.belongsTo(models.Test, {
        foreignKey: 'testId',
        as: 'test'
      });
    }
  }
  Result.init({
    userName: DataTypes.STRING,
    testId: DataTypes.INTEGER,
    testTitle: DataTypes.STRING,
    correct: DataTypes.INTEGER,
    total: DataTypes.INTEGER,
    percentage: DataTypes.INTEGER,
    passed: DataTypes.BOOLEAN,
    certificateCode: DataTypes.STRING,
    certificateIssuedAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Result',
  });
  return Result;
};