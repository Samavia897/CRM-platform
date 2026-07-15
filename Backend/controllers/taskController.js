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

    const { title, description, dueDate, priority, investor, investorId, status } = req.body;

    const newTask = await Task.create({
      title,
      description,
      dueDate,
      priority,
      investor,
      investorId,
      status: status || "Pending"
    });

    res.status(201).json(newTask);
  } catch (error) {
    const errorMessage = error.errors ? error.errors[0].message : error.message;
    console.error("Task Create Error:", errorMessage);
    res.status(400).json({ message: errorMessage });
  }
};

exports.updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, dueDate, priority, investor, investorId, status } = req.body;

    const task = await Task.findByPk(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (priority !== undefined) task.priority = priority;
    if (investor !== undefined) task.investor = investor;
    if (investorId !== undefined) task.investorId = investorId;
    if (status !== undefined) task.status = status;

    await task.save();

    res.status(200).json({ message: "Task updated successfully", task });
  } catch (error) {
    const errorMessage = error.errors ? error.errors[0].message : error.message;
    console.error("Update Task Error:", errorMessage);
    res.status(400).json({ message: errorMessage });
  }
};

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