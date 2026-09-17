# Inventory Tracker Pro - React Frontend

Modern, responsive web dashboard for inventory management.

## Features

✅ **Real-time Dashboard** - KPIs, charts, trends  
✅ **Inventory Management** - Product CRUD, search, barcode  
✅ **Sales Tracking** - Record, filter, reverse transactions  
✅ **Analytics** - Revenue trends, top products, category breakdown  
✅ **Automated Reordering** - Low-stock alerts & auto-reorder  
✅ **Barcode Support** - Generate & print barcodes  
✅ **Responsive Design** - Works on desktop, tablet, mobile  

## Quick Start

```bash
# Install dependencies
npm install

# Development server (http://localhost:3000)
npm run dev

# Production build
npm build

# Preview production build
npm run preview
```

## Login Credentials

**Admin:**
- Username: `admin1`
- Password: `admin12345`

**Staff:**
- Username: `staff1`
- Password: `staff123`

## API Integration

Connects to REST API running on `http://localhost:3001`

Endpoints used:
- `/api/auth/login` - Authentication
- `/api/inventory` - Product management
- `/api/sales` - Sales transactions
- `/api/analytics` - Reports & charts

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **React Router** - Navigation
- **Axios** - HTTP client
- **Recharts** - Charts & graphs
- **react-barcode** - Barcode generation

## Project Structure

```
frontend/
├── src/
│   ├── App.jsx              # Main app component
│   ├── App.css
│   ├── components/
│   │   └── Navigation.jsx
│   ├── pages/
│   │   ├── Dashboard.jsx    # KPI & charts
│   │   ├── Inventory.jsx    # Product management
│   │   ├── Sales.jsx        # Sales tracking
│   │   ├── Analytics.jsx    # Reports
│   │   ├── Settings.jsx     # User settings
│   │   └── Login.jsx        # Auth page
│   └── main.jsx
├── index.html
├── vite.config.js
└── package.json
```

## Development

### Environment Variables

Create `.env` if needed:
```
VITE_API_URL=http://localhost:3001/api
```

### Building

```bash
npm run build  # Creates /dist folder for production
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Next Steps

- [ ] Add PWA support for offline mode
- [ ] Implement mobile app (React Native)
- [ ] Add advanced filters & exports
- [ ] Setup CI/CD for auto-deploy

---

For backend API docs, see `backend/README.md`
