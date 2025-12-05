/**
 * Vercel Serverless Function - Dashboard Data API
 * يدير جميع عمليات حفظ واسترجاع البيانات
 */

import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../dashboard.db');

// Initialize database
let db = null;

function initDatabase() {
    return new Promise((resolve, reject) => {
        if (db) {
            resolve(db);
            return;
        }

        db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                reject(err);
                return;
            }

            // Create tables if they don't exist
            db.run(`
                CREATE TABLE IF NOT EXISTS dashboard_data (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    key TEXT UNIQUE,
                    value TEXT,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_by TEXT
                )
            `, (err) => {
                if (err) {
                    reject(err);
                    return;
                }

                db.run(`
                    CREATE TABLE IF NOT EXISTS sync_log (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        action TEXT,
                        key TEXT,
                        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        device_id TEXT
                    )
                `, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(db);
                    }
                });
            });
        });
    });
}

// API Handler
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        await initDatabase();

        const { method, query, body } = req;

        // GET /api/data - Get all data
        if (method === 'GET' && !query.key) {
            return new Promise((resolve) => {
                db.all('SELECT key, value, updated_at FROM dashboard_data', (err, rows) => {
                    if (err) {
                        res.status(500).json({ error: err.message });
                        resolve();
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

                    res.status(200).json(data);
                    resolve();
                });
            });
        }

        // GET /api/data?key=xxx - Get specific data
        if (method === 'GET' && query.key) {
            return new Promise((resolve) => {
                db.get('SELECT value, updated_at FROM dashboard_data WHERE key = ?', [query.key], (err, row) => {
                    if (err) {
                        res.status(500).json({ error: err.message });
                        resolve();
                        return;
                    }

                    if (!row) {
                        res.status(404).json({ error: 'Data not found' });
                        resolve();
                        return;
                    }

                    try {
                        const value = JSON.parse(row.value);
                        res.status(200).json({ key: query.key, value, updated_at: row.updated_at });
                    } catch (e) {
                        res.status(200).json({ key: query.key, value: row.value, updated_at: row.updated_at });
                    }
                    resolve();
                });
            });
        }

        // POST /api/data - Save data
        if (method === 'POST') {
            const { key, value, deviceId } = body;

            if (!key || value === undefined) {
                res.status(400).json({ error: 'Missing key or value' });
                return;
            }

            const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

            return new Promise((resolve) => {
                db.run(
                    `INSERT OR REPLACE INTO dashboard_data (key, value, updated_by)
                     VALUES (?, ?, ?)`,
                    [key, stringValue, deviceId || 'unknown'],
                    function(err) {
                        if (err) {
                            res.status(500).json({ error: err.message });
                            resolve();
                            return;
                        }

                        // Log the sync action
                        db.run(
                            `INSERT INTO sync_log (action, key, device_id)
                             VALUES (?, ?, ?)`,
                            ['save', key, deviceId || 'unknown']
                        );

                        res.status(200).json({ success: true, key, message: 'Data saved successfully' });
                        resolve();
                    }
                );
            });
        }

        // DELETE /api/data?key=xxx - Delete data
        if (method === 'DELETE' && query.key) {
            const { deviceId } = body || {};

            return new Promise((resolve) => {
                db.run('DELETE FROM dashboard_data WHERE key = ?', [query.key], function(err) {
                    if (err) {
                        res.status(500).json({ error: err.message });
                        resolve();
                        return;
                    }

                    // Log the sync action
                    db.run(
                        `INSERT INTO sync_log (action, key, device_id)
                         VALUES (?, ?, ?)`,
                        ['delete', query.key, deviceId || 'unknown']
                    );

                    res.status(200).json({ success: true, message: 'Data deleted successfully' });
                    resolve();
                });
            });
        }

        res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: error.message });
    }
}
