const sequelize = require("../config/db");
const User = require("./userModel");
const Company = require("./companyModel");
const Fund = require("./fundModel");
const Investor = require("./investorModel");
const Task = require("./taskModel");
const Pipeline = require("./pipelineModel");

// ==========================================
// 1. Company -> Funds (UUID to UUID)
// ==========================================
Company.hasMany(Fund, { foreignKey: "companyId", onDelete: 'CASCADE', hooks: true });
Fund.belongsTo(Company, { foreignKey: "companyId" });

// ==========================================
// 2. Fund -> Investors (UUID to UUID)
// ==========================================
Fund.hasMany(Investor, { foreignKey: "fundId", onDelete: 'CASCADE', hooks: true });
Investor.belongsTo(Fund, { foreignKey: "fundId" });

// ==========================================
// 3. Investor -> Tasks (UUID to UUID)
// ==========================================
// ==========================================
// 3. Investor -> Tasks (UUID to UUID)
// ==========================================
// 🟢 FIXED: 'investorId' key mapping and targeted model validation
Investor.hasMany(Task, { 
  foreignKey: "investorId", 
  onDelete: 'CASCADE', 
  hooks: true 
});
Task.belongsTo(Investor, { 
  foreignKey: "investorId",
  as: "InvestorInstance" // Explicit unique alias avoiding strict table collisions
});
// ==========================================
// 4. Pipeline -> Investor (INTEGER to INTEGER)
// ==========================================
Pipeline.hasMany(Investor, { 
  foreignKey: "pipelineId", 
  onDelete: 'CASCADE', 
  hooks: true 
});
Investor.belongsTo(Pipeline, { foreignKey: "pipelineId" });

// ==========================================
// 5. Company -> Investor (UUID to UUID)
// ==========================================
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