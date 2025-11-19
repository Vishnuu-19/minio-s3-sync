// src/components/LoginForm.jsx
import React, { useState } from 'react';
import api, { setAuthToken } from '../api/apiClient';

export default function LoginForm({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login'); // or 'register'
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const path = mode === 'login' ? '/auth/login' : '/auth/register';
      const resp = await api.post(path, { email, password });
      const token = resp.data?.token;
      if (!token) throw new Error('No token returned');
      setAuthToken(token);
      if (onLogin) onLogin();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.error || err.message || 'Auth failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h3>{mode === 'login' ? 'Login' : 'Register'}</h3>
      <form onSubmit={submit}>
        <div className="form-row">
          <input type="email" placeholder="Email" value={email}
                 onChange={e => setEmail(e.target.value)} required />
        </div>
        <div className="form-row">
          <input type="password" placeholder="Password" value={password}
                 onChange={e => setPassword(e.target.value)} required />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" disabled={loading}>
            {loading ? 'Working…' : mode === 'login' ? 'Login' : 'Register'}
          </button>
          <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? 'Switch to Register' : 'Switch to Login'}
          </button>
        </div>
      </form>
    </div>
  );
}
