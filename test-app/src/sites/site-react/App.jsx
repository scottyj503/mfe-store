import { useState } from 'react';
import { createStore } from 'mfe-store';
import { createStoreHooks } from 'mfe-store/react';

// Create store
const store = createStore({
  dbName: 'react-test-store',
  channelName: 'react-test',
  validators: {
    count: (value) => {
      if (typeof value !== 'number') {
        throw new Error('count must be a number');
      }
    }
  }
});

// Create typed hooks
const { useValue } = createStoreHooks(store);

// Make store available for testing
window.reactStore = store;

function Counter() {
  const [count, setCount, loading] = useValue('count');
  const [error, setError] = useState(null);

  const increment = async () => {
    try {
      setError(null);
      await setCount((count || 0) + 1);
    } catch (err) {
      setError(err.message);
    }
  };

  const decrement = async () => {
    try {
      setError(null);
      await setCount((count || 0) - 1);
    } catch (err) {
      setError(err.message);
    }
  };

  const setInvalid = async () => {
    try {
      setError(null);
      await store.set('count', 'not a number');
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div data-testid="loading">Loading...</div>;
  }

  return (
    <div>
      <h3>React Counter with useValue Hook</h3>
      <div className="output">
        <label>Count:</label>
        <div className="output-value" data-testid="count-value">
          {count ?? 0}
        </div>
      </div>
      <div style={{ marginTop: '15px' }}>
        <button onClick={decrement} data-testid="decrement-btn">-</button>
        <button onClick={increment} data-testid="increment-btn">+</button>
        <button onClick={setInvalid} data-testid="set-invalid-btn">Set Invalid</button>
      </div>
      {error && (
        <div className="output" style={{ marginTop: '15px' }}>
          <label>Error:</label>
          <div className="output-value" data-testid="error" style={{ color: 'red' }}>
            {error}
          </div>
        </div>
      )}
    </div>
  );
}

function UserProfile() {
  const [user, setUser, loading] = useValue('user');
  const [inputName, setInputName] = useState('');

  const updateUser = async () => {
    await setUser({ name: inputName, updatedAt: Date.now() });
    setInputName('');
  };

  const clearUser = async () => {
    await store.delete('user');
  };

  if (loading) {
    return <div data-testid="user-loading">Loading...</div>;
  }

  return (
    <div style={{ marginTop: '30px' }}>
      <h3>React User Profile with useValue Hook</h3>
      <div>
        <input
          type="text"
          value={inputName}
          onChange={(e) => setInputName(e.target.value)}
          placeholder="Enter name..."
          data-testid="user-input"
        />
        <button onClick={updateUser} data-testid="set-user-btn">Set User</button>
        <button onClick={clearUser} data-testid="clear-user-btn">Clear</button>
      </div>
      <div className="output" style={{ marginTop: '15px' }}>
        <label>User:</label>
        <div className="output-value" data-testid="user-value">
          {user ? JSON.stringify(user) : '--'}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div>
      <Counter />
      <UserProfile />
    </div>
  );
}
