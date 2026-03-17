import { Router } from 'express';
import pool from '../db.js';

const router = Router();

const mapClient = (client: Record<string, unknown>, comms: unknown[], invs: unknown[], docs: unknown[]) => ({
  id: client.id,
  name: client.name,
  contact: client.contact,
  phone: client.phone,
  status: client.status,
  value: client.value,
  lastContact: client.last_contact,
  company: client.company,
  address: client.address,
  about: client.about,
  communications: (comms as Record<string, unknown>[]).map(c => ({ id: c.id, type: c.type, date: c.date, subject: c.subject, preview: c.preview })),
  invoices: (invs as Record<string, unknown>[]).map(i => ({ id: i.invoice_number, date: i.date, amount: i.amount, status: i.status })),
  documents: (docs as Record<string, unknown>[]).map(d => ({ id: d.id, name: d.name, size: d.size, date: d.date })),
});

// Clients list — single query, no nested data (for list view performance)
router.get('/clients', async (_req, res) => {
  try {
    const { rows: clients } = await pool.query('SELECT * FROM crm_clients ORDER BY created_at DESC');
    if (!clients.length) return res.json([]);

    const clientIds = clients.map(c => c.id);

    // Fetch all nested data in 3 queries total instead of 3 queries × N clients
    const [{ rows: allComms }, { rows: allInvs }, { rows: allDocs }] = await Promise.all([
      pool.query('SELECT * FROM crm_communications WHERE client_id = ANY($1) ORDER BY created_at DESC', [clientIds]),
      pool.query('SELECT * FROM crm_invoices WHERE client_id = ANY($1) ORDER BY created_at DESC', [clientIds]),
      pool.query('SELECT * FROM crm_documents WHERE client_id = ANY($1) ORDER BY created_at DESC', [clientIds]),
    ]);

    const result = clients.map(client => {
      const comms = allComms.filter(c => c.client_id === client.id);
      const invs  = allInvs.filter(i => i.client_id === client.id);
      const docs  = allDocs.filter(d => d.client_id === client.id);
      return mapClient(client, comms, invs, docs);
    });

    res.json(result);
  } catch (e) {
    console.error('GET /crm/clients error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/clients', async (req, res) => {
  try {
    const { name, contact = '', phone = '', status = 'Active', value = 'KM 0', lastContact = '', company = '', address = '', about = '' } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const { rows } = await pool.query(
      'INSERT INTO crm_clients (name, contact, phone, status, value, last_contact, company, address, about) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [name, contact, phone, status, value, lastContact, company, address, about]
    );
    res.status(201).json(mapClient(rows[0], [], [], []));
  } catch (e) {
    console.error('POST /crm/clients error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/clients/:id', async (req, res) => {
  try {
    const { rows: existing } = await pool.query('SELECT * FROM crm_clients WHERE id=$1', [req.params.id]);
    if (!existing.length) return res.status(404).json({ error: 'Not found' });
    const cur = existing[0];

    const name        = req.body.name        !== undefined ? req.body.name        : cur.name;
    const contact     = req.body.contact     !== undefined ? req.body.contact     : cur.contact;
    const phone       = req.body.phone       !== undefined ? req.body.phone       : cur.phone;
    const status      = req.body.status      !== undefined ? req.body.status      : cur.status;
    const value       = req.body.value       !== undefined ? req.body.value       : cur.value;
    const lastContact = req.body.lastContact !== undefined ? req.body.lastContact : cur.last_contact;
    const company     = req.body.company     !== undefined ? req.body.company     : cur.company;
    const address     = req.body.address     !== undefined ? req.body.address     : cur.address;
    const about       = req.body.about       !== undefined ? req.body.about       : cur.about;

    const { rows } = await pool.query(
      'UPDATE crm_clients SET name=$1, contact=$2, phone=$3, status=$4, value=$5, last_contact=$6, company=$7, address=$8, about=$9 WHERE id=$10 RETURNING *',
      [name, contact, phone, status, value, lastContact, company, address, about, req.params.id]
    );

    const [{ rows: comms }, { rows: invs }, { rows: docs }] = await Promise.all([
      pool.query('SELECT * FROM crm_communications WHERE client_id=$1 ORDER BY created_at DESC', [req.params.id]),
      pool.query('SELECT * FROM crm_invoices WHERE client_id=$1 ORDER BY created_at DESC', [req.params.id]),
      pool.query('SELECT * FROM crm_documents WHERE client_id=$1 ORDER BY created_at DESC', [req.params.id]),
    ]);

    res.json(mapClient(rows[0], comms, invs, docs));
  } catch (e) {
    console.error('PUT /crm/clients/:id error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/clients/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM crm_clients WHERE id=$1', [req.params.id]);
    res.status(204).send();
  } catch (e) {
    console.error('DELETE /crm/clients/:id error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Communications
router.post('/clients/:id/communications', async (req, res) => {
  try {
    const { type = 'note', date, subject = 'Manual Note', preview } = req.body;
    const now = date ?? new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const { rows } = await pool.query(
      'INSERT INTO crm_communications (client_id, type, date, subject, preview) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [req.params.id, type, now, subject, preview]
    );
    const c = rows[0];
    res.status(201).json({ id: c.id, type: c.type, date: c.date, subject: c.subject, preview: c.preview });
  } catch (e) {
    console.error('POST /crm/clients/:id/communications error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Invoices
router.post('/clients/:id/invoices', async (req, res) => {
  try {
    const { invoiceNumber, date, amount, status = 'Pending' } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO crm_invoices (client_id, invoice_number, date, amount, status) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [req.params.id, invoiceNumber, date, amount, status]
    );
    const i = rows[0];
    res.status(201).json({ id: i.invoice_number, date: i.date, amount: i.amount, status: i.status });
  } catch (e) {
    console.error('POST /crm/clients/:id/invoices error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
