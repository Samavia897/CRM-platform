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
    defaultValue: 'Venture' // UI dropdown default value ke liye
  },
  location: { 
    type: DataTypes.STRING 
  },
  website: { 
    type: DataTypes.STRING,
    validate: { isUrl: true } // Data validation ke liye
  },
 geographics: { 
  type: DataTypes.JSON, 
  defaultValue: [] // Yahan bracket ke gird quotes mat lagayein
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
      model: 'Companies', // Ensure karein ke aapka Companies table ka naam exact yahi hai
      key: 'id'
    }
  }
}, {
  timestamps: true // Ye zaroori hai kyunke controller 'createdAt' par sort kar raha hai
});

module.exports = Fund;