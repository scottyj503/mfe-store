/**
 * Iframe B - Subscriber
 * Receives data from Iframe A via BroadcastChannel
 */
import { createStore } from 'mfe-store';

const root = document.getElementById('iframe-b-root');

// Create store - same dbName and channelName as iframe A
const store = createStore({
  dbName: 'iframe-test-store',
  channelName: 'iframe-test',
});

// Make store available for testing
window.iframeBStore = store;

// Render UI
root.innerHTML = `
  <div>
    <p>Listening for messages from Iframe A...</p>
  </div>
  <div class="output">
    <label>Received Message:</label>
    <div class="output-value" id="received-value" data-testid="iframe-b-value">--</div>
  </div>
  <div class="output">
    <label>Update Count:</label>
    <div class="output-value" id="update-count" data-testid="iframe-b-count">0</div>
  </div>
`;

const valueDisplay = document.getElementById('received-value');
const countDisplay = document.getElementById('update-count');

let updateCount = 0;

// Subscribe to messages
store.subscribe('message', (value) => {
  updateCount++;
  countDisplay.textContent = updateCount;
  valueDisplay.textContent = value ? JSON.stringify(value) : '--';
});

// Load initial value
store.get('message').then((value) => {
  valueDisplay.textContent = value ? JSON.stringify(value) : '--';
});
