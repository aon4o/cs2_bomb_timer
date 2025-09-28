const {WebSocketServer} = require('ws');

/**
 * Initialize WebSocket server and return a broadcast function.
 * @param {import('http').Server} server - HTTP server to attach WS to
 * @param {{ get: ()=>number|null }} bomb - bomb state accessor object
 * @returns {(obj: any) => void} broadcast function
 */
module.exports = function initSockets(server, bomb) {
    const wss = new WebSocketServer({server});

    function broadcast(obj) {
        const data = JSON.stringify(obj);
        wss.clients.forEach((ws) => {
            if (ws.readyState === ws.OPEN) {
                ws.send(data);
            }
        });
    }

    wss.on('connection', (ws) => {
        ws.send(JSON.stringify({type: 'hello', msg: 'connected'}));

        const plantedAt = bomb.get();

        if (plantedAt != null) {
            ws.send(JSON.stringify({type: 'bomb_planted', at: plantedAt}));
        }
    });

    return broadcast;
};
