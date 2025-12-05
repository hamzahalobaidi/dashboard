// API Backend for Dashboard Data Synchronization
// يحفظ واسترجع بيانات الداشبورد من قاعدة البيانات

const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize SQLite Database
const dbPath = path.join(__dirname, 'dashboard.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Database connection error:', err);
    } else {
        console.log('Connected to SQLite database');
        initializeDatabase();
    }
});

// Initialize Database Tables
function initializeDatabase() {
    db.run(`
        CREATE TABLE IF NOT EXISTS dashboard_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key TEXT UNIQUE,
            value TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_by TEXT
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS sync_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            action TEXT,
            key TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            device_id TEXT
        )
    `);

    console.log('Database tables initialized');
}

// API Routes

// Get all dashboard data
app.get('/api/dashboard/data', (req, res) => {
    db.all('SELECT key, value, updated_at FROM dashboard_data', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        const data = {};
        rows.forEach(row => {
            try {
                data[row.key] = JSON.parse(row.value);
            } catch (e) {
                data[row.key] = row.value;
            }
        });

        res.json(data);
    });
});

// Get specific data by key
app.get('/api/dashboard/data/:key', (req, res) => {
    const { key } = req.params;
    
    db.get('SELECT value, updated_at FROM dashboard_data WHERE key = ?', [key], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        if (!row) {
            res.status(404).json({ error: 'Data not found' });
            return;
        }

        try {
            const value = JSON.parse(row.value);
            res.json({ key, value, updated_at: row.updated_at });
        } catch (e) {
            res.json({ key, value: row.value, updated_at: row.updated_at });
        }
    });
});

// Save or update dashboard data
app.post('/api/dashboard/data', (req, res) => {
    const { key, value, deviceId } = req.body;

    if (!key || value === undefined) {
        res.status(400).json({ error: 'Missing key or value' });
        return;
    }

    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

    db.run(
        `INSERT OR REPLACE INTO dashboard_data (key, value, updated_by)
         VALUES (?, ?, ?)`,
        [key, stringValue, deviceId || 'unknown'],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            // Log the sync action
            db.run(
                `INSERT INTO sync_log (action, key, device_id)
                 VALUES (?, ?, ?)`,
                ['save', key, deviceId || 'unknown']
            );

            res.json({ success: true, key, message: 'Data saved successfully' });
        }
    );
});

// Save multiple data items
app.post('/api/dashboard/data/batch', (req, res) => {
    const { items, deviceId } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
        res.status(400).json({ error: 'Invalid items array' });
        return;
    }

    let completed = 0;
    let errors = [];

    items.forEach(item => {
        const { key, value } = item;
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

        db.run(
            `INSERT OR REPLACE INTO dashboard_data (key, value, updated_by)
             VALUES (?, ?, ?)`,
            [key, stringValue, deviceId || 'unknown'],
            function(err) {
                if (err) {
                    errors.push({ key, error: err.message });
                } else {
                    db.run(
                        `INSERT INTO sync_log (action, key, device_id)
                         VALUES (?, ?, ?)`,
                        ['batch_save', key, deviceId || 'unknown']
                    );
                }

                completed++;

                if (completed === items.length) {
                    if (errors.length > 0) {
                        res.status(207).json({ 
                            success: false, 
                            message: 'Some items failed to save',
                            errors 
                        });
                    } else {
                        res.json({ 
                            success: true, 
                            message: `${items.length} items saved successfully` 
                        });
                    }
                }
            }
        );
    });
});

// Delete specific data
app.delete('/api/dashboard/data/:key', (req, res) => {
    const { key } = req.params;
    const { deviceId } = req.body;

    db.run('DELETE FROM dashboard_data WHERE key = ?', [key], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        // Log the sync action
        db.run(
            `INSERT INTO sync_log (action, key, device_id)
             VALUES (?, ?, ?)`,
            ['delete', key, deviceId || 'unknown']
        );

        res.json({ success: true, message: 'Data deleted successfully' });
    });
});

// Get sync log
app.get('/api/dashboard/sync-log', (req, res) => {
    const { limit = 100 } = req.query;

    db.all(
        'SELECT * FROM sync_log ORDER BY timestamp DESC LIMIT ?',
        [limit],
        (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            res.json(rows);
        }
    );
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log(`Dashboard API server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('Database connection closed');
        }
        process.exit(0);
    });
});

module.exports = app;
