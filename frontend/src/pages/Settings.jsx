import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Settings.css';

const API_URL = 'http://localhost:3001/api';
const defaultPreferences = {
  darkMode: false,
  emailNotifications: true,
  lowStockAlerts: false,
  twoFactorEnabled: false
};

function Settings({ user }) {
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('preferences') || '{}');
    const nextPreferences = { ...defaultPreferences, ...saved };
    setPreferences(nextPreferences);
    document.body.classList.toggle('dark-mode', nextPreferences.darkMode);
  }, []);

  const updatePreference = (name, value) => {
    const nextPreferences = { ...preferences, [name]: value };
    setPreferences(nextPreferences);
    localStorage.setItem('preferences', JSON.stringify(nextPreferences));
    if (name === 'darkMode') {
      document.body.classList.toggle('dark-mode', value);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    try {
      await axios.post(`${API_URL}/auth/password`, passwords);
      setMessage('Password changed successfully.');
      setPasswords({ currentPassword: '', newPassword: '' });
      setPasswordOpen(false);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Unable to change password.');
    }
  };

  const showHistory = async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/history`);
      setHistory(response.data);
      setHistoryOpen(true);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Unable to load login history.');
    }
  };

  return (
    <div className="settings">
      <h1>Settings</h1>
      {message && <p className="settings-message" role="status">{message}</p>}

      <div className="settings-section">
        <h2>👤 Profile Information</h2>
        <div className="settings-group">
          <p><strong>Username:</strong> {user.username}</p>
          <p><strong>Role:</strong> {user.role}</p>
          <p><strong>User ID:</strong> {user.id}</p>
        </div>
      </div>

      <div className="settings-section">
        <h2>🔐 Security</h2>
        <div className="settings-group">
          <button className="btn btn-secondary" onClick={() => setPasswordOpen(true)}>Change Password</button>
          <button
            className="btn btn-secondary"
            onClick={() => updatePreference('twoFactorEnabled', !preferences.twoFactorEnabled)}
          >
            {preferences.twoFactorEnabled ? '2FA Enabled' : 'Enable 2FA'}
          </button>
          <button className="btn btn-secondary" onClick={showHistory}>View Login History</button>
        </div>
      </div>

      <div className="settings-section">
        <h2>⚙️ Preferences</h2>
        <div className="settings-group">
          <label>
            <input type="checkbox" checked={preferences.darkMode} onChange={(event) => updatePreference('darkMode', event.target.checked)} /> Dark Mode
          </label>
          <label>
            <input type="checkbox" checked={preferences.emailNotifications} onChange={(event) => updatePreference('emailNotifications', event.target.checked)} /> Email Notifications
          </label>
          <label>
            <input type="checkbox" checked={preferences.lowStockAlerts} onChange={(event) => updatePreference('lowStockAlerts', event.target.checked)} /> Low Stock Alerts
          </label>
        </div>
      </div>

      <div className="settings-section">
        <h2>📊 System Information</h2>
        <div className="settings-group">
          <p><strong>API Version:</strong> 2.0.0</p>
          <p><strong>Frontend Version:</strong> 1.0.0</p>
          <p><strong>Database:</strong> SQLite3</p>
          <p><strong>Last Updated:</strong> {new Date().toLocaleString()}</p>
        </div>
      </div>

      <div className="settings-section">
        <h2>ℹ️ About</h2>
        <div className="settings-group">
          <p>Inventory & Sales Tracker Pro v2.0</p>
          <p>Enterprise-grade inventory management system</p>
          <button className="btn btn-secondary" onClick={() => window.open('/README.md', '_blank')}>View Documentation</button>
          <a className="btn btn-secondary" href="mailto:support@example.com?subject=Inventory%20Tracker%20Issue">Report Issue</a>
        </div>
      </div>

      {passwordOpen && (
        <div className="settings-modal" role="dialog" aria-modal="true" aria-labelledby="password-title">
          <form className="settings-modal-content" onSubmit={changePassword}>
            <h2 id="password-title">Change Password</h2>
            <input type="password" placeholder="Current password" value={passwords.currentPassword} onChange={(event) => setPasswords({ ...passwords, currentPassword: event.target.value })} required />
            <input type="password" placeholder="New password (8+ characters)" minLength="8" value={passwords.newPassword} onChange={(event) => setPasswords({ ...passwords, newPassword: event.target.value })} required />
            <div className="settings-modal-actions">
              <button className="btn btn-primary" type="submit">Save Password</button>
              <button className="btn btn-secondary" type="button" onClick={() => setPasswordOpen(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {historyOpen && (
        <div className="settings-modal" role="dialog" aria-modal="true" aria-labelledby="history-title">
          <div className="settings-modal-content">
            <h2 id="history-title">Login History</h2>
            {history.length === 0 ? <p>No login history available.</p> : history.map((entry) => (
              <p key={`${entry.logged_in_at}-${entry.ip_address}`}><strong>{new Date(entry.logged_in_at).toLocaleString()}</strong> from {entry.ip_address || 'unknown device'}</p>
            ))}
            <button className="btn btn-secondary" type="button" onClick={() => setHistoryOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;
