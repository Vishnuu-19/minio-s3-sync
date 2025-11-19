import React, { useEffect, useState } from 'react';
import UploadForm from '../components/UploadForm';
import LoginForm from '../components/LoginForm';
import api from '../api/apiClient';

export default function Home() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('token'));

  async function loadFiles() {
    setLoading(true);
    try {
      const resp = await api.get('/files');
      if (resp.data && resp.data.files) setFiles(resp.data.files);
    } catch (err) {
      console.error('Failed to list files', err);
      // if 401, force logout
      if (err?.response?.status === 401) handleLogout();
      alert('Could not fetch files. Is backend running?');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if(loggedIn) loadFiles();
  }, [loggedIn]);

  function handleLogin() {
    setLoggedIn(true);
    loadFiles();
  }

  function handleLogout() {
    // clear token and state
    localStorage.removeItem('token');
    // remove header used by api client (apiClient sets defaults on init)
    window.location.reload(); // simple way to reset the app; optional: refine
  }

  async function handleDownload(fileId) {
    try {
      const resp = await api.get(`/files/${fileId}/download`);
      const url = resp.data?.url;
      if (!url) throw new Error('No download URL');
      // open in new tab/window
      window.open(url, '_blank', 'noopener');
    } catch (err) {
      console.error('Download failed', err);
      alert('Download failed: ' + (err?.response?.data?.error || err.message));
    }
  }

  async function handleReplicateNow(fileId) {
    try {
      const resp = await api.post(`/files/${fileId}/replicate`);
      if (resp.data?.ok) {
        alert('Replication queued');
        loadFiles(); // refresh list
      } else {
        alert('Could not queue replication');
      }
    } catch (err) {
      console.error(err);
      alert('Replication request failed: ' + (err?.response?.data?.error || err.message));
    }
  }

  async function handleDelete(fileId) {
    const ok = window.confirm('Delete file? This will remove it from MinIO and S3 (if present).');
    if (!ok) return;

    try {
      const resp = await api.delete(`/files/${fileId}`);
      if (resp.data?.ok) {
        alert('Deleted');
        loadFiles(); // refresh list
      } else {
        alert('Delete failed: ' + (resp.data?.error || 'unknown'));
      }
    } catch (err) {
      console.error('Delete failed', err);
      alert('Delete failed: ' + (err?.response?.data?.error || err.message));
    }
  }

   return (
    <div>
      {!loggedIn ? (
        <LoginForm onLogin={handleLogin} />
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Your Files</h2>
            <div>
              <button onClick={handleLogout}>Logout</button>
            </div>
          </div>

          <section className="card">
            <h3>Upload File</h3>
            <UploadForm onUploadSuccess={loadFiles} />
          </section>

          <section className="card">
            <h3>Files</h3>
            {loading ? <div>Loading…</div> : (
              files.length === 0 ? <div>No files yet.</div> : (
                <table className="file-table">
                  <thead>
                    <tr>
                      <th>Filename</th>
                      <th>Size</th>
                      <th>Status</th>
                      <th>Replicated At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.map(f => (
                      <tr key={f._id}>
                        <td>{f.filename}</td>
                        <td>{formatBytes(f.size)}</td>
                        <td>{f.status}</td>
                        <td>{f.replicatedAt ? new Date(f.replicatedAt).toLocaleString() : '-'}</td>
                        <td>
                          <button onClick={() => handleDownload(f._id)}>Download</button>
                          {' '}
                          <button
                            onClick={() => handleReplicateNow(f._id)}
                            disabled={f.status === 'replicated_to_s3' || f.status === 'replication_queued'}
                          >
                            {f.status === 'replicated_to_s3' ? 'Replicated' : 'Replicate Now'}
                          </button>
                          {' '}
                          <button onClick={() => handleDelete(f._id)} style={{ color: 'red' }}>
                            Delete
                          </button>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function formatBytes(bytes = 0) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = 2;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
