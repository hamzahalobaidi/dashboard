/**
 * Vercel Serverless Function - Supabase Data Sync API
 * يدير جميع عمليات حفظ واسترجاع البيانات من Supabase
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const SUPABASE_URL = 'https://beyhylgatgsmdeqaiwft.supabase.co';
const SUPABASE_KEY = 'sb_publishable_54kYDmEE3rW7pBTgOIoaLA_nm-1bw64';

let supabase = null;

function getSupabaseClient() {
    if (!supabase) {
        supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    }
    return supabase;
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
        const client = getSupabaseClient();
        const { method, query, body } = req;
        const key = query.key || (body && body.key);

        // GET /api/sync - Get all data
        if (method === 'GET' && !key) {
            const { data, error } = await client
                .from('dashboard_data')
                .select('key, value, updated_at');

            if (error) {
                console.error('Supabase error:', error);
                res.status(500).json({ error: error.message });
                return;
            }

            const result = {};
            if (data) {
                data.forEach(row => {
                    try {
                        result[row.key] = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
                    } catch (e) {
                        result[row.key] = row.value;
                    }
                });
            }

            res.status(200).json(result);
            return;
        }

        // GET /api/sync?key=xxx - Get specific data
        if (method === 'GET' && key) {
            const { data, error } = await client
                .from('dashboard_data')
                .select('value, updated_at')
                .eq('key', key)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    res.status(404).json({ error: 'Data not found' });
                } else {
                    console.error('Supabase error:', error);
                    res.status(500).json({ error: error.message });
                }
                return;
            }

            try {
                const value = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
                res.status(200).json({ key, value, updated_at: data.updated_at });
            } catch (e) {
                res.status(200).json({ key, value: data.value, updated_at: data.updated_at });
            }
            return;
        }

        // POST /api/sync - Save data
        if (method === 'POST') {
            const dataKey = key;
            const dataValue = body && body.value;
            const deviceId = body && body.deviceId;

            if (!dataKey || dataValue === undefined) {
                res.status(400).json({ error: 'Missing key or value' });
                return;
            }

            const { data, error } = await client
                .from('dashboard_data')
                .upsert(
                    {
                        key: dataKey,
                        value: dataValue,
                        updated_by: deviceId || 'unknown',
                        updated_at: new Date().toISOString()
                    },
                    { onConflict: 'key' }
                )
                .select();

            if (error) {
                console.error('Supabase error:', error);
                res.status(500).json({ error: error.message });
                return;
            }

            // Log the sync action
            await client
                .from('sync_log')
                .insert({
                    action: 'save',
                    key: dataKey,
                    device_id: deviceId || 'unknown'
                });

            res.status(200).json({ success: true, key: dataKey, message: 'Data saved successfully' });
            return;
        }

        // DELETE /api/sync?key=xxx - Delete data
        if (method === 'DELETE' && key) {
            const deviceId = body && body.deviceId;

            const { error } = await client
                .from('dashboard_data')
                .delete()
                .eq('key', key);

            if (error) {
                console.error('Supabase error:', error);
                res.status(500).json({ error: error.message });
                return;
            }

            // Log the sync action
            await client
                .from('sync_log')
                .insert({
                    action: 'delete',
                    key: key,
                    device_id: deviceId || 'unknown'
                });

            res.status(200).json({ success: true, message: 'Data deleted successfully' });
            return;
        }

        res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: error.message });
    }
}
