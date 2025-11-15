# Deployment Guide 🚀

## Production Deployment for VPN Anti-DPI System

This guide covers deploying the VPN system to production with proper security, scaling, and monitoring.

---

## Table of Contents

1. [Server Requirements](#server-requirements)
2. [Security Checklist](#security-checklist)
3. [Docker Deployment](#docker-deployment)
4. [Nginx Reverse Proxy](#nginx-reverse-proxy)
5. [SSL/TLS Certificates](#ssltls-certificates)
6. [Database Migration](#database-migration)
7. [Monitoring & Logging](#monitoring--logging)
8. [Mobile App Deployment](#mobile-app-deployment)

---

## Server Requirements

### Minimum Specs

- **CPU**: 2 cores
- **RAM**: 4 GB
- **Storage**: 20 GB SSD
- **Network**: 100 Mbps
- **OS**: Ubuntu 22.04 LTS (recommended)

### Recommended Specs (for 1000+ users)

- **CPU**: 4+ cores
- **RAM**: 8+ GB
- **Storage**: 50+ GB SSD
- **Network**: 1 Gbps
- **Load Balancer**: Required

---

## Security Checklist

Before deploying to production:

- [ ] Change all default passwords
- [ ] Generate proper SSL certificates (Let's Encrypt)
- [ ] Configure firewall (UFW/iptables)
- [ ] Enable fail2ban for SSH protection
- [ ] Set up automated backups
- [ ] Configure monitoring and alerts
- [ ] Use environment variables for secrets
- [ ] Enable Docker security scanning
- [ ] Set up VPN over HTTPS only
- [ ] Implement rate limiting

---

## Docker Deployment

### 1. Prepare Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Clone Repository

```bash
git clone https://github.com/hosseing2gland-bit/vpn-anti-dpi-system.git
cd vpn-anti-dpi-system/server
```

### 3. Configure Environment

```bash
cp vpn-server/.env.example vpn-server/.env
```

Edit `.env`:
```env
# Database (Use strong passwords!)
DB_USER=vpnuser
DB_PASSWORD=CHANGE_THIS_TO_SECURE_PASSWORD
DB_NAME=vpndb
DB_HOST=postgres
DB_PORT=5432

# Security Keys (Generate new ones!)
SHARED_KEY=$(openssl rand -hex 16)
JWT_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 32)

# Server Ports
VPN_PORT_TLS=8443
VPN_PORT_WS=8444

# Environment
NODE_ENV=production
```

### 4. Generate SSL Certificates

#### Option A: Let's Encrypt (Recommended)

```bash
sudo apt install certbot
sudo certbot certonly --standalone -d vpn.yourdomain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/vpn.yourdomain.com/fullchain.pem vpn-server/cert.pem
sudo cp /etc/letsencrypt/live/vpn.yourdomain.com/privkey.pem vpn-server/key.pem
```

#### Option B: Self-Signed (Development Only)

```bash
cd vpn-server
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=vpn.yourdomain.com"
```

### 5. Deploy with Docker Compose

```bash
docker-compose up -d
```

### 6. Initialize Database

```bash
docker exec vpn-server node setup-database.js
```

---

## Nginx Reverse Proxy

For better performance and security, use Nginx as a reverse proxy.

### Install Nginx

```bash
sudo apt install nginx
```

### Configure Nginx

Create `/etc/nginx/sites-available/vpn`:

```nginx
upstream vpn_tls {
    server localhost:8443;
}

upstream vpn_ws {
    server localhost:8444;
}

server {
    listen 443 ssl http2;
    server_name vpn.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/vpn.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/vpn.yourdomain.com/privkey.pem;

    ssl_protocols TLSv1.3;
    ssl_ciphers 'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256';
    ssl_prefer_server_ciphers on;

    # TLS endpoint
    location / {
        proxy_pass https://vpn_tls;
        proxy_ssl_verify off;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # WebSocket endpoint
    location /ws {
        proxy_pass http://vpn_ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name vpn.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/vpn /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Firewall Configuration

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTPS
sudo ufw allow 443/tcp

# Allow HTTP (for Let's Encrypt)
sudo ufw allow 80/tcp

# Allow VPN ports (if not using Nginx)
sudo ufw allow 8443/tcp
sudo ufw allow 8444/tcp

# Enable firewall
sudo ufw enable
```

---

## Database Backup

### Automated Daily Backup

Create `/root/backup-vpn-db.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/backups/vpn"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

docker exec vpn-postgres pg_dump -U vpnuser vpndb > $BACKUP_DIR/vpn_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/vpn_$DATE.sql"
```

Add to crontab:

```bash
sudo chmod +x /root/backup-vpn-db.sh
sudo crontab -e

# Add line:
0 2 * * * /root/backup-vpn-db.sh
```

---

## Monitoring & Logging

### Install Prometheus & Grafana

Add to `docker-compose.yml`:

```yaml
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f vpn-server

# Last 100 lines
docker-compose logs --tail=100 vpn-server
```

---

## Mobile App Deployment

### Build Android APK

```bash
cd mobile-app

# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build
eas build --platform android --profile production
```

### Build iOS IPA

```bash
eas build --platform ios --profile production
```

### Update App Config

Edit `mobile-app/.env`:

```env
API_BASE_URL=https://vpn.yourdomain.com
WS_URL=wss://vpn.yourdomain.com/ws
ENABLE_TLS_PINNING=true
CERT_HASH_1=your-cert-hash-here
```

---

## Health Checks

### Server Health Endpoint

Add to `server-phase7.js`:

```javascript
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});
```

### Automated Health Checks

Create `/root/check-vpn-health.sh`:

```bash
#!/bin/bash
RESPONSE=$(curl -s http://localhost:8444/health)

if [ -z "$RESPONSE" ]; then
    echo "VPN Server is down! Restarting..."
    docker-compose restart vpn-server
    # Send alert (email, Slack, etc.)
fi
```

Add to crontab:

```bash
*/5 * * * * /root/check-vpn-health.sh
```

---

## Performance Tuning

### Node.js Optimization

Edit `docker-compose.yml`:

```yaml
vpn-server:
  environment:
    - NODE_ENV=production
    - NODE_OPTIONS=--max-old-space-size=2048
```

### PostgreSQL Tuning

```bash
docker exec -it vpn-postgres psql -U postgres

ALTER SYSTEM SET shared_buffers = '512MB';
ALTER SYSTEM SET effective_cache_size = '2GB';
ALTER SYSTEM SET maintenance_work_mem = '128MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;

SELECT pg_reload_conf();
```

---

## Scaling

### Load Balancing

For high traffic, use multiple VPN server instances:

```yaml
vpn-server:
  deploy:
    replicas: 3
  ports:
    - "8443-8445:8443"
```

### Redis Session Store

Use Redis for shared session storage across instances.

---

## Troubleshooting

### Server Won't Start

```bash
# Check logs
docker-compose logs vpn-server

# Check disk space
df -h

# Check memory
free -m
```

### Database Connection Issues

```bash
# Test connection
docker exec vpn-postgres psql -U vpnuser -d vpndb -c "SELECT 1;"

# Check credentials
docker exec vpn-server env | grep DB_
```

---

## Security Best Practices

1. ✅ Use strong, unique passwords
2. ✅ Enable 2FA for admin accounts
3. ✅ Keep Docker images updated
4. ✅ Use secrets management (Vault, AWS Secrets Manager)
5. ✅ Enable audit logging
6. ✅ Regular security scans
7. ✅ Limit database access
8. ✅ Use network segmentation

---

## Support

For deployment issues:

- 📚 [Documentation](../README.md)
- 🐛 [Report Issues](https://github.com/hosseing2gland-bit/vpn-anti-dpi-system/issues)
- 💬 [Discussions](https://github.com/hosseing2gland-bit/vpn-anti-dpi-system/discussions)

---

**Good luck with your deployment! 🎉**
