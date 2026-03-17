import { Router } from 'express';
import pool from '../db.js';

const router = Router();

const mapGoal = (r: Record<string, unknown>) => ({
  id: String(r.id),
  title: r.title,
  description: r.description,
  progress: r.progress,
  targetDate: r.target_date,
  status: r.status,
  color: r.color,
});

router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM goals ORDER BY created_at DESC');
    res.json(rows.map(mapGoal));
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, description = '', progress = 0, targetDate, status = 'on-track', color = 'emerald' } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO goals (title, description, progress, target_date, status, color) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, description, progress, targetDate ?? null, status, color]
    );
    res.status(201).json(mapGoal(rows[0]));
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, description, progress, targetDate, status, color } = req.body;
    const { rows } = await pool.query(
      'UPDATE goals SET title=$1, description=$2, progress=$3, target_date=$4, status=$5, color=$6 WHERE id=$7 RETURNING *',
      [title, description, progress, targetDate ?? null, status, color, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(mapGoal(rows[0]));
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM goals WHERE id=$1', [req.params.id]);
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
