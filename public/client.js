(function(){
  const timerEl = document.getElementById('timer');
  const statusEl = document.getElementById('status');
  const wsStatusEl = document.getElementById('wsStatus');
  let endAt = null; // timestamp ms when timer ends
  let tickInterval = null;

  function setWsStatus(text, cls) {
    wsStatusEl.textContent = text;
    wsStatusEl.className = 'pill ' + (cls || '');
  }

  function format(seconds) {
    seconds = Math.max(0, Math.ceil(seconds));
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
  }

  function update() {
    if (endAt == null) return;
    const remaining = (endAt - Date.now()) / 1000;
    timerEl.textContent = format(remaining);
    if (remaining <= 0) {
      clearInterval(tickInterval);
      tickInterval = null;
      endAt = null;
      statusEl.textContent = 'Timer finished';
      timerEl.classList.remove('running');
      timerEl.classList.add('stopped');
    }
  }

  function start40() {
    endAt = Date.now() + 40 * 1000;
    timerEl.textContent = '00:40';
    timerEl.classList.remove('stopped');
    timerEl.classList.add('running');
    statusEl.textContent = 'Bomb planted — timer running';
    if (!tickInterval) tickInterval = setInterval(update, 200);
    update();
  }

  function resetTimer() {
    endAt = null;
    if (tickInterval) { clearInterval(tickInterval); tickInterval = null; }
    timerEl.textContent = '00:40';
    timerEl.classList.remove('running');
    timerEl.classList.add('stopped');
    statusEl.textContent = 'Round ended — timer reset';
  }

  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  const wsUrl = proto + '://' + location.host;
  const ws = new WebSocket(wsUrl);
  setWsStatus('connecting...', '');

  ws.onopen = () => setWsStatus('connected', 'running');
  ws.onclose = () => setWsStatus('disconnected', 'stopped');
  ws.onerror = () => setWsStatus('error', 'stopped');

  ws.onmessage = (ev) => {
    let msg;
    try { msg = JSON.parse(ev.data); } catch { return; }
    if (msg && msg.type === 'bomb_planted') {
      start40();
    }
    if (msg && msg.type === 'round_end') {
      resetTimer();
    }
  };
})();
