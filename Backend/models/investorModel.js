const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Investor = sequelize.define("Investor", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  firstName: { type: DataTypes.STRING, allowNull: false },
  lastName: { type: DataTypes.STRING },
  email: { type: DataTypes.STRING, unique: true },
  officePhone: { type: DataTypes.STRING },
  mobilePhone: { type: DataTypes.STRING },
  jobTitle: { type: DataTypes.STRING },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'New'
  },
  fundId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  companyId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  pipelineId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'investors',
  freezeTableName: true
});

module.exports = Investor;