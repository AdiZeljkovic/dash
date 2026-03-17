import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Dev mode: if DASHBOARD_PASSWORD is not set, skip auth entirely
  if (!process.env.DASHBOARD_PASSWORD) return next();

  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = auth.slice(7);
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token istekao ili nije validan' });
  }
}
