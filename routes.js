const path = require('path');

// Simple detector utilities
function isBombPlanted(payload) {
    return payload?.added?.round?.bomb === true;
}

function isRoundEnd(payload) {
    return payload?.round?.phase === 'over';
}

/**
 * Register application routes.
 * @param {import('express').Express} app
 * @param {{
 *  broadcast: (obj:any)=>void,
 *  bombState: { get: ()=> number|null, set: (ms:number)=>void, clear: ()=>void },
 * }} deps
 */
module.exports = function initRoutes(app, deps) {
    const {broadcast, bomb} = deps;

    app.get('/', (_req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });

    app.post('/events', (req, res) => {
        const payload = req.body || {};

        try {
            if (isBombPlanted(payload)) {
                const now = Date.now();
                bomb.set(now);
                broadcast({type: 'bomb_planted', at: now});
            }
            if (isRoundEnd(payload)) {
                const now = Date.now();
                broadcast({type: 'round_end', at: now});
                bomb.clear();
            }
        } catch (e) {
            console.error('Detection error:', e);
        }

        res.json({ok: true});
    });

    app.get('/health', (_req, res) => res.json({ok: true}));
};
