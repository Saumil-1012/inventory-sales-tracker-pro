import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './Dashboard.css';

function Dashboard({ apiUrl }) {
  const [stats, setStats] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [salesTrend, setSalesTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, topRes, trendRes] = await Promise.all([
        axios.get(`${apiUrl}/analytics/dashboard`),
        axios.get(`${apiUrl}/analytics/top-products?limit=5`),
        axios.get(`${apiUrl}/analytics/sales-trend/30`)
      ]);

      setStats(statsRes.data);
      setTopProducts(topRes.data);
      setSalesTrend(trendRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading dashboard...</div>;

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Products</h3>
          <p className="stat-value">{stats?.totalProducts || 0}</p>
        </div>
        <div className="stat-card warning">
          <h3>Low Stock Items</h3>
          <p className="stat-value">{stats?.lowStockItems || 0}</p>
        </div>
        <div className="stat-card success">
          <h3>Today's Sales</h3>
          <p className="stat-value">{stats?.todaysSalesCount || 0}</p>
        </div>
        <div className="stat-card info">
          <h3>Today's Revenue</h3>
          <p className="stat-value">${(stats?.todaysSalesAmount || 0).toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <h3>Weekly Revenue</h3>
          <p className="stat-value">${(stats?.weeklySalesAmount || 0).toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <h3>Inventory Value</h3>
          <p className="stat-value">${(stats?.inventoryValue || 0).toFixed(2)}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        {/* Sales Trend */}
        <div className="chart-container">
          <h2>30-Day Sales Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#8884d8" />
              <Line type="monotone" dataKey="transactions" stroke="#82ca9d" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products */}
        <div className="chart-container">
          <h2>Top 5 Selling Products</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProducts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total_sold" fill="#82ca9d" name="Units Sold" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Distribution */}
        <div className="chart-container">
          <h2>Revenue Distribution (Top 5)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={topProducts}
                dataKey="revenue"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {topProducts.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <button className="refresh-btn" onClick={fetchDashboardData}>
        ↻ Refresh
      </button>
    </div>
  );
}

export default Dashboard;
