import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM notes ORDER BY created_at DESC');
    res.json(rows.map(r => ({
      id: r.id,
      title: r.title,
      content: r.content,
      category: r.category,
      imageUrl: r.image_url ?? undefined,
      date: new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    })));
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, content = '', category = 'General', imageUrl } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO notes (title, content, category, image_url) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, content, category, imageUrl ?? null]
    );
    const r = rows[0];
    res.status(201).json({
      id: r.id, title: r.title, content: r.content, category: r.category,
      imageUrl: r.image_url ?? undefined,
      date: new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, content, category, imageUrl } = req.body;
    const { rows } = await pool.query(
      'UPDATE notes SET title=$1, content=$2, category=$3, image_url=$4 WHERE id=$5 RETURNING *',
      [title, content, category, imageUrl ?? null, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    const r = rows[0];
    res.json({
      id: r.id, title: r.title, content: r.content, category: r.category,
      imageUrl: r.image_url ?? undefined,
      date: new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM notes WHERE id=$1', [req.params.id]);
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
