const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// GET all tasks (filter by project_id optionally)
router.get('/', auth, async (req, res) => {
  const { project_id } = req.query;
  try {
    let query = `
      SELECT t.*, u.name as assigned_name 
      FROM tasks t
      LEFT JOIN users u ON u.id = t.assigned_to
    `;
    const params = [];
    if (project_id) {
      query += ' WHERE t.project_id = $1';
      params.push(project_id);
    }
    query += ' ORDER BY t.created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create task
router.post('/', auth, async (req, res) => {
  const { title, description, status, due_date, assigned_to, project_id } = req.body;
  if (!title || !project_id)
    return res.status(400).json({ error: 'Title and project_id required' });

  try {
    const result = await pool.query(
      `INSERT INTO tasks (title, description, status, due_date, assigned_to, project_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title, description, status || 'todo', due_date || null, assigned_to || null, project_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update task (status, assignment)
router.put('/:id', auth, async (req, res) => {
  const { title, description, status, due_date, assigned_to } = req.body;
  try {
    const result = await pool.query(
      `UPDATE tasks SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        status = COALESCE($3, status),
        due_date = COALESCE($4, due_date),
        assigned_to = COALESCE($5, assigned_to)
       WHERE id = $6 RETURNING *`,
      [title, description, status, due_date, assigned_to, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE task
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;