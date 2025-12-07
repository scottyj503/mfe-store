/**
 * Validation Test Site
 * Tests schema validation functionality
 */
import { createStore } from 'mfe-store';

const root = document.getElementById('validation-root');

// Create store with validators
const store = createStore({
  dbName: 'validation-test-store',
  channelName: 'validation-test',
  validators: {
    username: (value) => {
      if (typeof value !== 'string') {
        throw new Error(`username must be a string, got ${typeof value}`);
      }
      if (value.length < 2) {
        throw new Error('username must be at least 2 characters');
      }
    },
    age: (value) => {
      if (typeof value !== 'number') {
        throw new Error(`age must be a number, got ${typeof value}`);
      }
      if (value < 0 || value > 150) {
        throw new Error('age must be between 0 and 150');
      }
    },
    user: (value) => {
      if (!value || typeof value !== 'object') {
        throw new Error('user must be an object');
      }
      if (typeof value.name !== 'string') {
        throw new Error('user.name must be a string');
      }
    }
  }
});

// Make store available globally for testing
window.validationStore = store;

// Render UI
root.innerHTML = `
  <div>
    <h3>Username (string, min 2 chars)</h3>
    <input type="text" id="username-input" placeholder="Enter username..." data-testid="username-input" />
    <button id="set-username-btn" data-testid="set-username-btn">Set Username</button>
    <button id="set-username-invalid-btn" data-testid="set-username-invalid-btn">Set Invalid (number)</button>
  </div>

  <div style="margin-top: 20px;">
    <h3>Age (number, 0-150)</h3>
    <input type="number" id="age-input" placeholder="Enter age..." data-testid="age-input" />
    <button id="set-age-btn" data-testid="set-age-btn">Set Age</button>
    <button id="set-age-invalid-btn" data-testid="set-age-invalid-btn">Set Invalid (string)</button>
  </div>

  <div class="output" style="margin-top: 20px;">
    <label>Last Result:</label>
    <div class="output-value" id="result" data-testid="result">--</div>
  </div>

  <div class="output">
    <label>Last Error:</label>
    <div class="output-value" id="error" data-testid="error" style="color: red;">--</div>
  </div>
`;

const usernameInput = document.getElementById('username-input');
const ageInput = document.getElementById('age-input');
const resultEl = document.getElementById('result');
const errorEl = document.getElementById('error');

const showResult = (msg) => {
  resultEl.textContent = msg;
  errorEl.textContent = '--';
};

const showError = (err) => {
  errorEl.textContent = err.message;
  resultEl.textContent = '--';
};

// Username handlers
document.getElementById('set-username-btn').addEventListener('click', async () => {
  try {
    await store.set('username', usernameInput.value);
    showResult(`Set username: "${usernameInput.value}"`);
  } catch (err) {
    showError(err);
  }
});

document.getElementById('set-username-invalid-btn').addEventListener('click', async () => {
  try {
    await store.set('username', 12345); // Invalid: number instead of string
    showResult('Set username: 12345');
  } catch (err) {
    showError(err);
  }
});

// Age handlers
document.getElementById('set-age-btn').addEventListener('click', async () => {
  try {
    const age = parseInt(ageInput.value, 10);
    await store.set('age', age);
    showResult(`Set age: ${age}`);
  } catch (err) {
    showError(err);
  }
});

document.getElementById('set-age-invalid-btn').addEventListener('click', async () => {
  try {
    await store.set('age', 'twenty-five'); // Invalid: string instead of number
    showResult('Set age: "twenty-five"');
  } catch (err) {
    showError(err);
  }
});
