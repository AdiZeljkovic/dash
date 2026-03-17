-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notes
CREATE TABLE IF NOT EXISTS notes (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  category TEXT DEFAULT 'General',
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budget transactions
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  date TEXT NOT NULL,
  category TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budget categories
CREATE TABLE IF NOT EXISTS budget_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  UNIQUE(name, type)
);

-- Books
CREATE TABLE IF NOT EXISTS books (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  status TEXT DEFAULT 'want-to-read' CHECK (status IN ('reading', 'want-to-read', 'read')),
  progress INTEGER DEFAULT 0,
  rating INTEGER,
  cover TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habits
CREATE TABLE IF NOT EXISTS habits (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'bg-blue-500',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS habit_completions (
  id SERIAL PRIMARY KEY,
  habit_id INTEGER REFERENCES habits(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  UNIQUE(habit_id, date)
);

-- Goals
CREATE TABLE IF NOT EXISTS goals (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  target_date TEXT,
  status TEXT DEFAULT 'on-track' CHECK (status IN ('on-track', 'at-risk', 'completed')),
  color TEXT DEFAULT 'emerald',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Calendar events
CREATE TABLE IF NOT EXISTS calendar_events (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT DEFAULT 'All Day',
  description TEXT DEFAULT '',
  color TEXT DEFAULT 'emerald',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookmarks
CREATE TABLE IF NOT EXISTS bookmarks (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT NOT NULL,
  show_on_dashboard BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quick links (Home widget)
CREATE TABLE IF NOT EXISTS quick_links (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CRM clients
CREATE TABLE IF NOT EXISTS crm_clients (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  contact TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Pending', 'Closed')),
  value TEXT DEFAULT 'KM 0',
  last_contact TEXT DEFAULT '',
  company TEXT DEFAULT '',
  address TEXT DEFAULT '',
  about TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_communications (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES crm_clients(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'note',
  date TEXT,
  subject TEXT DEFAULT '',
  preview TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_invoices (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES crm_clients(id) ON DELETE CASCADE,
  invoice_number TEXT,
  date TEXT,
  amount TEXT,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Paid', 'Pending', 'Overdue')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_documents (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES crm_clients(id) ON DELETE CASCADE,
  name TEXT,
  size TEXT DEFAULT '',
  date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- News sources
CREATE TABLE IF NOT EXISTS news_sources (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- YouTube channels
CREATE TABLE IF NOT EXISTS youtube_channels (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- INDEXES
-- =====================

CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_id ON habit_completions(habit_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_show_on_dashboard ON bookmarks(show_on_dashboard);
CREATE INDEX IF NOT EXISTS idx_crm_communications_client_id ON crm_communications(client_id);
CREATE INDEX IF NOT EXISTS idx_crm_invoices_client_id ON crm_invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_crm_documents_client_id ON crm_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_notes_category ON notes(category);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

-- =====================
-- SEED DATA
-- =====================

INSERT INTO budget_categories (name, type) VALUES
  ('Salary', 'income'), ('Freelance', 'income'), ('Investments', 'income'),
  ('Gifts', 'income'), ('Other Income', 'income'),
  ('Food', 'expense'), ('Utilities', 'expense'), ('Entertainment', 'expense'),
  ('Transport', 'expense'), ('Shopping', 'expense'), ('Health', 'expense'),
  ('Other Expense', 'expense')
ON CONFLICT DO NOTHING;

INSERT INTO bookmarks (title, url, category, show_on_dashboard) VALUES
  ('React Docs', 'https://react.dev', 'Dev', TRUE),
  ('Tailwind CSS', 'https://tailwindcss.com', 'Dev', TRUE),
  ('Framer Motion', 'https://www.framer.com/motion/', 'Design', TRUE),
  ('Dribbble', 'https://dribbble.com', 'Design', TRUE),
  ('Hacker News', 'https://news.ycombinator.com', 'News', TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO quick_links (name, url, icon) VALUES
  ('GitHub', 'https://github.com', 'https://github.githubassets.com/favicons/favicon.svg'),
  ('Gmail', 'https://mail.google.com', 'https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico'),
  ('YouTube', 'https://youtube.com', 'https://www.youtube.com/s/desktop/10c81068/img/favicon.ico'),
  ('Twitter', 'https://twitter.com', 'https://abs.twimg.com/favicons/twitter.3.ico')
ON CONFLICT DO NOTHING;

INSERT INTO news_sources (name, url, category) VALUES
  ('TechCrunch', 'https://techcrunch.com/feed', 'tech'),
  ('IGN', 'https://ign.com/feed', 'gaming'),
  ('Reuters', 'https://reuters.com/feed', 'world'),
  ('Sarajevo Times', 'https://sarajevotimes.com/feed', 'local')
ON CONFLICT DO NOTHING;

INSERT INTO youtube_channels (name, url) VALUES
  ('Marques Brownlee', 'https://youtube.com/c/mkbhd'),
  ('Fireship', 'https://youtube.com/c/fireship'),
  ('Veritasium', 'https://youtube.com/c/veritasium')
ON CONFLICT DO NOTHING;
