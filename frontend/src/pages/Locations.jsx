import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Locations.css';

function Locations({ apiUrl }) {
  const [locations, setLocations] = useState([]);
  const [stock, setStock] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [form, setForm] = useState({ product_id: '', from_location_id: '', to_location_id: '', quantity: '', notes: '' });
  const [message, setMessage] = useState('');

  const loadData = async () => {
    const [locationsResponse, stockResponse, transfersResponse] = await Promise.all([
      axios.get(`${apiUrl}/locations`),
      axios.get(`${apiUrl}/locations/stock`),
      axios.get(`${apiUrl}/locations/transfers`)
    ]);
    setLocations(locationsResponse.data);
    setStock(stockResponse.data);
    setTransfers(transfersResponse.data);
  };

  useEffect(() => {
    loadData().catch((error) => setMessage(error.response?.data?.error || 'Unable to load location data.'));
  }, []);

  const submitTransfer = async (event) => {
    event.preventDefault();
    try {
      await axios.post(`${apiUrl}/locations/transfers`, { ...form, product_id: Number(form.product_id), from_location_id: Number(form.from_location_id), to_location_id: Number(form.to_location_id), quantity: Number(form.quantity) });
      setMessage('Stock transferred successfully.');
      setForm({ product_id: '', from_location_id: '', to_location_id: '', quantity: '', notes: '' });
      loadData();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Unable to transfer stock.');
    }
  };

  const products = [...new Map(stock.map((item) => [item.product_id, { id: item.product_id, name: item.product_name, sku: item.sku }])).values()];

  return (
    <div className="locations">
      <div className="locations-header"><div><h1>Locations & Transfers</h1><p>Track stock by warehouse or store and transfer inventory between locations.</p></div>{message && <span className="locations-message">{message}</span>}</div>
      <section className="locations-panel">
        <h2>Transfer Stock</h2>
        <form className="transfer-form" onSubmit={submitTransfer}>
          <select value={form.product_id} onChange={(event) => setForm({ ...form, product_id: event.target.value })} required><option value="">Select product</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name} ({product.sku})</option>)}</select>
          <select value={form.from_location_id} onChange={(event) => setForm({ ...form, from_location_id: event.target.value })} required><option value="">From location</option>{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select>
          <select value={form.to_location_id} onChange={(event) => setForm({ ...form, to_location_id: event.target.value })} required><option value="">To location</option>{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select>
          <input type="number" min="1" placeholder="Quantity" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} required />
          <button className="btn btn-primary" type="submit">Transfer Stock</button>
        </form>
      </section>
      <section className="locations-panel"><h2>Location Stock</h2><div className="location-grid">{locations.map((location) => <div className="location-card" key={location.id}><strong>{location.name}</strong><span>{location.code} · {location.type}</span><b>{stock.filter((item) => item.location_id === location.id).reduce((sum, item) => sum + item.quantity, 0)} units</b></div>)}</div></section>
      <section className="locations-panel"><h2>Stock by Location</h2><div className="locations-table"><table><thead><tr><th>Location</th><th>Product</th><th>SKU</th><th>Quantity</th></tr></thead><tbody>{stock.map((item) => <tr key={`${item.location_id}-${item.product_id}`}><td>{item.location_name}</td><td>{item.product_name}</td><td>{item.sku}</td><td>{item.quantity}</td></tr>)}</tbody></table></div></section>
      <section className="locations-panel"><h2>Recent Transfers</h2><div className="locations-table"><table><thead><tr><th>Product</th><th>From</th><th>To</th><th>Quantity</th><th>Date</th></tr></thead><tbody>{transfers.map((transfer) => <tr key={transfer.id}><td>{transfer.product_name}</td><td>{transfer.from_location_name}</td><td>{transfer.to_location_name}</td><td>{transfer.quantity}</td><td>{new Date(transfer.created_at).toLocaleString()}</td></tr>)}</tbody></table></div></section>
    </div>
  );
}

export default Locations;
