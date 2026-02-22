# Deployment Guide for NeuroNav on AWS EC2

## Prerequisites

- AWS Account
- EC2 instance (Ubuntu 20.04 or later)
- Security group configured for ports 80, 443, 5000, 27017
- Domain name (optional)

## Step 1: Launch EC2 Instance

1. Go to AWS Console > EC2 > Launch Instance
2. Select Ubuntu 20.04 LTS AMI
3. Choose instance type: t3.medium (minimum recommended)
4. Configure security group:
   - Port 22 (SSH): Your IP
   - Port 80 (HTTP): 0.0.0.0/0
   - Port 443 (HTTPS): 0.0.0.0/0
   - Port 5000 (API): 0.0.0.0/0
   - Port 27017 (MongoDB): Security group only

## Step 2: Install Dependencies

```bash
sudo apt update
sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# Install Nginx
sudo apt install -y nginx

# Install PM2 (process manager)
sudo npm install -g pm2
```

## Step 3: Deploy Application

```bash
# Clone repository
cd /home/ubuntu
git clone https://github.com/yourusername/neuronav.git
cd neuronav

# Install dependencies
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..

# Build frontend
cd client
npm run build
cd ..

# Set environment variables
cp .env.example .env
nano .env  # Edit with your API keys
```

## Step 4: Configure PM2

```bash
# Start backend with PM2
cd /home/ubuntu/neuronav
pm2 start server/index.js --name "neuronav-api"

# Save PM2 config
pm2 save

# Enable PM2 startup
pm2 startup
```

## Step 5: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/neuronav
```

Add:
```nginx
upstream neuronav_api {
    server localhost:5000;
}

server {
    listen 80;
    server_name your-domain.com;

    root /home/ubuntu/neuronav/client/build;

    location / {
        try_files $uri /index.html;
    }

    location /api {
        proxy_pass http://neuronav_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/neuronav /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Step 6: Set Up SSL (HTTPS)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Step 7: Monitor Application

```bash
pm2 logs neuronav-api
pm2 status
pm2 monit
```

## Troubleshooting

### MongoDB Connection Issues
```bash
sudo systemctl status mongod
sudo journalctl -u mongod -n 50
```

### Nginx Issues
```bash
sudo systemctl status nginx
sudo nginx -t
```

### Node.js Process Issues
```bash
pm2 logs neuronav-api
pm2 describe neuronav-api
```

## Scaling

For production with high traffic:
- Use MongoDB Atlas instead of local MongoDB
- Deploy multiple Node.js instances behind Nginx load balancer
- Use Amazon CloudFront for CDN
- Set up auto-scaling groups
- Use RDS for managed database (if migrating from MongoDB)

## Monitoring

Set up CloudWatch monitoring:
- CPU usage
- Memory usage
- Disk usage
- Network traffic
- Application logs

## Backup Strategy

```bash
# MongoDB backup
mongodump --out /backups/mongo-$(date +%Y%m%d)

# Store backups to S3
aws s3 sync /backups s3://your-backup-bucket/
```
