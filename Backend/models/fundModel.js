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
    allowNull: true,
    validate: {
      isUrlSafe(value) {
        if (value && value !== "" && value !== "---") {
          const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
          if (!urlRegex.test(value)) {
            throw new Error('Invalid URL format specified.');
          }
        }
      }
    }
  },
  industry: {
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