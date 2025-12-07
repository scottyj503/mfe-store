/**
 * Iframe A - Publisher
 * Publishes data that Iframe B should receive via BroadcastChannel
 */
import { createStore } from 'mfe-store';

const root = document.getElementById('iframe-a-root');

// Create store - same dbName and channelName as iframe B
const store = createStore({
  dbName: 'iframe-test-store',
  channelName: 'iframe-test',
});

// Make store available for testing
window.iframeAStore = store;

// Render UI
root.innerHTML = `
  <div>
    <input type="text" id="message-input" placeholder="Enter message..." data-testid="message-input" />
    <button id="send-btn" data-testid="send-btn">Send to Iframe B</button>
    <button id="clear-btn" data-testid="clear-btn">Clear</button>
  </div>
  <div class="output">
    <label>Local Value:</label>
    <div class="output-value" id="local-value" data-testid="iframe-a-value">--</div>
  </div>
`;

const input = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const clearBtn = document.getElementById('clear-btn');
const valueDisplay = document.getElementById('local-value');

// Send message
sendBtn.addEventListener('click', async () => {
  const message = input.value.trim();
  if (message) {
    await store.set('message', { text: message, from: 'iframe-a', timestamp: Date.now() });
    input.value = '';
  }
});

// Clear
clearBtn.addEventListener('click', async () => {
  await store.delete('message');
});

// Subscribe to show local value
store.subscribe('message', (value) => {
  valueDisplay.textContent = value ? JSON.stringify(value) : '--';
});

// Load initial value
store.get('message').then((value) => {
  valueDisplay.textContent = value ? JSON.stringify(value) : '--';
});
