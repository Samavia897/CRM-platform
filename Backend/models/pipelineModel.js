const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Pipeline = sequelize.define("Pipeline", {
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
    type: DataTypes.UUID, // 🟢 FIXED: INTEGER se badal kar UUID kar diya
    allowNull: false
  }
}, {
  tableName: 'Pipelines',
  freezeTableName: true
});

module.exports = Pipeline;