import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Barcode from 'react-barcode';
import './Inventory.css';

function Inventory({ apiUrl, user }) {
  const [products, setProducts] = useState([]);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: '',
    price: '',
    quantity: '',
    min_stock: '10',
  });

  useEffect(() => {
    fetchProducts();
  }, [lowStockOnly]);

  const fetchProducts = async () => {
    try {
      const params = lowStockOnly ? '?low_stock=true' : '';
      const response = await axios.get(`${apiUrl}/inventory${params}`);
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      alert('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchProducts();
      return;
    }

    try {
      const response = await axios.get(`${apiUrl}/inventory/search/${searchQuery}`);
      setProducts(response.data);
    } catch (error) {
      console.error('Search failed:', error);
      alert('Search failed');
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (user.role !== 'ADMIN') {
      alert('Only admins can add products');
      return;
    }

    try {
      await axios.post(`${apiUrl}/inventory`, {
        ...formData,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        min_stock: parseInt(formData.min_stock),
      });

      alert('Product added successfully');
      setFormData({ sku: '', name: '', category: '', price: '', quantity: '', min_stock: '10' });
      setShowAddForm(false);
      fetchProducts();
    } catch (error) {
      console.error('Failed to add product:', error);
      alert('Failed to add product: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteProduct = async (id) => {
    if (user.role !== 'ADMIN') {
      alert('Only admins can delete products');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      await axios.delete(`${apiUrl}/inventory/${id}`);
      alert('Product deleted');
      fetchProducts();
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('Failed to delete product');
    }
  };

  const handleAdjustStock = async (id, change, reason) => {
    try {
      await axios.post(`${apiUrl}/inventory/${id}/adjust-stock`, {
        quantity_change: change,
        reason: reason,
      });
      alert('Stock adjusted');
      fetchProducts();
    } catch (error) {
      console.error('Failed to adjust stock:', error);
      alert('Failed to adjust stock');
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="loading">Loading inventory...</div>;

  return (
    <div className="inventory">
      <div className="inventory-header">
        <h1>Inventory Management</h1>
        <div className="header-actions">
          {user.role === 'ADMIN' && (
            <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
              + Add Product
            </button>
          )}
          <button
            className={`btn ${lowStockOnly ? 'btn-warning' : 'btn-secondary'}`}
            onClick={() => setLowStockOnly(!lowStockOnly)}
          >
            {lowStockOnly ? '✓ Low Stock' : 'Show Low Stock'}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <form className="search-bar" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search by SKU or name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button type="submit">🔍 Search</button>
      </form>

      {/* Add Product Form */}
      {showAddForm && user.role === 'ADMIN' && (
        <div className="add-product-form">
          <h2>Add New Product</h2>
          <form onSubmit={handleAddProduct}>
            <div className="form-row">
              <input
                type="text"
                placeholder="SKU"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Product Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-row">
              <input
                type="text"
                placeholder="Category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
              <input
                type="number"
                placeholder="Price"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                step="0.01"
                required
              />
            </div>
            <div className="form-row">
              <input
                type="number"
                placeholder="Quantity"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
              <input
                type="number"
                placeholder="Min Stock"
                value={formData.min_stock}
                onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Save Product</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Products Table */}
      <div className="products-table">
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Quantity</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(product => (
              <tr key={product.id} className={product.quantity < product.min_stock ? 'low-stock' : ''}>
                <td><code>{product.sku}</code></td>
                <td>{product.name}</td>
                <td>{product.category || '-'}</td>
                <td>${product.price.toFixed(2)}</td>
                <td>{product.quantity}</td>
                <td>
                  {product.quantity < product.min_stock ? (
                    <span className="badge warning">⚠️ Low</span>
                  ) : (
                    <span className="badge success">✓ OK</span>
                  )}
                </td>
                <td className="actions">
                  <button
                    className="action-btn"
                    title="View Barcode"
                    onClick={() => {
                      setSelectedProduct(product);
                      setShowBarcodeModal(true);
                    }}
                  >
                    📦
                  </button>
                  <button
                    className="action-btn"
                    title="Add Stock"
                    onClick={() => {
                      const qty = prompt('Add quantity:');
                      if (qty) handleAdjustStock(product.id, parseInt(qty), 'Manual restock');
                    }}
                  >
                    ➕
                  </button>
                  {user.role === 'ADMIN' && (
                    <button
                      className="action-btn danger"
                      title="Delete"
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      🗑️
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Barcode Modal */}
      {showBarcodeModal && selectedProduct && (
        <div className="modal-overlay" onClick={() => setShowBarcodeModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{selectedProduct.name}</h2>
            <div className="barcode-display">
              <Barcode value={selectedProduct.sku} />
            </div>
            <p>SKU: {selectedProduct.sku}</p>
            <button className="btn btn-primary" onClick={() => window.print()}>🖨️ Print</button>
            <button className="btn btn-secondary" onClick={() => setShowBarcodeModal(false)}>Close</button>
          </div>
        </div>
      )}

      <div className="inventory-stats">
        <p>Total Products: <strong>{filteredProducts.length}</strong></p>
        <p>Low Stock Items: <strong>{filteredProducts.filter(p => p.quantity < p.min_stock).length}</strong></p>
      </div>
    </div>
  );
}

export default Inventory;
