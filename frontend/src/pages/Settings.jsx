import React from 'react';
import './Settings.css';

function Settings({ user }) {
  return (
    <div className="settings">
      <h1>Settings</h1>

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
          <button className="btn btn-secondary">Change Password</button>
          <button className="btn btn-secondary">Enable 2FA</button>
          <button className="btn btn-secondary">View Login History</button>
        </div>
      </div>

      <div className="settings-section">
        <h2>⚙️ Preferences</h2>
        <div className="settings-group">
          <label>
            <input type="checkbox" defaultChecked /> Dark Mode
          </label>
          <label>
            <input type="checkbox" defaultChecked /> Email Notifications
          </label>
          <label>
            <input type="checkbox" /> Low Stock Alerts
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
          <button className="btn btn-secondary">View Documentation</button>
          <button className="btn btn-secondary">Report Issue</button>
        </div>
      </div>
    </div>
  );
}

export default Settings;
