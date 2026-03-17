import { Router } from 'express';
import pool from '../db.js';

const router = Router();

const mapBook = (r: Record<string, unknown>) => ({
  id: String(r.id),
  title: r.title,
  author: r.author,
  status: r.status,
  progress: r.progress ?? undefined,
  rating: r.rating ?? undefined,
  cover: r.cover ?? `https://picsum.photos/seed/${String(r.id)}/200/300`,
  notes: r.notes ?? undefined,
});

router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM books ORDER BY created_at DESC');
    res.json(rows.map(mapBook));
  } catch (e) {
    console.error('GET /books error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, author, status = 'want-to-read', cover, notes } = req.body;
    if (!title || !author) {
      return res.status(400).json({ error: 'Title and author are required' });
    }
    const { rows } = await pool.query(
      'INSERT INTO books (title, author, status, cover, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, author, status, cover ?? null, notes ?? null]
    );
    res.status(201).json(mapBook(rows[0]));
  } catch (e) {
    console.error('POST /books error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Partial update — only overrides fields that are explicitly provided
router.put('/:id', async (req, res) => {
  try {
    const { rows: existing } = await pool.query('SELECT * FROM books WHERE id=$1', [req.params.id]);
    if (!existing.length) return res.status(404).json({ error: 'Not found' });
    const cur = existing[0];

    const title    = req.body.title    !== undefined ? req.body.title    : cur.title;
    const author   = req.body.author   !== undefined ? req.body.author   : cur.author;
    const status   = req.body.status   !== undefined ? req.body.status   : cur.status;
    const progress = req.body.progress !== undefined ? req.body.progress : cur.progress;
    const rating   = req.body.rating   !== undefined ? req.body.rating   : cur.rating;
    const cover    = req.body.cover    !== undefined ? req.body.cover    : cur.cover;
    const notes    = req.body.notes    !== undefined ? req.body.notes    : cur.notes;

    const { rows } = await pool.query(
      'UPDATE books SET title=$1, author=$2, status=$3, progress=$4, rating=$5, cover=$6, notes=$7 WHERE id=$8 RETURNING *',
      [title, author, status, progress ?? null, rating ?? null, cover ?? null, notes ?? null, req.params.id]
    );
    res.json(mapBook(rows[0]));
  } catch (e) {
    console.error('PUT /books/:id error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM books WHERE id=$1', [req.params.id]);
    res.status(204).send();
  } catch (e) {
    console.error('DELETE /books/:id error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
