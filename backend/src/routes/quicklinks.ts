import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM quick_links ORDER BY created_at ASC');
    res.json(rows.map(r => ({ id: String(r.id), name: r.name, url: r.url, icon: r.icon ?? '' })));
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, url, icon } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO quick_links (name, url, icon) VALUES ($1, $2, $3) RETURNING *',
      [name, url, icon ?? null]
    );
    const r = rows[0];
    res.status(201).json({ id: String(r.id), name: r.name, url: r.url, icon: r.icon ?? '' });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM quick_links WHERE id=$1', [req.params.id]);
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
