import { Router } from 'express';
import pool from '../db.js';

const router = Router();

const mapEvent = (r: Record<string, unknown>) => ({
  id: String(r.id),
  title: r.title,
  date: r.date,
  time: r.time,
  description: r.description,
  color: r.color,
});

router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM calendar_events ORDER BY date ASC');
    res.json(rows.map(mapEvent));
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, date, time = 'All Day', description = '', color = 'emerald' } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO calendar_events (title, date, time, description, color) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, date, time, description, color]
    );
    res.status(201).json(mapEvent(rows[0]));
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, date, time, description, color } = req.body;
    const { rows } = await pool.query(
      'UPDATE calendar_events SET title=$1, date=$2, time=$3, description=$4, color=$5 WHERE id=$6 RETURNING *',
      [title, date, time, description, color, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(mapEvent(rows[0]));
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM calendar_events WHERE id=$1', [req.params.id]);
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
