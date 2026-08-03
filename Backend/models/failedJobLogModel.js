const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const FailedJobLog = sequelize.define("FailedJobLog", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  jobId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  queueName: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "fundImportQueue",
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  failedRecords: {
    type: DataTypes.JSON, 
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("pending_review", "resolved"),
    defaultValue: "pending_review",
  }
}, {
  timestamps: true
});

module.exports = FailedJobLog;