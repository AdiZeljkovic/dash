import { Router } from 'express';
import pool from '../db.js';

const router = Router();

const mapBm = (r: Record<string, unknown>) => ({
  id: String(r.id),
  title: r.title,
  url: r.url,
  category: r.category,
  showOnDashboard: r.show_on_dashboard,
});

router.get('/', async (req, res) => {
  try {
    let query = 'SELECT * FROM bookmarks ORDER BY created_at DESC';
    if (req.query.dashboard === 'true') {
      query = 'SELECT * FROM bookmarks WHERE show_on_dashboard=TRUE ORDER BY created_at DESC';
    }
    const { rows } = await pool.query(query);
    res.json(rows.map(mapBm));
  } catch (e) {
    console.error('GET /bookmarks error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, url, category, showOnDashboard = false } = req.body;
    if (!title || !url || !category) {
      return res.status(400).json({ error: 'Title, url, and category are required' });
    }
    const { rows } = await pool.query(
      'INSERT INTO bookmarks (title, url, category, show_on_dashboard) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, url, category, showOnDashboard]
    );
    res.status(201).json(mapBm(rows[0]));
  } catch (e) {
    console.error('POST /bookmarks error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Partial update — only overrides fields that are explicitly provided
router.put('/:id', async (req, res) => {
  try {
    const { rows: existing } = await pool.query('SELECT * FROM bookmarks WHERE id=$1', [req.params.id]);
    if (!existing.length) return res.status(404).json({ error: 'Not found' });
    const cur = existing[0];

    const title           = req.body.title           !== undefined ? req.body.title           : cur.title;
    const url             = req.body.url             !== undefined ? req.body.url             : cur.url;
    const category        = req.body.category        !== undefined ? req.body.category        : cur.category;
    const showOnDashboard = req.body.showOnDashboard !== undefined ? req.body.showOnDashboard : cur.show_on_dashboard;

    const { rows } = await pool.query(
      'UPDATE bookmarks SET title=$1, url=$2, category=$3, show_on_dashboard=$4 WHERE id=$5 RETURNING *',
      [title, url, category, showOnDashboard, req.params.id]
    );
    res.json(mapBm(rows[0]));
  } catch (e) {
    console.error('PUT /bookmarks/:id error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM bookmarks WHERE id=$1', [req.params.id]);
    res.status(204).send();
  } catch (e) {
    console.error('DELETE /bookmarks/:id error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
