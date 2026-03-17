import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const { rows: habits } = await pool.query('SELECT * FROM habits ORDER BY created_at ASC');
    if (!habits.length) return res.json([]);

    // Single query for all completions — no N+1
    const habitIds = habits.map(h => h.id);
    const { rows: completions } = await pool.query(
      'SELECT habit_id, date FROM habit_completions WHERE habit_id = ANY($1)',
      [habitIds]
    );

    const completionMap: Record<number, string[]> = {};
    for (const c of completions) {
      if (!completionMap[c.habit_id]) completionMap[c.habit_id] = [];
      completionMap[c.habit_id].push(c.date);
    }

    res.json(habits.map(h => ({
      id: String(h.id),
      name: h.name,
      color: h.color,
      completedDates: completionMap[h.id] ?? [],
    })));
  } catch (e) {
    console.error('GET /habits error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, color } = req.body;
    if (!name || !color) {
      return res.status(400).json({ error: 'Name and color are required' });
    }
    const { rows } = await pool.query(
      'INSERT INTO habits (name, color) VALUES ($1, $2) RETURNING *',
      [name, color]
    );
    res.status(201).json({ id: String(rows[0].id), name: rows[0].name, color: rows[0].color, completedDates: [] });
  } catch (e) {
    console.error('POST /habits error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { rows: existing } = await pool.query('SELECT * FROM habits WHERE id=$1', [req.params.id]);
    if (!existing.length) return res.status(404).json({ error: 'Not found' });
    const cur = existing[0];

    const name  = req.body.name  !== undefined ? req.body.name  : cur.name;
    const color = req.body.color !== undefined ? req.body.color : cur.color;

    const { rows } = await pool.query(
      'UPDATE habits SET name=$1, color=$2 WHERE id=$3 RETURNING *',
      [name, color, req.params.id]
    );

    const { rows: completions } = await pool.query(
      'SELECT date FROM habit_completions WHERE habit_id=$1',
      [req.params.id]
    );

    res.json({
      id: String(rows[0].id),
      name: rows[0].name,
      color: rows[0].color,
      completedDates: completions.map(c => c.date),
    });
  } catch (e) {
    console.error('PUT /habits/:id error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM habits WHERE id=$1', [req.params.id]);
    res.status(204).send();
  } catch (e) {
    console.error('DELETE /habits/:id error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Toggle completion for a date (add if not exists, remove if exists)
router.post('/:id/toggle/:date', async (req, res) => {
  try {
    const { id, date } = req.params;
    const { rows } = await pool.query(
      'SELECT id FROM habit_completions WHERE habit_id=$1 AND date=$2',
      [id, date]
    );
    if (rows.length > 0) {
      await pool.query('DELETE FROM habit_completions WHERE habit_id=$1 AND date=$2', [id, date]);
    } else {
      await pool.query('INSERT INTO habit_completions (habit_id, date) VALUES ($1, $2)', [id, date]);
    }
    res.status(200).json({ toggled: rows.length === 0 ? 'added' : 'removed' });
  } catch (e) {
    console.error('POST /habits/:id/toggle/:date error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
