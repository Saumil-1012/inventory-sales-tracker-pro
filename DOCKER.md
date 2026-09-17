# Inventory & Sales Tracker - Docker Deployment Guide

## Quick Start

### Build and Run

```bash
# Build the Docker image
docker build -f backend/Dockerfile -t inventory-api:2.0 .

# Run with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop
docker-compose down
```

### Verify Deployment

```bash
# Check health
curl http://localhost:3001/api/health

# Create user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin12345","email":"admin@example.com","role":"ADMIN"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin12345"}'
```

## Production Deployment

### Environment Configuration

Create `.env` file:
```env
NODE_ENV=production
PORT=3001
DB_PATH=./data/inventory.db
JWT_SECRET=your-very-secure-random-key-here
JWT_EXPIRE=7d
```

Generate secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Docker Compose (Production)

```bash
# Start services
docker-compose up -d

# View status
docker-compose ps

# Check logs
docker-compose logs api

# Scale services (with load balancer)
docker-compose up -d --scale api=3
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: inventory-api
  labels:
    app: inventory-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: inventory-api
  template:
    metadata:
      labels:
        app: inventory-api
    spec:
      containers:
      - name: api
        image: inventory-api:2.0
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: api-secrets
              key: jwt-secret
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3001
          initialDelaySeconds: 10
          periodSeconds: 10
```

Deploy:
```bash
kubectl apply -f kubernetes-deployment.yaml
kubectl expose deployment inventory-api --type=LoadBalancer --port=3001
```

### AWS/ECS Deployment

Push to ECR:
```bash
# Create ECR repository
aws ecr create-repository --repository-name inventory-api

# Build and push
docker build -f backend/Dockerfile -t inventory-api:2.0 .
docker tag inventory-api:2.0 123456789.dkr.ecr.us-east-1.amazonaws.com/inventory-api:2.0
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/inventory-api:2.0
```

### Heroku Deployment

```bash
# Login to Heroku
heroku login

# Create app
heroku create inventory-api

# Set environment
heroku config:set NODE_ENV=production JWT_SECRET=your-secret

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

## Persistence & Backups

### SQLite Backup

```bash
# Backup database
docker exec inventory-api cp /app/backend/data/inventory.db /app/backend/data/inventory.db.backup

# Restore
docker exec inventory-api cp /app/backend/data/inventory.db.backup /app/backend/data/inventory.db
```

### PostgreSQL Migration

Uncomment PostgreSQL in docker-compose.yml for production:

```yaml
db:
  image: postgres:16-alpine
  environment:
    POSTGRES_USER: inventory_user
    POSTGRES_PASSWORD: changeme
    POSTGRES_DB: inventory_db
```

Update backend config.js to use PostgreSQL:
```javascript
const pg = require('pg');
const pool = new pg.Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: 5432
});
```

## Monitoring

### Container Health

```bash
# Check container status
docker-compose ps

# View resource usage
docker stats inventory-api

# View logs
docker logs inventory-api -f --tail 100
```

### Application Metrics

Add Prometheus endpoint:
```bash
# Endpoint: GET /metrics
```

### Alerts

Set up alerts for:
- API response time > 500ms
- Error rate > 1%
- Database disk usage > 80%
- Memory usage > 90%

## Security

- Use non-root user in Dockerfile
- Enable read-only filesystem where possible
- Use secrets management (HashiCorp Vault, AWS Secrets Manager)
- Enable API rate limiting
- Use HTTPS/TLS in production
- Regular security scanning (Trivy, Snyk)

## Performance Optimization

```bash
# Enable gzip compression
docker run -e COMPRESSION=true inventory-api:2.0

# Increase Node.js memory
docker run -e NODE_OPTIONS=--max-old-space-size=4096 inventory-api:2.0

# Use multi-stage builds
docker build --target production -f backend/Dockerfile .
```

## Troubleshooting

### Port already in use
```bash
# Change port in docker-compose.yml
ports:
  - "8080:3001"  # External:Internal
```

### Database locked
```bash
# Restart container
docker-compose restart api
```

### Connection refused
```bash
# Check network
docker network ls
docker network inspect inventory_inventory-network
```

### Memory issues
```bash
# Check limits
docker stats inventory-api

# Increase in docker-compose.yml
services:
  api:
    mem_limit: 2g
    memswap_limit: 2g
```

---

For more info: See README.md and backend/README.md
