import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRouter    from './routes/auth.js';
import tasksRouter   from './routes/tasks.js';
import notesRouter   from './routes/notes.js';
import budgetRouter  from './routes/budget.js';
import booksRouter   from './routes/books.js';
import habitsRouter  from './routes/habits.js';
import goalsRouter   from './routes/goals.js';
import calendarRouter   from './routes/calendar.js';
import bookmarksRouter  from './routes/bookmarks.js';
import quickLinksRouter from './routes/quicklinks.js';
import crmRouter     from './routes/crm.js';
import newsRouter    from './routes/news.js';
import youtubeRouter from './routes/youtube.js';

import { requireAuth } from './middleware/auth.js';

dotenv.config();

const app  = express();
const PORT = Number(process.env.PORT) || 4000;

const ALLOWED_ORIGINS = (
  process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173,http://localhost:80,http://frontend'
).split(',');

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());

// ── Public routes (no auth required) ──────────────────────────────────────
app.use('/api/auth', authRouter);
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// ── Auth guard for all routes below ───────────────────────────────────────
app.use('/api', requireAuth);

// ── Protected routes ───────────────────────────────────────────────────────
app.use('/api/tasks',            tasksRouter);
app.use('/api/notes',            notesRouter);
app.use('/api',                  budgetRouter);
app.use('/api/books',            booksRouter);
app.use('/api/habits',           habitsRouter);
app.use('/api/goals',            goalsRouter);
app.use('/api/events',           calendarRouter);
app.use('/api/bookmarks',        bookmarksRouter);
app.use('/api/quick-links',      quickLinksRouter);
app.use('/api/crm',              crmRouter);
app.use('/api/news-sources',     newsRouter);
app.use('/api/youtube-channels', youtubeRouter);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend running on port ${PORT}`);
  if (!process.env.DASHBOARD_PASSWORD) {
    console.warn('⚠️  DASHBOARD_PASSWORD not set — auth is disabled (dev mode)');
  }
});
