module.exports = async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const BEY_API_KEY = process.env.BEY_API_KEY;
    const DEFAULT_AGENT_ID = process.env.BEY_AGENT_ID;

    if (!BEY_API_KEY) {
        return res.status(500).json({ error: 'Missing BEY_API_KEY environment variable' });
    }

    // Parse request body to get agent_id (if provided)
    let bodyAgentId = null;
    try {
        if (req.body && typeof req.body === 'object') {
            bodyAgentId = req.body.agent_id;
        } else if (typeof req.body === 'string' && req.body) {
            const parsed = JSON.parse(req.body);
            bodyAgentId = parsed.agent_id;
        }
    } catch (e) {
        // Body parsing failed, will use default
        console.log('Body parsing failed, using default agent_id');
    }

    // Use agent_id from request body, or fall back to env var
    const AGENT_ID = bodyAgentId || DEFAULT_AGENT_ID;

    if (!AGENT_ID) {
        return res.status(400).json({ 
            error: 'No agent_id provided. Pass agent_id in request body or set BEY_AGENT_ID env var.' 
        });
    }

    console.log(`[Beyond Presence] Creating call for agent: ${AGENT_ID}`);

    try {
        const response = await fetch('https://api.bey.dev/v1/calls', {
            method: 'POST',
            headers: {
                'x-api-key': BEY_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ agent_id: AGENT_ID })
        });

        if (!response.ok) {
            const error = await response.text();
            console.error(`[Beyond Presence] API error: ${error}`);
            return res.status(response.status).json({ error });
        }

        const data = await response.json();
        
        console.log(`[Beyond Presence] Call created successfully`);
        
        // Return LiveKit credentials
        return res.status(200).json({
            livekit_url: data.livekit_url,
            livekit_token: data.livekit_token
        });
    } catch (error) {
        console.error(`[Beyond Presence] Error: ${error.message}`);
        return res.status(500).json({ error: error.message });
    }
};