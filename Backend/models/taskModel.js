const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Task = sequelize.define("Task", {

  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
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

  investorId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'investors',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  }
});

module.exports = Task;