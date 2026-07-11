const sequelize = require("../config/db");
const User = require("./userModel");
const Company = require("./companyModel");
const Fund = require("./fundModel");
const Investor = require("./investorModel");
const Task = require("./taskModel");
const Pipeline = require("./pipelineModel");

// Company <-> Fund
Company.hasMany(Fund, { foreignKey: "companyId", onDelete: 'CASCADE', hooks: true });
Fund.belongsTo(Company, { foreignKey: "companyId" });

// Fund <-> Investor
Fund.hasMany(Investor, { foreignKey: "fundId", onDelete: 'CASCADE', hooks: true });
Investor.belongsTo(Fund, { foreignKey: "fundId" });

// Investor <-> Task (🌟 Cleaned & Simplified Association)
Investor.hasMany(Task, { foreignKey: "investorId", onDelete: 'CASCADE', hooks: true });
Task.belongsTo(Investor, { foreignKey: "investorId" }); // ⚡ Removed 'as: "InvestorInstance"' to prevent look-up crash

// Pipeline <-> Investor
Pipeline.hasMany(Investor, { foreignKey: "pipelineId", onDelete: 'CASCADE', hooks: true });
Investor.belongsTo(Pipeline, { foreignKey: "pipelineId" });

// Company <-> Investor
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