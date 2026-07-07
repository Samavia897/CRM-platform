const sequelize = require("../config/db");
const User = require("./userModel");
const Company = require("./companyModel");
const Fund = require("./fundModel");
const Investor = require("./investorModel");
const Task = require("./taskModel");
const Pipeline = require("./pipelineModel");

Company.hasMany(Fund, { foreignKey: "companyId", onDelete: 'CASCADE', hooks: true });
Fund.belongsTo(Company, { foreignKey: "companyId" });

Fund.hasMany(Investor, { foreignKey: "fundId", onDelete: 'CASCADE', hooks: true });
Investor.belongsTo(Fund, { foreignKey: "fundId" });

Investor.hasMany(Task, {
  foreignKey: "investorId",
  onDelete: 'CASCADE',
  hooks: true
});
Task.belongsTo(Investor, {
  foreignKey: "investorId",
  as: "InvestorInstance"
});

Pipeline.hasMany(Investor, {
  foreignKey: "pipelineId",
  onDelete: 'CASCADE',
  hooks: true
});
Investor.belongsTo(Pipeline, { foreignKey: "pipelineId" });

Company.hasMany(Investor, { foreignKey: "companyId" });
Investor.belongsTo(Company, { foreignKey: "companyId" });

module.exports = {
  sequelize,
  User,
  Company,
  Fund,
  Investor,
  Task,
  Pipeline
};