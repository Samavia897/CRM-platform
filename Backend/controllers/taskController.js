const Task = require("../models/taskModel");

exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.findAll({ order: [['createdAt', 'DESC']] });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Error fetching tasks from database." });
  }
};

exports.createTask = async (req, res) => {
  try {
    // 1. Ensure investorId is coming from request body
    const { title, description, dueDate, priority, investor, investorId, status } = req.body;
    
    const newTask = await Task.create({
      title,
      description,
      dueDate,
      priority,
      investor,
      investorId, // Yeh line database mein UUID store karne ke liye lazmi hai
      status: status || "Pending"
    });
    
    res.status(201).json(newTask);
  } catch (error) {
    const errorMessage = error.errors ? error.errors[0].message : error.message;
    console.error("Task Create Error:", errorMessage); // Error logs dekhne ke liye
    res.status(400).json({ message: errorMessage });
  }
};

// ======= CHANGED: Isko update kiya taake Edit Modal aur Status Toggle dono ka data handle ho sake =======
// controllers/taskController.js

exports.updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // Frontend se 'Pending' ya 'Completed' aayega

    // Check karein ke task exist karta hai
    const task = await Task.findByPk(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Status update kar ke save karein
    task.status = status;
    await task.save();

    res.status(200).json({ message: "Task status updated successfully", task });
  } catch (error) {
    console.error("Update Status Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ======= NEW FUNCTION: Task Delete karne ke liye =======
exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findByPk(id);
    
    if (!task) {
      return res.status(404).json({ message: "Task not found." });
    }

    await task.destroy();
    res.json({ message: "Task deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Error deleting task." });
  }
};