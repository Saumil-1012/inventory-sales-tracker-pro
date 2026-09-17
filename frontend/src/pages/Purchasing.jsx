import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Purchasing.css';

function Purchasing({ apiUrl }) {
  const [suppliers, setSuppliers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [supplierForm, setSupplierForm] = useState({ name: '', contact_person: '', email: '', phone: '', lead_time_days: 7 });
  const [message, setMessage] = useState('');

  const loadData = async () => {
    const [supplierResponse, orderResponse, productResponse] = await Promise.all([
      axios.get(`${apiUrl}/purchasing/suppliers`),
      axios.get(`${apiUrl}/purchasing/orders`),
      axios.get(`${apiUrl}/inventory`)
    ]);
    setSuppliers(supplierResponse.data);
    setOrders(orderResponse.data);
    setProducts(productResponse.data);
  };

  useEffect(() => {
    loadData().catch((error) => setMessage(error.response?.data?.error || 'Unable to load purchasing data.'));
  }, []);

  const createSupplier = async (event) => {
    event.preventDefault();
    try {
      await axios.post(`${apiUrl}/purchasing/suppliers`, supplierForm);
      setSupplierForm({ name: '', contact_person: '', email: '', phone: '', lead_time_days: 7 });
      setMessage('Supplier created.');
      loadData();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Unable to create supplier.');
    }
  };

  const createOrder = async (event) => {
    event.preventDefault();
    try {
      await axios.post(`${apiUrl}/purchasing/orders`, {
        supplier_id: Number(selectedSupplier),
        items: [{ product_id: Number(selectedProduct), quantity: Number(quantity), unit_cost: Number(unitCost) }]
      });
      setMessage('Purchase order created.');
      setSelectedProduct('');
      setQuantity('');
      setUnitCost('');
      loadData();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Unable to create purchase order.');
    }
  };

  const receiveOrder = async (id) => {
    try {
      await axios.post(`${apiUrl}/purchasing/orders/${id}/receive`);
      setMessage('Purchase order received and stock updated.');
      loadData();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Unable to receive purchase order.');
    }
  };

  return (
    <div className="purchasing">
      <div className="purchasing-header">
        <div>
          <h1>Suppliers & Purchasing</h1>
          <p>Manage vendors, create purchase orders, and receive stock into inventory.</p>
        </div>
        {message && <span className="purchasing-message">{message}</span>}
      </div>

      <div className="purchasing-grid">
        <section className="purchasing-panel">
          <h2>Create Supplier</h2>
          <form onSubmit={createSupplier}>
            <input placeholder="Supplier name" value={supplierForm.name} onChange={(event) => setSupplierForm({ ...supplierForm, name: event.target.value })} required />
            <input placeholder="Contact person" value={supplierForm.contact_person} onChange={(event) => setSupplierForm({ ...supplierForm, contact_person: event.target.value })} />
            <input type="email" placeholder="Email" value={supplierForm.email} onChange={(event) => setSupplierForm({ ...supplierForm, email: event.target.value })} />
            <input placeholder="Phone" value={supplierForm.phone} onChange={(event) => setSupplierForm({ ...supplierForm, phone: event.target.value })} />
            <button className="btn btn-primary" type="submit">Add Supplier</button>
          </form>
        </section>

        <section className="purchasing-panel">
          <h2>Create Purchase Order</h2>
          <form onSubmit={createOrder}>
            <select value={selectedSupplier} onChange={(event) => setSelectedSupplier(event.target.value)} required>
              <option value="">Select supplier</option>
              {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
            </select>
            <select value={selectedProduct} onChange={(event) => setSelectedProduct(event.target.value)} required>
              <option value="">Select product</option>
              {products.map((product) => <option key={product.id} value={product.id}>{product.name} ({product.quantity} in stock)</option>)}
            </select>
            <input type="number" min="1" placeholder="Quantity" value={quantity} onChange={(event) => setQuantity(event.target.value)} required />
            <input type="number" min="0" step="0.01" placeholder="Unit cost" value={unitCost} onChange={(event) => setUnitCost(event.target.value)} required />
            <button className="btn btn-primary" type="submit">Create Purchase Order</button>
          </form>
        </section>
      </div>

      <section className="purchasing-panel supplier-list">
        <h2>Suppliers</h2>
        <div className="supplier-cards">
          {suppliers.map((supplier) => <div className="supplier-card" key={supplier.id}><strong>{supplier.name}</strong><span>{supplier.contact_person || 'No contact assigned'}</span><span>{supplier.email || 'No email'} · {supplier.lead_time_days} day lead time</span></div>)}
        </div>
      </section>

      <section className="purchasing-panel">
        <h2>Purchase Orders</h2>
        <div className="orders-table">
          <table>
            <thead><tr><th>Order</th><th>Supplier</th><th>Items</th><th>Total</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>{orders.map((order) => <tr key={order.id}><td>{order.order_number}</td><td>{order.supplier_name}</td><td>{order.item_count}</td><td>${order.total_amount.toFixed(2)}</td><td><span className={`order-status ${order.status.toLowerCase()}`}>{order.status}</span></td><td>{order.status !== 'RECEIVED' && <button className="action-btn" onClick={() => receiveOrder(order.id)}>Receive stock</button>}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default Purchasing;
