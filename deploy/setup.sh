#!/bin/bash
# =================================================
# Oracle Cloud Free Tier VM Setup Script
# BookMyShow Seat Hold System
# =================================================

set -e

echo "🚀 Setting up BookMyShow Seat Hold System..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install Chromium for Puppeteer
sudo apt install -y chromium-browser fonts-liberation libappindicator3-1 libasound2 \
  libatk-bridge2.0-0 libatk1.0-0 libcups2 libdbus-1-3 libgdk-pixbuf2.0-0 \
  libnspr4 libnss3 libx11-xcb1 libxcomposite1 libxdamage1 libxrandr2 \
  xdg-utils libgbm1 libpango-1.0-0 libcairo2

# Install certbot for SSL
sudo apt install -y certbot python3-certbot-nginx

# Create app directory
sudo mkdir -p /opt/seathhold
sudo chown $USER:$USER /opt/seathold

echo ""
echo "✅ Dependencies installed!"
echo ""
echo "Next steps:"
echo "1. Clone your repo to /opt/seathold"
echo "2. Copy .env.example to .env and fill in credentials"
echo "3. Run: cd /opt/seathold/server && npm install"
echo "4. Run: cd /opt/seathold/client && npm install && npm run build"
echo "5. Copy nginx.conf to /etc/nginx/sites-available/seathold"
echo "6. Run: sudo ln -s /etc/nginx/sites-available/seathold /etc/nginx/sites-enabled/"
echo "7. Run: sudo nginx -t && sudo systemctl restart nginx"
echo "8. Run: cd /opt/seathold/server && pm2 start ecosystem.config.js"
echo "9. Run: pm2 save && pm2 startup"
echo "10. Setup SSL: sudo certbot --nginx -d your-domain.com"
echo ""
