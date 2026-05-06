const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// GET all projects for logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT p.* FROM projects p
      LEFT JOIN project_members pm ON pm.project_id = p.id
      WHERE p.created_by = $1 OR pm.user_id = $1
      ORDER BY p.created_at DESC
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create project (Admin only)
router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'Admin')
    return res.status(403).json({ error: 'Admins only' });

  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Project name required' });

  try {
    const result = await pool.query(
      'INSERT INTO projects (name, description, created_by) VALUES ($1, $2, $3) RETURNING *',
      [name, description, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST add member to project
router.post('/:id/members', auth, async (req, res) => {
  if (req.user.role !== 'Admin')
    return res.status(403).json({ error: 'Admins only' });

  const { user_id } = req.body;
  try {
    await pool.query(
      'INSERT INTO project_members (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.params.id, user_id]
    );
    res.json({ message: 'Member added' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE project (Admin only)
router.delete('/:id', auth, async (req, res) => {
  if (req.user.role !== 'Admin')
    return res.status(403).json({ error: 'Admins only' });

  try {
    await pool.query('DELETE FROM projects WHERE id = $1 AND created_by = $2', [req.params.id, req.user.id]);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;