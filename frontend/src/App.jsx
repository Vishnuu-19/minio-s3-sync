import React from 'react';
import Home from './pages/Home';

export default function App() {
  return (
    <div className="app">
      <header className="topbar">
        <h1>MinIO → S3 Sync</h1>
      </header>
      <main className="container">
        <Home />
      </main>
    </div>
  );
}
