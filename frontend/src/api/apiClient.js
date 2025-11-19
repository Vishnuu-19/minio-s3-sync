// src/api/apiClient.js
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30_000,
});

// helper to set/remove token for subsequent requests
export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
  }
}

// initialize from storage (persist session across reloads)
const stored = localStorage.getItem('token');
if (stored) setAuthToken(stored);

export default api;
