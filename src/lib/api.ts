const BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('dashboard_token');
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  // Token expired or invalid — trigger global logout
  if (res.status === 401) {
    localStorage.removeItem('dashboard_token');
    window.dispatchEvent(new Event('auth:logout'));
    const err = await res.json().catch(() => ({ error: 'Sesija je istekla' }));
    throw new Error(err.error || 'Sesija je istekla. Prijavite se ponovo.');
  }

  if (res.status === 204) return undefined as T;

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `Request failed (${res.status})`);
  }

  return res.json();
}

const get  = <T>(path: string)               => request<T>(path);
const post = <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) });
const put  = <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT',  body: JSON.stringify(body) });
const del  = (path: string)                   => request<void>(path, { method: 'DELETE' });

export const api = {
  tasks: {
    getAll: () => get<Task[]>('/tasks'),
    create: (data: Omit<Task, 'id'>) => post<Task>('/tasks', data),
    update: (id: string, data: Partial<Task>) => put<Task>(`/tasks/${id}`, data),
    remove: (id: string) => del(`/tasks/${id}`),
  },
  notes: {
    getAll: () => get<Note[]>('/notes'),
    create: (data: Omit<Note, 'id' | 'date'>) => post<Note>('/notes', data),
    update: (id: number, data: Partial<Note>) => put<Note>(`/notes/${id}`, data),
    remove: (id: number) => del(`/notes/${id}`),
  },
  budget: {
    getTransactions: () => get<Transaction[]>('/transactions'),
    createTransaction: (data: Omit<Transaction, 'id'>) => post<Transaction>('/transactions', data),
    removeTransaction: (id: string) => del(`/transactions/${id}`),
    getCategories: () => get<BudgetCategories>('/budget-categories'),
    addCategory: (name: string, type: 'income' | 'expense') => post<BudgetCategories>('/budget-categories', { name, type }),
  },
  books: {
    getAll: () => get<Book[]>('/books'),
    create: (data: Omit<Book, 'id'>) => post<Book>('/books', data),
    update: (id: string, data: Partial<Book>) => put<Book>(`/books/${id}`, data),
    remove: (id: string) => del(`/books/${id}`),
  },
  habits: {
    getAll: () => get<Habit[]>('/habits'),
    create: (data: { name: string; color: string }) => post<Habit>('/habits', data),
    update: (id: string, data: Partial<{ name: string; color: string }>) => put<Habit>(`/habits/${id}`, data),
    remove: (id: string) => del(`/habits/${id}`),
    toggle: (id: string, date: string) => post<{ toggled: string }>(`/habits/${id}/toggle/${date}`, {}),
  },
  goals: {
    getAll: () => get<Goal[]>('/goals'),
    create: (data: Omit<Goal, 'id'>) => post<Goal>('/goals', data),
    update: (id: string, data: Partial<Goal>) => put<Goal>(`/goals/${id}`, data),
    remove: (id: string) => del(`/goals/${id}`),
  },
  calendar: {
    getAll: () => get<CalendarEvent[]>('/events'),
    create: (data: Omit<CalendarEvent, 'id'>) => post<CalendarEvent>('/events', data),
    update: (id: string, data: Partial<CalendarEvent>) => put<CalendarEvent>(`/events/${id}`, data),
    remove: (id: string) => del(`/events/${id}`),
  },
  bookmarks: {
    getAll: () => get<BookmarkItem[]>('/bookmarks'),
    getDashboard: () => get<BookmarkItem[]>('/bookmarks?dashboard=true'),
    create: (data: Omit<BookmarkItem, 'id'>) => post<BookmarkItem>('/bookmarks', data),
    update: (id: string, data: Partial<BookmarkItem>) => put<BookmarkItem>(`/bookmarks/${id}`, data),
    remove: (id: string) => del(`/bookmarks/${id}`),
  },
  quickLinks: {
    getAll: () => get<QuickLink[]>('/quick-links'),
    create: (data: Omit<QuickLink, 'id'>) => post<QuickLink>('/quick-links', data),
    remove: (id: string) => del(`/quick-links/${id}`),
  },
  crm: {
    getAll: () => get<CRMClient[]>('/crm/clients'),
    create: (data: Partial<CRMClient>) => post<CRMClient>('/crm/clients', data),
    update: (id: number, data: Partial<CRMClient>) => put<CRMClient>(`/crm/clients/${id}`, data),
    remove: (id: number) => del(`/crm/clients/${id}`),
    addCommunication: (clientId: number, data: { preview: string }) =>
      post<CRMCommunication>(`/crm/clients/${clientId}/communications`, data),
  },
  news: {
    getSources: () => get<NewsSource[]>('/news-sources'),
    addSource: (data: Omit<NewsSource, 'id'>) => post<NewsSource>('/news-sources', data),
    removeSource: (id: string) => del(`/news-sources/${id}`),
  },
  youtube: {
    getChannels: () => get<YTChannel[]>('/youtube-channels'),
    addChannel: (data: Omit<YTChannel, 'id'>) => post<YTChannel>('/youtube-channels', data),
    removeChannel: (id: string) => del(`/youtube-channels/${id}`),
  },
};

// --- Shared types ---
export type Task = {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
};

export type Note = {
  id: number;
  title: string;
  content: string;
  date: string;
  category: string;
  imageUrl?: string;
};

export type Transaction = {
  id: string;
  name: string;
  amount: number;
  date: string;
  category: string;
  type: 'income' | 'expense';
};

export type BudgetCategories = {
  income: string[];
  expense: string[];
};

export type Book = {
  id: string;
  title: string;
  author: string;
  status: 'reading' | 'want-to-read' | 'read';
  progress?: number;
  rating?: number;
  cover: string;
  notes?: string;
};

export type Habit = {
  id: string;
  name: string;
  color: string;
  completedDates: string[];
};

export type Goal = {
  id: string;
  title: string;
  description: string;
  progress: number;
  targetDate: string;
  status: 'on-track' | 'at-risk' | 'completed';
  color: 'emerald' | 'orange' | 'blue' | 'purple' | 'pink';
};

export type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  time: string;
  description: string;
  color: string;
};

export type BookmarkItem = {
  id: string;
  title: string;
  url: string;
  category: string;
  showOnDashboard: boolean;
};

export type QuickLink = {
  id: string;
  name: string;
  url: string;
  icon: string;
};

export type CRMCommunication = {
  id: number;
  type: string;
  date: string;
  subject: string;
  preview: string;
};

export type CRMClient = {
  id: number;
  name: string;
  contact: string;
  phone: string;
  status: string;
  value: string;
  lastContact: string;
  company: string;
  address: string;
  about: string;
  communications: CRMCommunication[];
  invoices: { id: string; date: string; amount: string; status: string }[];
  documents: { id: number; name: string; size: string; date: string }[];
};

export type NewsSource = {
  id: string;
  name: string;
  url: string;
  category: string;
};

export type YTChannel = {
  id: string;
  name: string;
  url: string;
};
