import express from 'express';
import session from 'express-session';
import Database from 'better-sqlite3';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Setup Database
const db = new Database('grievances.db', { verbose: console.log });

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS grievances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    constituency TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'Pending',
    admin_notes TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'tvk-digital-super-secret-key-2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in HTTPS production
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// Admin credentials
const ADMIN_USER = 'admin';
const ADMIN_PASS = '123';

// Middleware to check if logged in
const requireAuth = (req, res, next) => {
  if (req.session && req.session.isAdmin) {
    next();
  } else {
    res.status(401).json({ success: false, message: 'Unauthorized. Please login.' });
  }
};

// API: Submit Grievance
app.post('/api/grievances', (req, res) => {
  try {
    const { name, phone, constituency, category, description } = req.body;
    
    if (!name || !phone || !constituency || !category || !description) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const insertStmt = db.prepare(`
      INSERT INTO grievances (name, phone, constituency, category, description)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = insertStmt.run(name, phone, constituency, category, description);
    const id = result.lastInsertRowid;
    
    // Generate an elegant, tracking ID
    const trackId = `TVK-GR-2026-${String(id).padStart(4, '0')}`;

    res.status(201).json({
      success: true,
      message: 'Grievance submitted successfully',
      trackId,
      data: { id, name, constituency, category, status: 'Pending' }
    });
  } catch (error) {
    console.error('Error submitting grievance:', error);
    res.status(500).json({ success: false, message: 'Failed to save grievance. Database error.' });
  }
});

// API: Admin Login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    req.session.isAdmin = true;
    res.json({ success: true, message: 'Login successful' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid username or password' });
  }
});

// API: Admin Logout
app.post('/api/admin/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Could not log out' });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true, message: 'Logout successful' });
  });
});

// API: Admin Check Status
app.get('/api/admin/status', (req, res) => {
  if (req.session && req.session.isAdmin) {
    res.json({ success: true, loggedIn: true });
  } else {
    res.json({ success: true, loggedIn: false });
  }
});

// API: Fetch All Grievances (Admin only)
app.get('/api/admin/grievances', requireAuth, (req, res) => {
  try {
    const grievances = db.prepare('SELECT * FROM grievances ORDER BY created_at DESC').all();
    res.json({ success: true, data: grievances });
  } catch (error) {
    console.error('Error fetching grievances:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// API: Update Grievance Status & Notes (Admin only)
app.put('/api/admin/grievances/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    const updateStmt = db.prepare(`
      UPDATE grievances 
      SET status = ?, admin_notes = ?
      WHERE id = ?
    `);

    const result = updateStmt.run(status, admin_notes || '', id);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Grievance not found' });
    }

    res.json({ success: true, message: 'Grievance updated successfully' });
  } catch (error) {
    console.error('Error updating grievance:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// API: Delete Grievance (Admin only)
app.delete('/api/admin/grievances/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const deleteStmt = db.prepare('DELETE FROM grievances WHERE id = ?');
    const result = deleteStmt.run(id);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Grievance not found' });
    }

    res.json({ success: true, message: 'Grievance deleted successfully' });
  } catch (error) {
    console.error('Error deleting grievance:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
