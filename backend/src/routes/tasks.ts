import { Router } from 'express';
import pool from '../db.js';

const router = Router();

const mapTask = (r: Record<string, unknown>) => ({
  id: String(r.id),
  title: r.title,
  completed: r.completed,
  priority: r.priority,
  dueDate: r.due_date ?? undefined,
});

router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC');
    res.json(rows.map(mapTask));
  } catch (e) {
    console.error('GET /tasks error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, completed = false, priority = 'medium', dueDate } = req.body;
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    const validPriorities = ['low', 'medium', 'high'];
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({ error: 'Priority must be low, medium, or high' });
    }
    const { rows } = await pool.query(
      'INSERT INTO tasks (title, completed, priority, due_date) VALUES ($1, $2, $3, $4) RETURNING *',
      [title.trim(), Boolean(completed), priority, dueDate ?? null]
    );
    res.status(201).json(mapTask(rows[0]));
  } catch (e) {
    console.error('POST /tasks error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Partial update — only overrides fields that are explicitly provided
router.put('/:id', async (req, res) => {
  try {
    const { rows: existing } = await pool.query('SELECT * FROM tasks WHERE id=$1', [req.params.id]);
    if (!existing.length) return res.status(404).json({ error: 'Not found' });
    const cur = existing[0];

    const title     = req.body.title     !== undefined ? req.body.title     : cur.title;
    const completed = req.body.completed !== undefined ? req.body.completed : cur.completed;
    const priority  = req.body.priority  !== undefined ? req.body.priority  : cur.priority;
    const dueDate   = req.body.dueDate   !== undefined ? req.body.dueDate   : cur.due_date;

    const { rows } = await pool.query(
      'UPDATE tasks SET title=$1, completed=$2, priority=$3, due_date=$4 WHERE id=$5 RETURNING *',
      [title, Boolean(completed), priority, dueDate ?? null, req.params.id]
    );
    res.json(mapTask(rows[0]));
  } catch (e) {
    console.error('PUT /tasks/:id error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM tasks WHERE id=$1', [req.params.id]);
    res.status(204).send();
  } catch (e) {
    console.error('DELETE /tasks/:id error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
