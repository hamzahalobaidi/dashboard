/**
 * Vercel Serverless Function - Health Check
 */

export default function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '2.0.0'
    });
}
