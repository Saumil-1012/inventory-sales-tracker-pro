import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './Analytics.css';

function Analytics({ apiUrl }) {
  const [salesTrend, setSalesTrend] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [selectedDays, setSelectedDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [selectedDays]);

  const fetchAnalytics = async () => {
    try {
      const [trendRes, topRes, categoryRes] = await Promise.all([
        axios.get(`${apiUrl}/analytics/sales-trend/${selectedDays}`),
        axios.get(`${apiUrl}/analytics/top-products?days=${selectedDays}&limit=10`),
        axios.get(`${apiUrl}/analytics/category-breakdown`)
      ]);

      setSalesTrend(trendRes.data);
      setTopProducts(topRes.data);
      setCategoryBreakdown(categoryRes.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading analytics...</div>;

  const totalRevenue = topProducts.reduce((sum, p) => sum + (p.revenue || 0), 0);
  const totalUnits = topProducts.reduce((sum, p) => sum + (p.total_sold || 0), 0);

  return (
    <div className="analytics">
      <h1>Analytics & Reports</h1>

      {/* Date Range Selector */}
      <div className="date-selector">
        <label>Report Period:</label>
        <select value={selectedDays} onChange={(e) => setSelectedDays(parseInt(e.target.value))}>
          <option value={7}>Last 7 Days</option>
          <option value={30}>Last 30 Days</option>
          <option value={90}>Last 90 Days</option>
          <option value={365}>Last Year</option>
        </select>
      </div>

      {/* Summary Stats */}
      <div className="summary-stats">
        <div className="stat-box">
          <h3>Total Revenue</h3>
          <p className="stat-number">${totalRevenue.toFixed(2)}</p>
        </div>
        <div className="stat-box">
          <h3>Total Units Sold</h3>
          <p className="stat-number">{totalUnits}</p>
        </div>
        <div className="stat-box">
          <h3>Avg Sale Value</h3>
          <p className="stat-number">${(totalRevenue / (topProducts.length || 1)).toFixed(2)}</p>
        </div>
        <div className="stat-box">
          <h3>Top Product</h3>
          <p className="stat-number">{topProducts[0]?.name || 'N/A'}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="analytics-grid">
        {/* Sales Trend */}
        <div className="chart-container full-width">
          <h2>Sales Revenue Trend ({selectedDays} days)</h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={salesTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} name="Revenue" />
              <Line type="monotone" dataKey="transactions" stroke="#82ca9d" strokeWidth={2} name="Transactions" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products by Revenue */}
        <div className="chart-container half-width">
          <h2>Top Products by Revenue</h2>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={topProducts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
              <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products by Volume */}
        <div className="chart-container half-width">
          <h2>Top Products by Volume</h2>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={topProducts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total_sold" fill="#82ca9d" name="Units" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Breakdown Table */}
      <div className="category-breakdown">
        <h2>Sales by Category</h2>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Transactions</th>
              <th>Revenue</th>
              <th>Avg Transaction</th>
            </tr>
          </thead>
          <tbody>
            {categoryBreakdown.map((cat, idx) => (
              <tr key={idx}>
                <td>{cat.category || 'Uncategorized'}</td>
                <td>{cat.transactions}</td>
                <td>${cat.revenue.toFixed(2)}</td>
                <td>${(cat.revenue / cat.transactions).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detailed Top Products */}
      <div className="detailed-products">
        <h2>Detailed Product Performance</h2>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Units Sold</th>
              <th>Revenue</th>
              <th>Avg Price</th>
            </tr>
          </thead>
          <tbody>
            {topProducts.map((p, idx) => (
              <tr key={idx}>
                <td>{p.name}</td>
                <td><code>{p.sku}</code></td>
                <td>{p.total_sold}</td>
                <td>${p.revenue.toFixed(2)}</td>
                <td>${(p.revenue / p.total_sold).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="export-actions">
        <button className="btn btn-primary" onClick={() => window.print()}>
          🖨️ Print Report
        </button>
        <button className="btn btn-secondary" onClick={() => {
          const data = JSON.stringify({ salesTrend, topProducts, categoryBreakdown }, null, 2);
          const blob = new Blob([data], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `analytics-${new Date().toISOString()}.json`;
          a.click();
        }}>
          💾 Export JSON
        </button>
      </div>
    </div>
  );
}

export default Analytics;
