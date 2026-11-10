require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const User = require('./models/User');
const Project = require('./models/Project');
const ProjectMembership = require('./models/ProjectMembership');
const UserStory = require('./models/UserStory'); // PA4 Model

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

// --- PA2 Auth Routes ---
app.post('/api/signup', async (req, res) => {
  try {
    const { f_name, l_name, username, password } = req.body;
    if (!f_name || !l_name || !username || !password) return res.status(400).json({ message: 'All fields are required' });
    const existing = await User.findOne({ username });
    if (existing) return res.status(409).json({ message: 'Username already exists' });
    const user = await User.create({ f_name, l_name, username, password });
    res.status(201).json({ message: 'User created successfully', user: { _id: user._id, f_name: user.f_name, l_name: user.l_name, username: user.username } });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'All fields are required' });
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: 'Username does not exist' });
    if (user.password !== password) return res.status(401).json({ message: 'Incorrect password' });
    res.json({ message: 'Login successful' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// --- PA3 Project & Membership Routes ---
app.post('/api/projects', async (req, res) => {
  try {
    const { name, description, status, project_lead_id } = req.body;
    if (!name || !description || !status || !project_lead_id) return res.status(400).json({ message: 'All fields are required' });
    const leadUser = await User.findById(project_lead_id);
    if (!leadUser) return res.status(404).json({ message: 'Project lead does not exist' });
    const project = await Project.create({ name, description, status, project_lead_id });
    await ProjectMembership.create({ project_id: project._id, user_id: project_lead_id });
    res.status(201).json({ message: 'Project created successfully', project });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

app.get('/api/projects', async (req, res) => {
  try {
    const projects = await Project.find().populate('project_lead_id', 'f_name l_name username');
    res.json(projects);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

app.get('/api/projects/:projectId/members', async (req, res) => {
  try {
    const memberships = await ProjectMembership.find({ project_id: req.params.projectId }).populate('user_id', 'f_name l_name username');
    res.json(memberships);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

app.post('/api/projects/:projectId/members', async (req, res) => {
  try {
    const { user_id } = req.body;
    const projectId = req.params.projectId;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project does not exist' });
    const user = await User.findById(user_id);
    if (!user) return res.status(404).json({ message: 'User does not exist' });
    const existing = await ProjectMembership.findOne({ project_id: projectId, user_id });
    if (existing) return res.status(409).json({ message: 'User is already a member of this project' });
    await ProjectMembership.create({ project_id: projectId, user_id });
    res.status(201).json({ message: 'Member added successfully' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// PA3 Member Removal Route (UPDATED FOR PA4)
app.delete('/api/projects/:projectId/members/:userId', async (req, res) => {
  try {
    const { projectId, userId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project does not exist' });
    
    // Rule: Project Lead cannot be removed
    if (project.project_lead_id.toString() === userId) {
      return res.status(400).json({ message: 'Cannot remove the Project Lead' });
    }
    
    // Rule: Cannot remove member if they have assigned stories
    const assignedStories = await UserStory.findOne({ project_id: projectId, assigned_user_id: userId });
    if (assignedStories) {
      return res.status(400).json({ message: 'Cannot remove member. They have assigned stories. Please reassign or delete their stories first.' });
    }

    await ProjectMembership.findOneAndDelete({ project_id: projectId, user_id: userId });
    res.json({ message: 'Member removed successfully' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// --- PA4 User Story Routes ---

// Get all stories for a project
app.get('/api/projects/:projectId/stories', async (req, res) => {
  try {
    const stories = await UserStory.find({ project_id: req.params.projectId })
      .populate('assigned_user_id', 'f_name l_name username');
    res.json(stories);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// Create a new story
app.post('/api/stories', async (req, res) => {
  try {
    const { project_id, title, description, priority, assigned_user_id } = req.body;
    
    if (!project_id || !title || !description || !priority) {
      return res.status(400).json({ message: 'Title, description, and priority are required' });
    }

    const project = await Project.findById(project_id);
    if (!project) return res.status(404).json({ message: 'Project does not exist' });

    // Verify assigned user is a member of the project
    if (assigned_user_id) {
      const isMember = await ProjectMembership.findOne({ project_id, user_id: assigned_user_id });
      if (!isMember) return res.status(400).json({ message: 'Assigned user must be a member of this project' });
    }

    const story = await UserStory.create({
      project_id, title, description, priority, assigned_user_id: assigned_user_id || null, status: 'To Do'
    });
    res.status(201).json({ message: 'Story created successfully', story });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// Update a story
app.put('/api/stories/:storyId', async (req, res) => {
  try {
    const { title, description, priority, status, assigned_user_id } = req.body;
    const story = await UserStory.findById(req.params.storyId);
    if (!story) return res.status(404).json({ message: 'Story does not exist' });

    if (!title || !description || !priority || !status) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Verify assigned user is a member of the project
    if (assigned_user_id) {
      const isMember = await ProjectMembership.findOne({ project_id: story.project_id, user_id: assigned_user_id });
      if (!isMember) return res.status(400).json({ message: 'Assigned user must be a member of this project' });
    }

    story.title = title;
    story.description = description;
    story.priority = priority;
    story.status = status;
    story.assigned_user_id = assigned_user_id || null;
    await story.save();

    res.json({ message: 'Story updated successfully', story });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// Delete a story
app.delete('/api/stories/:storyId', async (req, res) => {
  try {
    const story = await UserStory.findByIdAndDelete(req.params.storyId);
    if (!story) return res.status(404).json({ message: 'Story does not exist' });
    res.json({ message: 'Story deleted successfully' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));