const { DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // Aapka db connection path

const Task = sequelize.define("Task", {
  // 1. UUID Primary Key Configuration
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4, // Auto-generates unique UUID strings
    primaryKey: true,
    allowNull: false
  },
  title: { 
    type: DataTypes.STRING, 
    allowNull: false,
    validate: {
      isNotNumeric(value) {
        if (/^\d+$/.test(value)) {
          throw new Error('Task title cannot consist only of numbers.');
        }
      },
      len: {
        args: [3, 100],
        msg: "Title must be between 3 and 100 characters long."
      }
    }
  },
  description: { 
    type: DataTypes.TEXT,
    allowNull: true 
  },
  dueDate: { 
    type: DataTypes.DATE, 
    allowNull: false 
  },
  // Investor ka full name frontend display aur validations ke liye
  investor: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  status: { 
    type: DataTypes.ENUM("Pending", "Completed"), 
    defaultValue: "Pending" 
  },
  priority: { 
    type: DataTypes.ENUM("Low", "Medium", "High"), 
    defaultValue: "Medium" 
  },
  
  // 2. Foreign Key for Relational Integration
  investorId: {
    type: DataTypes.UUID, // Chunkay Investor ki ID UUID hai, iska type bhi UUID hoga
    allowNull: false,
    references: {
      model: 'investors', // Aapke Investors table ka naam (Sequelize by default plural banata hai)
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE' // Investor delete ho to task bhi auto-delete ho jaye (jo humne pehle fix kiya)
  }
});

module.exports = Task;