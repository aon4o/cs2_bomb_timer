(function () {
    const timerEl = document.getElementById('timer');
    const statusEl = document.getElementById('status');
    const wsStatusEl = document.getElementById('wsStatus');

    const TOTAL_SECONDS = 40;

    let endAt = null;
    let tickInterval = null;

    function setWsStatus(text, cls) {
        wsStatusEl.textContent = text;
        wsStatusEl.className = 'pill ' + (cls || '');
    }

    function format(seconds) {
        seconds = Math.max(0, Math.ceil(seconds));
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    }

    function clamp(n, min, max) {
        return Math.min(max, Math.max(min, n));
    }

    function setTimerColorByRemaining(remainingSeconds) {
        const t = clamp(remainingSeconds / TOTAL_SECONDS, 0, 1); // 1 => green, 0 => red
        const r = Math.round(255 * (1 - t));
        const g = Math.round(255 * t);
        const b = 0;
        timerEl.style.color = `rgb(${r}, ${g}, ${b})`;
    }

    function update() {
        if (endAt == null) return;
        const remaining = (endAt - Date.now()) / 1000;
        timerEl.textContent = format(remaining);
        setTimerColorByRemaining(remaining);
        if (remaining <= 0) {
            clearInterval(tickInterval);
            tickInterval = null;
            endAt = null;
            statusEl.textContent = 'Timer finished';
            timerEl.classList.remove('running');
            timerEl.classList.add('stopped');
            timerEl.style.color = '#fff';
        }
    }

    function startFrom(plantedAtMs) {
        const end = plantedAtMs + TOTAL_SECONDS * 1000;
        const remaining = (end - Date.now()) / 1000;
        if (remaining <= 0) {
            // already expired; show finished state
            if (tickInterval) {
                clearInterval(tickInterval);
                tickInterval = null;
            }
            endAt = null;
            timerEl.textContent = '00:40';
            timerEl.classList.remove('running');
            timerEl.classList.add('stopped');
            statusEl.textContent = 'Timer finished';
            timerEl.style.color = '#fff';
            return;
        }
        endAt = end;
        timerEl.textContent = format(remaining);
        timerEl.classList.remove('stopped');
        timerEl.classList.add('running');
        statusEl.textContent = 'Bomb planted — timer running';
        setTimerColorByRemaining(remaining);
        if (!tickInterval) tickInterval = setInterval(update, 100);
        update();
    }

    function start40() {
        startFrom(Date.now());
    }

    function resetTimer() {
        endAt = null;
        if (tickInterval) {
            clearInterval(tickInterval);
            tickInterval = null;
        }
        timerEl.textContent = '00:40';
        timerEl.classList.remove('running');
        timerEl.classList.add('stopped');
        statusEl.textContent = 'Round ended — timer reset';
        timerEl.style.color = '#fff';
    }

    window.addEventListener('keydown', (e) => {
        if (e.key === 's' || e.key === 'S') {
            start40();
        } else if (e.key === 'r' || e.key === 'R') {
            resetTimer();
        }
    });

    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const wsUrl = proto + '://' + location.host;

    let ws = null;
    let reconnectInterval = null;

    function wireSocket(socket) {
        socket.onopen = () => {
            setWsStatus('connected', 'running');
            if (reconnectInterval) {
                clearInterval(reconnectInterval);
                reconnectInterval = null;
            }
        };
        socket.onclose = () => {
            setWsStatus('disconnected', 'stopped');
            // Start/ensure a 1-second reconnect checker
            if (!reconnectInterval) {
                reconnectInterval = setInterval(() => {
                    if (!ws || ws.readyState === WebSocket.CLOSED) {
                        connect();
                    }
                }, 1000);
            }
        };
        socket.onerror = () => {
            setWsStatus('error', 'stopped');
        };
        socket.onmessage = (ev) => {
            let msg;
            try {
                msg = JSON.parse(ev.data);
            } catch {
                return;
            }
            if (msg && msg.type === 'bomb_planted') {
                if (typeof msg.at === 'number') {
                    startFrom(msg.at);
                } else {
                    start40();
                }
            }
            if (msg && msg.type === 'round_end') {
                resetTimer();
            }
        };
    }

    function connect() {
        // Avoid creating multiple sockets if one is already open/connecting
        if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
            return;
        }
        try {
            setWsStatus('connecting...', '');
            ws = new WebSocket(wsUrl);
            wireSocket(ws);
        } catch (e) {
            // If constructor throws (very rare), ensure reconnect checker is running
            if (!reconnectInterval) {
                reconnectInterval = setInterval(() => {
                    if (!ws || ws.readyState === WebSocket.CLOSED) {
                        connect();
                    }
                }, 1000);
            }
        }
    }

    // Initial connect
    connect();

    timerEl.style.color = '#fff';
})();
