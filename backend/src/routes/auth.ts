import { Router } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

const PASSWORD   = process.env.DASHBOARD_PASSWORD ?? '';
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production';

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { password } = req.body as { password?: string };

  // Dev mode: if no password is set in env, accept anything
  if (!PASSWORD) {
    const token = jwt.sign({ ok: true }, JWT_SECRET, { expiresIn: '30d' });
    return res.json({ token });
  }

  if (!password || password !== PASSWORD) {
    return res.status(401).json({ error: 'Pogrešna lozinka' });
  }

  const token = jwt.sign({ ok: true }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token });
});

// GET /api/auth/verify
router.get('/verify', (req, res) => {
  // Dev mode: if no password is set, always verify OK
  if (!PASSWORD) return res.json({ ok: true });

  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = auth.slice(7);
  try {
    jwt.verify(token, JWT_SECRET);
    res.json({ ok: true });
  } catch {
    res.status(401).json({ error: 'Token istekao ili nije validan' });
  }
});

export default router;
