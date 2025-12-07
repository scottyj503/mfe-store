/**
 * Site A - Publisher
 * Creates the store and publishes data
 */
import { createStore } from 'mfe-store';

const root = document.getElementById('site-a-root');

// Create shared store
const store = createStore({
  dbName: 'test-app-store',
  channelName: 'test-app',
});

// Make store available globally for testing
window.storeA = store;

// Render UI
root.innerHTML = `
  <div>
    <label>User Name:</label>
    <input type="text" id="user-input" placeholder="Enter a name..." data-testid="user-input" />
    <button id="set-user-btn" data-testid="set-user-btn">Set User</button>
    <button id="clear-btn" data-testid="clear-btn">Clear</button>
  </div>
  <div class="output">
    <label>Current Store Value:</label>
    <div class="output-value" id="current-value" data-testid="site-a-value">--</div>
  </div>
  <div class="log" id="site-a-log" data-testid="site-a-log"></div>
`;

const input = document.getElementById('user-input');
const setBtn = document.getElementById('set-user-btn');
const clearBtn = document.getElementById('clear-btn');
const valueDisplay = document.getElementById('current-value');
const logEl = document.getElementById('site-a-log');

const log = (message) => {
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  logEl.prepend(entry);
};

// Set user handler
setBtn.addEventListener('click', async () => {
  const name = input.value.trim();
  if (name) {
    const user = { name, updatedAt: Date.now() };
    await store.set('user', user);
    log(`Published: ${JSON.stringify(user)}`);
  }
});

// Clear handler
clearBtn.addEventListener('click', async () => {
  await store.delete('user');
  log('Cleared user');
});

// Subscribe to own changes (to display current value)
store.subscribe('user', (value) => {
  valueDisplay.textContent = value ? JSON.stringify(value) : '--';
});

// Load initial value
store.get('user').then((value) => {
  valueDisplay.textContent = value ? JSON.stringify(value) : '--';
  if (value) {
    log(`Loaded from IndexedDB: ${JSON.stringify(value)}`);
  }
});

log('Site A initialized');
