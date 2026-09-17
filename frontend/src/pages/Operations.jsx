import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Operations.css';

function Operations({ apiUrl, user }) {
  const [forecast, setForecast] = useState([]);
  const [reorders, setReorders] = useState([]);
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState('');

  const loadData = async () => {
    const requests = [axios.get(`${apiUrl}/operations/forecast?horizon=30`), axios.get(`${apiUrl}/operations/reorders`), axios.get(`${apiUrl}/purchasing/suppliers`), axios.get(`${apiUrl}/inventory`), ...(user.role === 'ADMIN' ? [axios.get(`${apiUrl}/operations/audit-logs`), axios.get(`${apiUrl}/operations/users`)] : [])];
    const [forecastResponse, reorderResponse, supplierResponse, productResponse, logsResponse, usersResponse] = await Promise.all(requests);
    setForecast(forecastResponse.data.products);
    setReorders(reorderResponse.data);
    if (user.role === 'ADMIN') { setLogs(logsResponse.data); setUsers(usersResponse.data); }
    return { suppliers: supplierResponse.data, products: productResponse.data };
  };

  useEffect(() => { loadData().catch((error) => setMessage(error.response?.data?.error || 'Unable to load operations.')); }, []);

  const createReorder = async (product) => {
    try {
      const suppliers = (await axios.get(`${apiUrl}/purchasing/suppliers`)).data;
      await axios.post(`${apiUrl}/operations/reorders`, { product_id: product.id, supplier_id: suppliers[0].id, quantity: product.recommended_order });
      setMessage(`Reorder created for ${product.name}.`);
      loadData();
    } catch (error) { setMessage(error.response?.data?.error || 'Unable to create reorder.'); }
  };

  const backup = async () => { try { const response = await axios.post(`${apiUrl}/operations/backup`); setMessage(`Backup created: ${response.data.filename}`); loadData(); } catch (error) { setMessage(error.response?.data?.error || 'Backup failed.'); } };
  const changeRole = async (id, role) => { try { await axios.patch(`${apiUrl}/operations/users/${id}/role`, { role }); setMessage('User role updated.'); loadData(); } catch (error) { setMessage(error.response?.data?.error || 'Role update failed.'); } };

  return (
    <div className="operations">
      <div className="operations-header"><div><h1>Business Operations</h1><p>Forecast demand, automate replenishment, review changes, and protect your data.</p></div>{message && <span className="operations-message">{message}</span>}</div>
      <section className="operations-panel"><div className="section-title"><h2>Demand Forecast & Reorder Recommendations</h2><span>30-day horizon</span></div><div className="operations-table"><table><thead><tr><th>Product</th><th>Daily Demand</th><th>Stockout</th><th>Recommended Order</th><th>Risk</th><th>Action</th></tr></thead><tbody>{forecast.map((product) => <tr key={product.id}><td>{product.name}</td><td>{product.daily_demand.toFixed(2)} units/day</td><td>{product.stockout_in_days === null ? 'No forecast' : `${product.stockout_in_days.toFixed(1)} days`}</td><td>{product.recommended_order}</td><td><span className={`risk ${product.risk.toLowerCase()}`}>{product.risk}</span></td><td>{product.recommended_order > 0 && <button className="action-btn" onClick={() => createReorder(product)}>Create reorder</button>}</td></tr>)}</tbody></table></div></section>
      <section className="operations-panel"><div className="section-title"><h2>Reorder Requests</h2><span>{reorders.length} requests</span></div><div className="operations-table"><table><thead><tr><th>Product</th><th>Supplier</th><th>Quantity</th><th>Status</th><th>Created</th></tr></thead><tbody>{reorders.map((reorder) => <tr key={reorder.id}><td>{reorder.product_name}</td><td>{reorder.supplier_name}</td><td>{reorder.quantity}</td><td>{reorder.status}</td><td>{new Date(reorder.created_at).toLocaleString()}</td></tr>)}</tbody></table></div></section>
      {user.role === 'ADMIN' && <><section className="operations-panel admin-panel"><div className="section-title"><h2>User Roles</h2><button className="btn btn-secondary" onClick={backup}>Create Database Backup</button></div><div className="operations-table"><table><thead><tr><th>Username</th><th>Current Role</th><th>Change Role</th></tr></thead><tbody>{users.map((account) => <tr key={account.id}><td>{account.username}</td><td>{account.role}</td><td><select value={account.role} onChange={(event) => changeRole(account.id, event.target.value)}><option value="ADMIN">Admin</option><option value="MANAGER">Manager</option><option value="STAFF">Staff</option><option value="WAREHOUSE">Warehouse</option></select></td></tr>)}</tbody></table></div></section><section className="operations-panel"><h2>Audit Log</h2><div className="operations-table"><table><thead><tr><th>Time</th><th>User</th><th>Action</th><th>Details</th></tr></thead><tbody>{logs.slice(0, 20).map((log) => <tr key={log.id}><td>{new Date(log.created_at).toLocaleString()}</td><td>{log.username || 'System'}</td><td>{log.action}</td><td>{log.details}</td></tr>)}</tbody></table></div></section></>}
    </div>
  );
}

export default Operations;
