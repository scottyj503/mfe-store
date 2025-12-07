/**
 * Site B - Subscriber
 * Subscribes to store changes via CustomEvent (no direct store reference)
 */
import { subscribeToKey, createStore } from 'mfe-store';

const root = document.getElementById('site-b-root');

// Site B creates its OWN store instance (simulating independent micro frontend)
// Both stores use same dbName/channelName, so they share data
const store = createStore({
  dbName: 'test-app-store',
  channelName: 'test-app',
});

// Make store available globally for testing
window.storeB = store;

// Render UI
root.innerHTML = `
  <div>
    <p>Listening for changes from Site A...</p>
  </div>
  <div class="output">
    <label>Received User:</label>
    <div class="output-value" id="received-value" data-testid="site-b-value">--</div>
  </div>
  <div class="output">
    <label>Update Count:</label>
    <div class="output-value" id="update-count" data-testid="update-count">0</div>
  </div>
  <div class="log" id="site-b-log" data-testid="site-b-log"></div>
`;

const valueDisplay = document.getElementById('received-value');
const countDisplay = document.getElementById('update-count');
const logEl = document.getElementById('site-b-log');

let updateCount = 0;

const log = (message) => {
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  logEl.prepend(entry);
};

// Subscribe using the store instance
store.subscribe('user', (value, oldValue) => {
  updateCount++;
  countDisplay.textContent = updateCount;
  valueDisplay.textContent = value ? JSON.stringify(value) : '--';
  log(`Received update #${updateCount}: ${JSON.stringify(value)}`);
});

// Also demonstrate subscribeToKey (standalone subscription without store reference)
// This uses CustomEvent under the hood
subscribeToKey('test-app', 'user', (value, oldValue) => {
  log(`[via subscribeToKey] user changed`);
});

// Load initial value
store.get('user').then((value) => {
  valueDisplay.textContent = value ? JSON.stringify(value) : '--';
  if (value) {
    log(`Loaded from IndexedDB: ${JSON.stringify(value)}`);
  }
});

log('Site B initialized - listening for updates');
