import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// Transactions
router.get('/transactions', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM transactions ORDER BY created_at DESC');
    res.json(rows.map(r => ({
      id: String(r.id),
      name: r.name,
      amount: parseFloat(r.amount),
      date: r.date,
      category: r.category,
      type: r.type,
    })));
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.post('/transactions', async (req, res) => {
  try {
    const { name, amount, date, category, type } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO transactions (name, amount, date, category, type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, amount, date, category, type]
    );
    const r = rows[0];
    res.status(201).json({ id: String(r.id), name: r.name, amount: parseFloat(r.amount), date: r.date, category: r.category, type: r.type });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.delete('/transactions/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM transactions WHERE id=$1', [req.params.id]);
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Budget categories
router.get('/budget-categories', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM budget_categories ORDER BY type, name');
    const income = rows.filter(r => r.type === 'income').map(r => r.name);
    const expense = rows.filter(r => r.type === 'expense').map(r => r.name);
    res.json({ income, expense });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.post('/budget-categories', async (req, res) => {
  try {
    const { name, type } = req.body;
    await pool.query(
      'INSERT INTO budget_categories (name, type) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [name, type]
    );
    const { rows } = await pool.query('SELECT * FROM budget_categories ORDER BY type, name');
    const income = rows.filter(r => r.type === 'income').map(r => r.name);
    const expense = rows.filter(r => r.type === 'expense').map(r => r.name);
    res.status(201).json({ income, expense });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
