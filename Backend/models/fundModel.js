const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Fund = sequelize.define("Fund", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING,
    defaultValue: 'Venture'
  },
  location: {
    type: DataTypes.STRING
  },
  website: {
    type: DataTypes.STRING,
    validate: { isUrl: true }
  },
  geographics: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  industry: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  stage: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  companyId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Companies',
      key: 'id'
    }
  }
}, {
  timestamps: true
});

module.exports = Fund;