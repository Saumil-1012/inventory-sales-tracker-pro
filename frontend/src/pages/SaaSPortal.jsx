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
  const [report, setReport] = useState(null);
  const [notifications, setNotifications] = useState({ low_stock_enabled: true, waste_alerts_enabled: true, weekly_report_enabled: false, report_email: '' });
  const [members, setMembers] = useState([]);
  const [recipeForm, setRecipeForm] = useState({ name: '', selling_price: '', ingredient_id: '', ingredient_quantity: '' });
  const [memberForm, setMemberForm] = useState({ username: '', email: '', password: '', role: 'STAFF' });
  const [message, setMessage] = useState('');
  const [signup, setSignup] = useState({ organizationName: '', username: '', email: '', password: '' });
  const [ingredient, setIngredient] = useState({ name: '', sku: '', unit: 'kg', cost_per_unit: '', quantity: '', reorder_level: '' });
  const [wasteForm, setWasteForm] = useState({ ingredient_id: '', quantity: '', reason: '' });

  const request = (method, path, data) => axios({ method, url: `${apiUrl}${path}`, data, headers: saasToken ? { Authorization: `Bearer ${saasToken}` } : {} });

  const loadPortal = async () => {
    const plansResponse = await axios.get(`${apiUrl}/billing/plans`);
    setPlans(plansResponse.data);
    if (!saasToken) return;
    const [statusResponse, ingredientsResponse, recipesResponse, wasteResponse, membersResponse, reportResponse, notificationsResponse] = await Promise.all([
      request('get', '/billing/status'),
      request('get', '/restaurant/ingredients'),
      request('get', '/restaurant/recipes'),
      request('get', '/restaurant/waste'),
      request('get', '/saas/members'),
      request('get', '/restaurant/report'),
      request('get', '/restaurant/notifications')
    ]);
    setStatus(statusResponse.data);
    setIngredients(ingredientsResponse.data);
    setRecipes(recipesResponse.data);
    setWaste(wasteResponse.data);
    setMembers(membersResponse.data);
    setReport(reportResponse.data);
    setNotifications(notificationsResponse.data);
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

  const createRecipe = async (event) => {
    event.preventDefault();
    try {
      await request('post', '/restaurant/recipes', {
        name: recipeForm.name,
        selling_price: Number(recipeForm.selling_price),
        items: [{ ingredient_id: recipeForm.ingredient_id, quantity: Number(recipeForm.ingredient_quantity) }]
      });
      setRecipeForm({ name: '', selling_price: '', ingredient_id: '', ingredient_quantity: '' });
      setMessage('Recipe created and food cost calculated.');
      loadPortal();
    } catch (error) { setMessage(error.response?.data?.error || 'Unable to create recipe.'); }
  };

  const inviteMember = async (event) => {
    event.preventDefault();
    try {
      await request('post', '/saas/members', memberForm);
      setMemberForm({ username: '', email: '', password: '', role: 'STAFF' });
      setMessage('Team member added.');
      loadPortal();
    } catch (error) { setMessage(error.response?.data?.error || 'Unable to add team member.'); }
  };

  const changeMemberRole = async (id, role) => {
    try {
      await request('patch', `/saas/members/${id}/role`, { role });
      setMessage('Team role updated.');
      loadPortal();
    } catch (error) { setMessage(error.response?.data?.error || 'Unable to update team role.'); }
  };

  const saveNotifications = async (event) => {
    event.preventDefault();
    try {
      await request('put', '/restaurant/notifications', notifications);
      setMessage('Notification settings saved.');
    } catch (error) { setMessage(error.response?.data?.error || 'Unable to save notification settings.'); }
  };

  return (
    <div className="saas-portal">
      <div className="saas-header"><div><h1>SaaS Restaurant Portal</h1><p>Organization onboarding, plans, ingredients, food cost, and waste control.</p></div><div className="saas-header-actions">{onBackToLogin && <button className="btn btn-secondary" type="button" onClick={onBackToLogin}>Back to demo login</button>}{message && <span className="saas-message">{message}</span>}</div></div>
      {!saasToken ? <section className="saas-panel"><h2>Create your restaurant workspace</h2><form className="saas-form" onSubmit={register}><input placeholder="Restaurant name" value={signup.organizationName} onChange={(event) => setSignup({ ...signup, organizationName: event.target.value })} required /><input placeholder="Owner username" value={signup.username} onChange={(event) => setSignup({ ...signup, username: event.target.value })} required /><input type="email" placeholder="Owner email" value={signup.email} onChange={(event) => setSignup({ ...signup, email: event.target.value })} required /><input type="password" minLength="8" placeholder="Password (8+ characters)" value={signup.password} onChange={(event) => setSignup({ ...signup, password: event.target.value })} required /><button className="btn btn-primary" type="submit">Start free trial</button></form></section> : <><section className="saas-panel account-panel"><div><h2>{account?.organizationName || 'Restaurant workspace'}</h2><p>Owner: {account?.username} · Plan: {status?.plan || account?.plan} · Status: {status?.status || account?.subscriptionStatus}</p></div></section>{report && <section className="summary-stats"><div className="stat-box"><h3>Ingredient Value</h3><p className="stat-number">${Number(report.ingredients.inventory_cost).toFixed(2)}</p></div><div className="stat-box"><h3>30-Day Waste Cost</h3><p className="stat-number">${Number(report.waste.waste_cost).toFixed(2)}</p></div><div className="stat-box"><h3>Average Recipe Margin</h3><p className="stat-number">{Number(report.recipes.average_margin).toFixed(1)}%</p></div></section>}<section className="plan-grid">{plans.map((plan) => <article className="plan-card" key={plan.id}><h3>{plan.name}</h3><ul>{plan.features.map((feature) => <li key={feature}>{feature}</li>)}</ul><button className="btn btn-secondary" type="button" onClick={() => setMessage('Add Stripe test price IDs to enable checkout.')}>Choose plan</button></article>)}</section><div className="saas-grid"><section className="saas-panel"><h2>Add Ingredient</h2><form className="saas-form" onSubmit={addIngredient}><input placeholder="Ingredient name" value={ingredient.name} onChange={(event) => setIngredient({ ...ingredient, name: event.target.value })} required /><input placeholder="SKU" value={ingredient.sku} onChange={(event) => setIngredient({ ...ingredient, sku: event.target.value })} required /><input placeholder="Unit" value={ingredient.unit} onChange={(event) => setIngredient({ ...ingredient, unit: event.target.value })} required /><input type="number" step="0.01" placeholder="Cost per unit" value={ingredient.cost_per_unit} onChange={(event) => setIngredient({ ...ingredient, cost_per_unit: event.target.value })} required /><input type="number" step="0.01" placeholder="Quantity" value={ingredient.quantity} onChange={(event) => setIngredient({ ...ingredient, quantity: event.target.value })} required /><button className="btn btn-primary" type="submit">Save ingredient</button></form></section><section className="saas-panel"><h2>Record Waste</h2><form className="saas-form" onSubmit={recordWaste}><select value={wasteForm.ingredient_id} onChange={(event) => setWasteForm({ ...wasteForm, ingredient_id: event.target.value })} required><option value="">Select ingredient</option>{ingredients.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.quantity} {item.unit})</option>)}</select><input type="number" step="0.01" placeholder="Quantity wasted" value={wasteForm.quantity} onChange={(event) => setWasteForm({ ...wasteForm, quantity: event.target.value })} required /><input placeholder="Reason" value={wasteForm.reason} onChange={(event) => setWasteForm({ ...wasteForm, reason: event.target.value })} required /><button className="btn btn-warning" type="submit">Record waste</button></form></section></div><section className="saas-panel"><h2>Notifications & Reports</h2><form className="saas-form" onSubmit={saveNotifications}><label><input type="checkbox" checked={notifications.low_stock_enabled} onChange={(event) => setNotifications({ ...notifications, low_stock_enabled: event.target.checked })} /> Low-stock alerts</label><label><input type="checkbox" checked={notifications.waste_alerts_enabled} onChange={(event) => setNotifications({ ...notifications, waste_alerts_enabled: event.target.checked })} /> Waste alerts</label><label><input type="checkbox" checked={notifications.weekly_report_enabled} onChange={(event) => setNotifications({ ...notifications, weekly_report_enabled: event.target.checked })} /> Weekly report</label><input type="email" placeholder="Report email" value={notifications.report_email || ''} onChange={(event) => setNotifications({ ...notifications, report_email: event.target.value })} /><button className="btn btn-primary" type="submit">Save notification settings</button></form></section><section className="saas-panel"><h2>Create Recipe</h2><form className="saas-form" onSubmit={createRecipe}><input placeholder="Menu item name" value={recipeForm.name} onChange={(event) => setRecipeForm({ ...recipeForm, name: event.target.value })} required /><input type="number" step="0.01" placeholder="Selling price" value={recipeForm.selling_price} onChange={(event) => setRecipeForm({ ...recipeForm, selling_price: event.target.value })} required /><select value={recipeForm.ingredient_id} onChange={(event) => setRecipeForm({ ...recipeForm, ingredient_id: event.target.value })} required><option value="">Select ingredient</option>{ingredients.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>)}</select><input type="number" step="0.001" min="0.001" placeholder="Ingredient quantity" value={recipeForm.ingredient_quantity} onChange={(event) => setRecipeForm({ ...recipeForm, ingredient_quantity: event.target.value })} required /><button className="btn btn-primary" type="submit">Create recipe</button></form></section><section className="saas-panel"><h2>Team</h2><form className="saas-form team-form" onSubmit={inviteMember}><input placeholder="Username" value={memberForm.username} onChange={(event) => setMemberForm({ ...memberForm, username: event.target.value })} required /><input type="email" placeholder="Email" value={memberForm.email} onChange={(event) => setMemberForm({ ...memberForm, email: event.target.value })} required /><input type="password" minLength="8" placeholder="Temporary password" value={memberForm.password} onChange={(event) => setMemberForm({ ...memberForm, password: event.target.value })} required /><select value={memberForm.role} onChange={(event) => setMemberForm({ ...memberForm, role: event.target.value })}><option value="STAFF">Staff</option><option value="MANAGER">Manager</option><option value="WAREHOUSE">Warehouse</option></select><button className="btn btn-primary" type="submit">Add team member</button></form><div className="saas-table"><table><thead><tr><th>Username</th><th>Email</th><th>Role</th><th>Change role</th></tr></thead><tbody>{members.map((member) => <tr key={member.id}><td>{member.username}</td><td>{member.email}</td><td>{member.role}</td><td>{member.role !== 'ADMIN' && <select value={member.role} onChange={(event) => changeMemberRole(member.id, event.target.value)}><option value="STAFF">Staff</option><option value="MANAGER">Manager</option><option value="WAREHOUSE">Warehouse</option></select>}</td></tr>)}</tbody></table></div></section><section className="saas-panel"><h2>Recipe Profitability</h2><div className="saas-table"><table><thead><tr><th>Recipe</th><th>Food cost</th><th>Gross profit</th><th>Margin</th></tr></thead><tbody>{recipes.map((recipe) => <tr key={recipe.id}><td>{recipe.name}</td><td>${recipe.food_cost.toFixed(2)}</td><td>${recipe.gross_profit.toFixed(2)}</td><td>{recipe.margin_percent.toFixed(1)}%</td></tr>)}</tbody></table></div></section><section className="saas-panel"><h2>Waste History</h2><div className="saas-table"><table><thead><tr><th>Ingredient</th><th>Quantity</th><th>Cost</th><th>Reason</th></tr></thead><tbody>{waste.map((item) => <tr key={item.id}><td>{item.ingredient_name}</td><td>{item.quantity}</td><td>${Number(item.cost).toFixed(2)}</td><td>{item.reason}</td></tr>)}</tbody></table></div></section></>}
    </div>
  );
}

export default SaaSPortal;
