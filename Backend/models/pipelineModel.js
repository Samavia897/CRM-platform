const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Pipeline = sequelize.define("Pipeline", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  stages: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: "New,Initial Meeting,Due Diligence,Commitment,Closed"
  },
  companyId: {
    type: DataTypes.UUID,
    allowNull: false
  }
}, {
  tableName: 'Pipelines',
  freezeTableName: true
});

module.exports = Pipeline;