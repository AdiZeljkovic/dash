import { Router } from 'express';
import pool from '../db.js';
import Parser from 'rss-parser';

const router = Router();
const rssParser = new Parser({ timeout: 8000, headers: { 'User-Agent': 'Mozilla/5.0 Dashboard/1.0' } });

router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM news_sources ORDER BY created_at ASC');
    res.json(rows.map(r => ({ id: String(r.id), name: r.name, url: r.url, category: r.category })));
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Fetch real articles from all RSS sources
router.get('/feed', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM news_sources ORDER BY created_at ASC');
    if (rows.length === 0) return res.json([]);

    const results = await Promise.allSettled(
      rows.map(async (source) => {
        const feed = await rssParser.parseURL(source.url);
        return (feed.items || []).slice(0, 10).map((item, i) => ({
          id: `${source.id}-${i}-${Date.now()}`,
          title: item.title || 'Untitled',
          sourceId: String(source.id),
          sourceName: source.name,
          category: source.category,
          time: item.pubDate ? new Date(item.pubDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Unknown',
          image: (item as any).enclosure?.url || (item as any)['media:content']?.['$']?.url || `https://picsum.photos/seed/${source.name.replace(/\s+/g, '')}${i}/600/400`,
          url: item.link || source.url,
        }));
      })
    );

    const articles = results
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => (r as PromiseFulfilledResult<any[]>).value);

    res.json(articles);
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
