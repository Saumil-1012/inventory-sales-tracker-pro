import React from 'react';
import { Link } from 'react-router-dom';
import './Navigation.css';

function Navigation({ user, onLogout }) {
  return (
    <nav className="navigation">
      <div className="nav-brand">
        <h1>📦 Inventory Tracker Pro</h1>
      </div>
      
      <ul className="nav-links">
        <li><Link to="/">Dashboard</Link></li>
        <li><Link to="/inventory">Inventory</Link></li>
        <li><Link to="/sales">Sales</Link></li>
        <li><Link to="/analytics">Analytics</Link></li>
        <li><Link to="/settings">Settings</Link></li>
      </ul>

      <div className="nav-user">
        <span className="user-info">
          {user.username} <span className="role-badge">{user.role}</span>
        </span>
        <button className="logout-btn" onClick={onLogout}>Logout</button>
      </div>
    </nav>
  );
}

export default Navigation;
