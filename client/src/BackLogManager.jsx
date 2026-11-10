import { useState, useEffect } from 'react';
import StoryForm from './StoryForm';

export default function BacklogManager() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [stories, setStories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingStory, setEditingStory] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/projects').then(res => res.json()).then(setProjects);
  }, []);

  const fetchStories = async (projectId) => {
    if (!projectId) return;
    const res = await fetch(`/api/projects/${projectId}/stories`);
    const data = await res.json();
    setStories(data);
  };

  const handleProjectChange = (e) => {
    const id = e.target.value;
    setSelectedProject(id);
    setShowForm(false);
    setEditingStory(null);
    setMessage('');
    fetchStories(id);
  };

  const handleDelete = async (storyId) => {
    if (!window.confirm("Are you sure you want to delete this story?")) return;
    const res = await fetch(`/api/stories/${storyId}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok) {
      setMessage('Story deleted successfully');
      fetchStories(selectedProject);
    } else {
      setMessage(data.message);
    }
  };

  const handleSave = () => {
    setShowForm(false);
    setEditingStory(null);
    fetchStories(selectedProject);
  };

  return (
    <div>
      <h3>Project Backlog</h3>
      <label>Select a Project: </label>
      <select value={selectedProject} onChange={handleProjectChange}>
        <option value="">-- Choose --</option>
        {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
      </select>

      {selectedProject && (
        <div style={{ marginTop: '20px' }}>
          <button onClick={() => { setShowForm(true); setEditingStory(null); }}>+ Add New Story</button>
          
          {showForm && (
            <StoryForm 
              projectId={selectedProject} 
              existingStory={editingStory} 
              onSave={handleSave} 
              onCancel={() => setShowForm(false)} 
            />
          )}

          <p style={{ color: 'green' }}>{message}</p>
          
          {stories.length === 0 && !showForm && <p>No stories in this backlog yet.</p>}

          <div style={{ display: 'grid', gap: '10px', marginTop: '15px' }}>
            {stories.map(s => (
              <div key={s._id} style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '5px' }}>
                <h4>{s.title} <span style={{ fontSize: '0.8em', color: '#666' }}>({s.priority} Priority)</span></h4>
                <p><strong>Status:</strong> {s.status}</p>
                <p><strong>Assigned to:</strong> {s.assigned_user_id ? `${s.assigned_user_id.f_name} ${s.assigned_user_id.l_name}` : 'Unassigned'}</p>
                <p><em>{s.description}</em></p>
                <button onClick={() => { setEditingStory(s); setShowForm(true); }}>Edit</button>
                <button onClick={() => handleDelete(s._id)} style={{ marginLeft: '10px', backgroundColor: '#dc3545' }}>Delete</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}