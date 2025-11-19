import React, { useState } from 'react';
import api from '../api/apiClient';

export default function UploadForm({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [replicateNow, setReplicateNow] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) return alert('Choose a file first');

    const fd = new FormData();
    fd.append('file', file);
    fd.append('replicateNow', replicateNow);

    setUploading(true);
    try {
      const resp = await api.post('/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (resp.data && resp.data.fileId) {
        alert('Uploaded. File ID: ' + resp.data.fileId);
        setFile(null);
        setReplicateNow(false);
        if (typeof onUploadSuccess === 'function') onUploadSuccess();
      } else {
        alert('Upload succeeded (no id returned)');
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed. Check backend logs and CORS.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <input
          type="file"
          onChange={e => setFile(e.target.files?.[0] || null)}
        />
      </div>

      <div className="form-row">
        <label className="checkbox">
          <input
            type="checkbox"
            checked={replicateNow}
            onChange={e => setReplicateNow(e.target.checked)}
          />
          Replicate to S3 now
        </label>
      </div>

      <div className="form-row">
        <button type="submit" disabled={uploading}>
          {uploading ? 'Uploading…' : 'Upload'}
        </button>
      </div>
    </form>
  );
}
