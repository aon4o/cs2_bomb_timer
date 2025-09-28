const express = require('express');
const http = require('http');
const path = require('path');
const {WebSocketServer} = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({server});

const PORT = process.env.PORT || 3000;

// Track when the bomb was planted (ms since epoch); null if not planted
let bombPlantedAt = null;

app.use(express.json({limit: '2mb'}));

app.use(express.static(path.join(__dirname, 'public')));

function broadcast(obj) {
    const data = JSON.stringify(obj);
    wss.clients.forEach((ws) => {
        if (ws.readyState === ws.OPEN) {
            ws.send(data);
        }
    });
}

// Simple detector utilities
function isBombPlanted(payload) {
    return payload?.added?.round?.bomb === true;
}

function isRoundEnd(payload) {
    return payload?.round?.phase === 'over';
}

app.get('/', (_req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/events', (req, res) => {
    const payload = req.body || {};

    try {
        if (isBombPlanted(payload)) {
            const now = Date.now();
            if (bombPlantedAt == null) bombPlantedAt = now;
            broadcast({type: 'bomb_planted', at: bombPlantedAt});
        }
        if (isRoundEnd(payload)) {
            const now = Date.now();
            broadcast({type: 'round_end', at: now});
            bombPlantedAt = null;
        }
    } catch (e) {
        console.error('Detection error:', e);
    }

    res.json({ok: true});
});

app.get('/health', (_req, res) => res.json({ok: true}));

wss.on('connection', (ws) => {
    ws.send(JSON.stringify({type: 'hello', msg: 'connected'}));
    if (bombPlantedAt != null) {
        ws.send(JSON.stringify({type: 'bomb_planted', at: bombPlantedAt}));
    }
});

server.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
