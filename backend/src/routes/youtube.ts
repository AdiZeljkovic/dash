import { Router } from 'express';
import pool from '../db.js';
import Parser from 'rss-parser';

const router = Router();

type YTItem = { id?: string; title?: string; link?: string; pubDate?: string; [key: string]: any };
const ytParser = new Parser<{}, YTItem>({
  timeout: 10000,
  headers: { 'User-Agent': 'Mozilla/5.0 Dashboard/1.0' },
  customFields: { item: [['yt:videoId', 'videoId'], ['media:group', 'mediaGroup']] },
});

// Cache resolved RSS URLs per channel URL
const ytRssCache = new Map<string, string>();

async function findYoutubeRssUrl(channelUrl: string): Promise<string> {
  const cached = ytRssCache.get(channelUrl);
  if (cached) return cached;

  // If URL already contains a channel ID (UC...)
  const idMatch = channelUrl.match(/channel\/(UC[\w-]+)/);
  if (idMatch) {
    const rss = `https://www.youtube.com/feeds/videos.xml?channel_id=${idMatch[1]}`;
    ytRssCache.set(channelUrl, rss);
    return rss;
  }

  // Fetch the channel page to find the RSS <link> tag
  const resp = await fetch(channelUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36' },
    signal: AbortSignal.timeout(10000),
  });
  const html = await resp.text();
  const rssMatch = html.match(/https:\/\/www\.youtube\.com\/feeds\/videos\.xml\?channel_id=[\w-]+/);
  if (!rssMatch) throw new Error(`No RSS link found on ${channelUrl}`);
  ytRssCache.set(channelUrl, rssMatch[0]);
  return rssMatch[0];
}

router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM youtube_channels ORDER BY created_at ASC');
    res.json(rows.map(r => ({ id: String(r.id), name: r.name, url: r.url })));
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Fetch real videos from all saved YouTube channels via RSS
router.get('/feed', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM youtube_channels ORDER BY created_at ASC');
    if (rows.length === 0) return res.json([]);

    const results = await Promise.allSettled(
      rows.map(async (channel) => {
        const rssUrl = await findYoutubeRssUrl(channel.url);
        const feed = await ytParser.parseURL(rssUrl);
        return (feed.items || []).slice(0, 10).map((item, i) => {
          const videoId: string = (item as any).videoId || item.id?.split(':').pop() || '';
          const thumbnail = (item as any).mediaGroup?.['media:thumbnail']?.[0]?.['$']?.url
            || (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : `https://picsum.photos/seed/${channel.name}${i}/600/400`);
          return {
            id: `${channel.id}-${videoId || i}`,
            title: item.title || 'Untitled',
            channelId: String(channel.id),
            channelName: channel.name,
            time: item.pubDate ? new Date(item.pubDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Unknown',
            thumbnail,
            url: item.link || channel.url,
            duration: '',
          };
        });
      })
    );

    const videos = results
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => (r as PromiseFulfilledResult<any[]>).value);

    res.json(videos);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, url } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO youtube_channels (name, url) VALUES ($1, $2) RETURNING *',
      [name, url]
    );
    const r = rows[0];
    res.status(201).json({ id: String(r.id), name: r.name, url: r.url });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM youtube_channels WHERE id=$1', [req.params.id]);
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
