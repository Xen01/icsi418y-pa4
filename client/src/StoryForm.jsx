import { useState, useEffect } from 'react';

export default function StoryForm({ projectId, existingStory, onSave, onCancel }) {
  const [form, setForm] = useState({ title: '', description: '', priority: 'Medium', status: 'To Do', assigned_user_id: '' });
  const [members, setMembers] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Fetch members of the selected project for the assignment dropdown
    fetch(`/api/projects/${projectId}/members`)
      .then(res => res.json())
      .then(data => setMembers(data));
      
    if (existingStory) {
      setForm({
        title: existingStory.title,
        description: existingStory.description,
        priority: existingStory.priority,
        status: existingStory.status,
        assigned_user_id: existingStory.assigned_user_id?._id || ''
      });
    }
  }, [projectId, existingStory]);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage('');
    const method = existingStory ? 'PUT' : 'POST';
    const url = existingStory ? `/api/stories/${existingStory._id}` : '/api/stories';
    const body = { ...form, project_id: projectId };

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) {
        onSave(); // Tell parent to refresh list and close form
      } else {
        setMessage(data.message);
      }
    } catch (err) { setMessage('Server error'); }
  };

  return (
    <form onSubmit={handleSubmit} style={{ border: '1px solid #007bff', padding: '15px', marginTop: '15px' }}>
      <h4>{existingStory ? 'Edit Story' : 'Create Story'}</h4>
      <input name="title" placeholder="Title" value={form.title} onChange={handleChange} />
      <textarea name="description" placeholder="As a [user], I want [goal], so that [benefit]" value={form.description} onChange={handleChange} rows="3" />
      
      <label>Priority:</label>
      <select name="priority" value={form.priority} onChange={handleChange}>
        <option value="High">High</option>
        <option value="Medium">Medium</option>
        <option value="Low">Low</option>
      </select>

      {existingStory && (
        <>
          <label>Status:</label>
          <select name="status" value={form.status} onChange={handleChange}>
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="Done">Done</option>
          </select>
        </>
      )}

      <label>Assigned Member:</label>
      <select name="assigned_user_id" value={form.assigned_user_id} onChange={handleChange}>
        <option value="">Unassigned</option>
        {members.map(m => (
          <option key={m.user_id._id} value={m.user_id._id}>{m.user_id.f_name} {m.user_id.l_name}</option>
        ))}
      </select>

      <div style={{ marginTop: '10px' }}>
        <button type="submit">Save</button>
        <button type="button" onClick={onCancel} style={{ marginLeft: '10px', backgroundColor: '#6c757d' }}>Cancel</button>
      </div>
      <p style={{ color: 'red' }}>{message}</p>
    </form>
  );
}