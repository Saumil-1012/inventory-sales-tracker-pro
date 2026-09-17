import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Sales.css';

function Sales({ apiUrl, user }) {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [autoReorderThreshold, setAutoReorderThreshold] = useState(20);

  const [saleData, setSaleData] = useState({
    product_id: '',
    quantity: '',
    price_per_unit: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [salesRes, productsRes] = await Promise.all([
        axios.get(`${apiUrl}/sales`),
        axios.get(`${apiUrl}/inventory`)
      ]);
      setSales(salesRes.data);
      setProducts(productsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordSale = async (e) => {
    e.preventDefault();

    try {
      const sale = {
        product_id: parseInt(saleData.product_id),
        quantity: parseInt(saleData.quantity),
        price_per_unit: parseFloat(saleData.price_per_unit),
      };

      const response = await axios.post(`${apiUrl}/sales`, sale);
      alert(`Sale recorded! ID: ${response.data.saleId}, Total: $${response.data.totalAmount.toFixed(2)}`);

      // Check if product needs automatic reordering
      const product = products.find(p => p.id === sale.product_id);
      if (product && (product.quantity - sale.quantity) < autoReorderThreshold) {
        alert(`⚠️ Product ${product.name} is below reorder threshold!`);
        handleAutoReorder(product.id, product.reorder_quantity || 50);
      }

      setSaleData({ product_id: '', quantity: '', price_per_unit: '' });
      setShowSaleForm(false);
      fetchData();
    } catch (error) {
      console.error('Failed to record sale:', error);
      alert('Failed to record sale: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleAutoReorder = async (productId, quantity) => {
    // Trigger automated reordering
    const confirmed = window.confirm(`Auto-reorder ${quantity} units of this product?`);
    if (confirmed) {
      // In a real app, this would create a purchase order
      alert('✓ Reorder request submitted to suppliers');
    }
  };

  const handleCancelSale = async (saleId) => {
    if (!window.confirm('Cancel this sale and restore inventory?')) return;

    try {
      await axios.post(`${apiUrl}/sales/${saleId}/cancel`);
      alert('Sale cancelled and inventory restored');
      fetchData();
    } catch (error) {
      console.error('Failed to cancel sale:', error);
      alert('Failed to cancel sale');
    }
  };

  if (loading) return <div className="loading">Loading sales data...</div>;

  return (
    <div className="sales">
      <div className="sales-header">
        <h1>Sales Management</h1>
        <button className="btn btn-primary" onClick={() => setShowSaleForm(!showSaleForm)}>
          + Record Sale
        </button>
      </div>

      {/* Sale Form */}
      {showSaleForm && (
        <div className="sale-form">
          <h2>Record New Sale</h2>
          <form onSubmit={handleRecordSale}>
            <div className="form-group">
              <label>Product</label>
              <select
                value={saleData.product_id}
                onChange={(e) => {
                  const productId = parseInt(e.target.value);
                  const product = products.find(p => p.id === productId);
                  setSaleData({
                    ...saleData,
                    product_id: productId,
                    price_per_unit: product?.price || '',
                  });
                }}
                required
              >
                <option value="">Select Product</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Stock: {p.quantity}, Price: ${p.price.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Quantity</label>
              <input
                type="number"
                min="1"
                value={saleData.quantity}
                onChange={(e) => setSaleData({ ...saleData, quantity: e.target.value })}
                placeholder="Enter quantity"
                required
              />
            </div>

            <div className="form-group">
              <label>Price Per Unit</label>
              <input
                type="number"
                step="0.01"
                value={saleData.price_per_unit}
                onChange={(e) => setSaleData({ ...saleData, price_per_unit: e.target.value })}
                placeholder="Price"
                required
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">✓ Record Sale</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowSaleForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Recent Sales */}
      <div className="sales-list">
        <h2>Recent Sales</h2>
        <table>
          <thead>
            <tr>
              <th>Sale ID</th>
              <th>Product</th>
              <th>Quantity</th>
              <th>Price/Unit</th>
              <th>Total</th>
              <th>User</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sales.map(sale => (
              <tr key={sale.id}>
                <td>#{sale.id}</td>
                <td>{sale.product_name}</td>
                <td>{sale.quantity}</td>
                <td>${sale.price_per_unit.toFixed(2)}</td>
                <td><strong>${sale.total_amount.toFixed(2)}</strong></td>
                <td>{sale.username}</td>
                <td>{new Date(sale.created_at).toLocaleDateString()}</td>
                <td>
                  <span className={`badge ${sale.status === 'COMPLETED' ? 'success' : 'danger'}`}>
                    {sale.status}
                  </span>
                </td>
                <td>
                  {sale.status === 'COMPLETED' && (
                    <button
                      className="action-btn danger"
                      onClick={() => handleCancelSale(sale.id)}
                      title="Cancel Sale"
                    >
                      ↺ Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Auto-Reorder Settings */}
      <div className="reorder-settings">
        <h3>Automated Reordering</h3>
        <label>
          Reorder Threshold:
          <input
            type="number"
            value={autoReorderThreshold}
            onChange={(e) => setAutoReorderThreshold(parseInt(e.target.value))}
            min="1"
          />
          <span className="info">Units below this level trigger automatic reorder</span>
        </label>
      </div>

      <div className="sales-stats">
        <p>Total Sales Today: <strong>{sales.filter(s => new Date(s.created_at).toDateString() === new Date().toDateString()).length}</strong></p>
        <p>Total Revenue Today: <strong>${sales.filter(s => new Date(s.created_at).toDateString() === new Date().toDateString()).reduce((sum, s) => sum + s.total_amount, 0).toFixed(2)}</strong></p>
      </div>
    </div>
  );
}

export default Sales;
