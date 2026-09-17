import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './SaaSPortal.css';

function SaaSPortal({ apiUrl, onBackToLogin }) {
  const [plans, setPlans] = useState([]);
  const [saasToken, setSaasToken] = useState(localStorage.getItem('saasToken'));
  const [account, setAccount] = useState(JSON.parse(localStorage.getItem('saasUser') || 'null'));
  const [status, setStatus] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [waste, setWaste] = useState([]);
  const [message, setMessage] = useState('');
  const [signup, setSignup] = useState({ organizationName: '', username: '', email: '', password: '' });
  const [ingredient, setIngredient] = useState({ name: '', sku: '', unit: 'kg', cost_per_unit: '', quantity: '', reorder_level: '' });
  const [wasteForm, setWasteForm] = useState({ ingredient_id: '', quantity: '', reason: '' });

  const request = (method, path, data) => axios({ method, url: `${apiUrl}${path}`, data, headers: saasToken ? { Authorization: `Bearer ${saasToken}` } : {} });

  const loadPortal = async () => {
    const plansResponse = await axios.get(`${apiUrl}/billing/plans`);
    setPlans(plansResponse.data);
    if (!saasToken) return;
    const [statusResponse, ingredientsResponse, recipesResponse, wasteResponse] = await Promise.all([
      request('get', '/billing/status'),
      request('get', '/restaurant/ingredients'),
      request('get', '/restaurant/recipes'),
      request('get', '/restaurant/waste')
    ]);
    setStatus(statusResponse.data);
    setIngredients(ingredientsResponse.data);
    setRecipes(recipesResponse.data);
    setWaste(wasteResponse.data);
  };

  useEffect(() => { loadPortal().catch((error) => setMessage(error.response?.data?.error || 'SaaS API is not connected on this API instance.')); }, [saasToken]);

  const register = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post(`${apiUrl}/saas/register`, signup);
      const loginResponse = await axios.post(`${apiUrl}/saas/login`, { username: signup.username, password: signup.password });
      localStorage.setItem('saasToken', loginResponse.data.token);
      localStorage.setItem('saasUser', JSON.stringify(loginResponse.data.user));
      setSaasToken(loginResponse.data.token);
      setAccount(response.data.user);
      setMessage(`Organization ${response.data.organization.name} created with a 14-day trial.`);
    } catch (error) { setMessage(error.response?.data?.error || 'Unable to create organization.'); }
  };

  const addIngredient = async (event) => {
    event.preventDefault();
    try {
      await request('post', '/restaurant/ingredients', { ...ingredient, cost_per_unit: Number(ingredient.cost_per_unit), quantity: Number(ingredient.quantity), reorder_level: Number(ingredient.reorder_level || 0) });
      setIngredient({ name: '', sku: '', unit: 'kg', cost_per_unit: '', quantity: '', reorder_level: '' });
      setMessage('Ingredient added.');
      loadPortal();
    } catch (error) { setMessage(error.response?.data?.error || 'Unable to add ingredient.'); }
  };

  const recordWaste = async (event) => {
    event.preventDefault();
    try {
      await request('post', '/restaurant/waste', { ...wasteForm, quantity: Number(wasteForm.quantity) });
      setWasteForm({ ingredient_id: '', quantity: '', reason: '' });
      setMessage('Waste event recorded.');
      loadPortal();
    } catch (error) { setMessage(error.response?.data?.error || 'Unable to record waste.'); }
  };

  return (
    <div className="saas-portal">
      <div className="saas-header"><div><h1>SaaS Restaurant Portal</h1><p>Organization onboarding, plans, ingredients, food cost, and waste control.</p></div><div className="saas-header-actions">{onBackToLogin && <button className="btn btn-secondary" type="button" onClick={onBackToLogin}>Back to demo login</button>}{message && <span className="saas-message">{message}</span>}</div></div>
      {!saasToken ? <section className="saas-panel"><h2>Create your restaurant workspace</h2><form className="saas-form" onSubmit={register}><input placeholder="Restaurant name" value={signup.organizationName} onChange={(event) => setSignup({ ...signup, organizationName: event.target.value })} required /><input placeholder="Owner username" value={signup.username} onChange={(event) => setSignup({ ...signup, username: event.target.value })} required /><input type="email" placeholder="Owner email" value={signup.email} onChange={(event) => setSignup({ ...signup, email: event.target.value })} required /><input type="password" minLength="8" placeholder="Password (8+ characters)" value={signup.password} onChange={(event) => setSignup({ ...signup, password: event.target.value })} required /><button className="btn btn-primary" type="submit">Start free trial</button></form></section> : <><section className="saas-panel account-panel"><div><h2>{account?.organizationName || 'Restaurant workspace'}</h2><p>Owner: {account?.username} · Plan: {status?.plan || account?.plan} · Status: {status?.status || account?.subscriptionStatus}</p></div></section><section className="plan-grid">{plans.map((plan) => <article className="plan-card" key={plan.id}><h3>{plan.name}</h3><ul>{plan.features.map((feature) => <li key={feature}>{feature}</li>)}</ul><button className="btn btn-secondary" type="button" onClick={() => setMessage('Add Stripe test price IDs to enable checkout.')}>Choose plan</button></article>)}</section><div className="saas-grid"><section className="saas-panel"><h2>Add Ingredient</h2><form className="saas-form" onSubmit={addIngredient}><input placeholder="Ingredient name" value={ingredient.name} onChange={(event) => setIngredient({ ...ingredient, name: event.target.value })} required /><input placeholder="SKU" value={ingredient.sku} onChange={(event) => setIngredient({ ...ingredient, sku: event.target.value })} required /><input placeholder="Unit" value={ingredient.unit} onChange={(event) => setIngredient({ ...ingredient, unit: event.target.value })} required /><input type="number" step="0.01" placeholder="Cost per unit" value={ingredient.cost_per_unit} onChange={(event) => setIngredient({ ...ingredient, cost_per_unit: event.target.value })} required /><input type="number" step="0.01" placeholder="Quantity" value={ingredient.quantity} onChange={(event) => setIngredient({ ...ingredient, quantity: event.target.value })} required /><button className="btn btn-primary" type="submit">Save ingredient</button></form></section><section className="saas-panel"><h2>Record Waste</h2><form className="saas-form" onSubmit={recordWaste}><select value={wasteForm.ingredient_id} onChange={(event) => setWasteForm({ ...wasteForm, ingredient_id: event.target.value })} required><option value="">Select ingredient</option>{ingredients.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.quantity} {item.unit})</option>)}</select><input type="number" step="0.01" placeholder="Quantity wasted" value={wasteForm.quantity} onChange={(event) => setWasteForm({ ...wasteForm, quantity: event.target.value })} required /><input placeholder="Reason" value={wasteForm.reason} onChange={(event) => setWasteForm({ ...wasteForm, reason: event.target.value })} required /><button className="btn btn-warning" type="submit">Record waste</button></form></section></div><section className="saas-panel"><h2>Recipe Profitability</h2><div className="saas-table"><table><thead><tr><th>Recipe</th><th>Food cost</th><th>Gross profit</th><th>Margin</th></tr></thead><tbody>{recipes.map((recipe) => <tr key={recipe.id}><td>{recipe.name}</td><td>${recipe.food_cost.toFixed(2)}</td><td>${recipe.gross_profit.toFixed(2)}</td><td>{recipe.margin_percent.toFixed(1)}%</td></tr>)}</tbody></table></div></section><section className="saas-panel"><h2>Waste History</h2><div className="saas-table"><table><thead><tr><th>Ingredient</th><th>Quantity</th><th>Cost</th><th>Reason</th></tr></thead><tbody>{waste.map((item) => <tr key={item.id}><td>{item.ingredient_name}</td><td>{item.quantity}</td><td>${Number(item.cost).toFixed(2)}</td><td>{item.reason}</td></tr>)}</tbody></table></div></section></>}
    </div>
  );
}

export default SaaSPortal;
