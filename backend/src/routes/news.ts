import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM news_sources ORDER BY created_at ASC');
    res.json(rows.map(r => ({ id: String(r.id), name: r.name, url: r.url, category: r.category })));
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, url, category } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO news_sources (name, url, category) VALUES ($1, $2, $3) RETURNING *',
      [name, url, category]
    );
    const r = rows[0];
    res.status(201).json({ id: String(r.id), name: r.name, url: r.url, category: r.category });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM news_sources WHERE id=$1', [req.params.id]);
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
