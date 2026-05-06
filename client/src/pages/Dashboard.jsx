import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: '', description: '' });
  const [taskForm, setTaskForm] = useState({ title: '', description: '', status: 'todo', due_date: '', assigned_to: '' });
  const [members, setMembers] = useState([]);

  useEffect(() => { fetchProjects(); }, []);
  useEffect(() => { if (activeProject) { fetchTasks(activeProject.id); fetchMembers(); } }, [activeProject]);

  const fetchProjects = async () => {
    const { data } = await API.get('/projects');
    setProjects(data);
    if (data.length > 0 && !activeProject) setActiveProject(data[0]);
  };

  const fetchTasks = async (projectId) => {
    const { data } = await API.get(`/tasks?project_id=${projectId}`);
    setTasks(data);
  };

  const fetchMembers = async () => {
    try {
      const { data } = await API.get('/auth/users');
      setMembers(data);
    } catch { setMembers([]); }
  };

  const createProject = async (e) => {
    e.preventDefault();
    await API.post('/projects', projectForm);
    setProjectForm({ name: '', description: '' });
    setShowProjectForm(false);
    fetchProjects();
  };

  const createTask = async (e) => {
    e.preventDefault();
    await API.post('/tasks', { ...taskForm, project_id: activeProject.id });
    setTaskForm({ title: '', description: '', status: 'todo', due_date: '', assigned_to: '' });
    setShowTaskForm(false);
    fetchTasks(activeProject.id);
  };

  const updateTaskStatus = async (taskId, status) => {
    await API.put(`/tasks/${taskId}`, { status });
    fetchTasks(activeProject.id);
  };

  const deleteTask = async (taskId) => {
    await API.delete(`/tasks/${taskId}`);
    fetchTasks(activeProject.id);
  };

  const deleteProject = async (projectId) => {
    await API.delete(`/projects/${projectId}`);
    setActiveProject(null);
    fetchProjects();
  };

  const columns = [
    { key: 'todo', label: 'To Do', color: '#64748b' },
    { key: 'in-progress', label: 'In Progress', color: '#f59e0b' },
    { key: 'done', label: 'Done', color: '#10b981' },
  ];

  const totalTasks = tasks.length;
  const inProgress = tasks.filter(t => t.status === 'in-progress').length;
  const done = tasks.filter(t => t.status === 'done').length;
  const overdue = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>

      {/* Sidebar */}
      <div style={{
        width: '260px', minHeight: '100vh', background: 'var(--bg-card)',
        borderRight: '1px solid var(--border)', padding: '24px 16px',
        display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0
      }}>
        <div style={{ padding: '8px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--accent)' }}>⚡ TaskFlow</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{user?.role}</p>
        </div>

        <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', padding: '0 8px' }}>Projects</p>

        {projects.map(p => (
          <div key={p.id} onClick={() => setActiveProject(p)}
            style={{
              padding: '10px 12px', borderRadius: '8px', cursor: 'pointer',
              background: activeProject?.id === p.id ? '#6366f120' : 'transparent',
              border: activeProject?.id === p.id ? '1px solid #6366f140' : '1px solid transparent',
              color: activeProject?.id === p.id ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: '14px', transition: 'all 0.2s'
            }}>
            📁 {p.name}
          </div>
        ))}

        {user?.role === 'Admin' && (
          <button onClick={() => setShowProjectForm(true)} style={{
            marginTop: '8px', padding: '10px 12px', borderRadius: '8px',
            background: 'transparent', border: '1px dashed var(--border)',
            color: 'var(--text-muted)', fontSize: '14px', textAlign: 'left',
            transition: 'all 0.2s'
          }}>+ New Project</button>
        )}

        <div style={{ marginTop: 'auto', padding: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'var(--accent)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '13px', fontWeight: '700'
            }}>{user?.name?.[0]}</div>
            <div>
              <p style={{ fontSize: '13px', fontWeight: '600' }}>{user?.name}</p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user?.email}</p>
            </div>
          </div>
          <button onClick={logout} style={{
            width: '100%', padding: '8px', borderRadius: '8px',
            background: 'transparent', border: '1px solid var(--border)',
            color: 'var(--text-muted)', fontSize: '13px'
          }}>Logout</button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '700' }}>
            {activeProject ? activeProject.name : 'Select a project'}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
            {activeProject?.description || 'Choose a project from the sidebar'}
          </p>
        </div>

        {activeProject && <>
          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
            {[
              { label: 'Total Tasks', value: totalTasks, color: '#6366f1' },
              { label: 'In Progress', value: inProgress, color: '#f59e0b' },
              { label: 'Completed', value: done, color: '#10b981' },
              { label: 'Overdue', value: overdue, color: '#ef4444' },
            ].map(stat => (
              <div key={stat.label} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: '12px', padding: '20px',
                borderTop: `3px solid ${stat.color}`
              }}>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>{stat.label}</p>
                <p style={{ fontSize: '28px', fontWeight: '700', color: stat.color }}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Task board header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600' }}>Task Board</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowTaskForm(true)} style={{
                padding: '8px 16px', borderRadius: '8px',
                background: 'var(--accent)', border: 'none',
                color: '#fff', fontSize: '14px', fontWeight: '600'
              }}>+ Add Task</button>
              {user?.role === 'Admin' && (
                <button onClick={() => deleteProject(activeProject.id)} style={{
                  padding: '8px 16px', borderRadius: '8px',
                  background: 'transparent', border: '1px solid #ef4444',
                  color: '#ef4444', fontSize: '14px'
                }}>Delete Project</button>
              )}
            </div>
          </div>

          {/* Kanban columns */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {columns.map(col => (
              <div key={col.key} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: '12px', padding: '16px', minHeight: '400px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.color }} />
                  <span style={{ fontSize: '13px', fontWeight: '600', color: col.color }}>{col.label}</span>
                  <span style={{
                    marginLeft: 'auto', background: col.color + '20',
                    color: col.color, borderRadius: '20px',
                    padding: '2px 8px', fontSize: '12px'
                  }}>{tasks.filter(t => t.status === col.key).length}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {tasks.filter(t => t.status === col.key).map(task => (
                    <div key={task.id} style={{
                      background: 'var(--bg-card-hover)', border: '1px solid var(--border)',
                      borderRadius: '10px', padding: '14px'
                    }}>
                      <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>{task.title}</p>
                      {task.description && (
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>{task.description}</p>
                      )}
                      {task.due_date && (
                        <p style={{
                          fontSize: '11px', marginBottom: '10px',
                          color: new Date(task.due_date) < new Date() && task.status !== 'done' ? '#ef4444' : 'var(--text-muted)'
                        }}>📅 {new Date(task.due_date).toLocaleDateString()}</p>
                      )}
                      {task.assigned_name && (
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px' }}>👤 {task.assigned_name}</p>
                      )}
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {columns.filter(c => c.key !== col.key).map(c => (
                          <button key={c.key} onClick={() => updateTaskStatus(task.id, c.key)} style={{
                            padding: '4px 8px', borderRadius: '6px', fontSize: '11px',
                            background: c.color + '20', border: `1px solid ${c.color}40`,
                            color: c.color, cursor: 'pointer'
                          }}>→ {c.label}</button>
                        ))}
                        <button onClick={() => deleteTask(task.id)} style={{
                          padding: '4px 8px', borderRadius: '6px', fontSize: '11px',
                          background: '#ef444420', border: '1px solid #ef444440',
                          color: '#ef4444', cursor: 'pointer', marginLeft: 'auto'
                        }}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>}
      </div>

      {/* Project Modal */}
      {showProjectForm && (
        <div style={{
          position: 'fixed', inset: 0, background: '#00000080',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
        }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '16px', padding: '32px', width: '420px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '24px' }}>New Project</h3>
            <form onSubmit={createProject} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input placeholder="Project name" value={projectForm.name}
                onChange={e => setProjectForm({ ...projectForm, name: e.target.value })} required />
              <textarea placeholder="Description (optional)" value={projectForm.description}
                onChange={e => setProjectForm({ ...projectForm, description: e.target.value })}
                rows={3} style={{ resize: 'none' }} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setShowProjectForm(false)} style={{
                  flex: 1, padding: '10px', borderRadius: '8px',
                  background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)'
                }}>Cancel</button>
                <button type="submit" style={{
                  flex: 1, padding: '10px', borderRadius: '8px',
                  background: 'var(--accent)', border: 'none', color: '#fff', fontWeight: '600'
                }}>Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {showTaskForm && (
        <div style={{
          position: 'fixed', inset: 0, background: '#00000080',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
        }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '16px', padding: '32px', width: '420px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '24px' }}>New Task</h3>
            <form onSubmit={createTask} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input placeholder="Task title" value={taskForm.title}
                onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} required />
              <textarea placeholder="Description (optional)" value={taskForm.description}
                onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                rows={3} style={{ resize: 'none' }} />
              <select value={taskForm.status} onChange={e => setTaskForm({ ...taskForm, status: e.target.value })}>
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
              <input type="date" value={taskForm.due_date}
                onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })} />
                <select value={taskForm.assigned_to}
                  onChange={e => setTaskForm({ ...taskForm, assigned_to: e.target.value })}>
                  <option value="">Unassigned</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                  ))}
                </select>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setShowTaskForm(false)} style={{
                  flex: 1, padding: '10px', borderRadius: '8px',
                  background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)'
                }}>Cancel</button>
                <button type="submit" style={{
                  flex: 1, padding: '10px', borderRadius: '8px',
                  background: 'var(--accent)', border: 'none', color: '#fff', fontWeight: '600'
                }}>Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}