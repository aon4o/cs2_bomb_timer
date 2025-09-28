const express = require('express');
const http = require('http');
const path = require('path');

const initSockets = require('./sockets');
const initRoutes = require('./routes');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;

// Centralized bomb state with methods
const bomb = {
    _at: null,
    get() {
        return this._at;
    },
    set(ms) {
        this._at = ms;
    },
    clear() {
        this._at = null;
    }
};

app.use(express.json({limit: '2mb'}));
app.use(express.static(path.join(__dirname, 'public')));

const broadcast = initSockets(server, bomb);

// Wire up routes
initRoutes(app, {
    broadcast,
    bomb: bomb,
});

server.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
