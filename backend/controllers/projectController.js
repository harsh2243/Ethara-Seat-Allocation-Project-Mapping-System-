const Project = require('../models/Project');
const Employee = require('../models/Employee');

// Create project
exports.createProject = async (req, res) => {
  try {
    const { name, description, manager_name, status } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Project name is required' });
    }
    const existingProject = await Project.findOne({ name });
    if (existingProject) {
      return res.status(400).json({ message: 'Project name already exists' });
    }
    const newProject = new Project({ name, description, manager_name, status });
    await newProject.save();
    res.status(201).json(newProject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// List projects
exports.listProjects = async (req, res) => {
  try {
    const projects = await Project.find().sort({ name: 1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// List employees in a project
exports.listProjectEmployees = async (req, res) => {
  try {
    const { id } = req.params;
    const employees = await Employee.find({ project_id: id }).sort({ name: 1 });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
