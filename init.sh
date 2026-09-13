#!/bin/bash

#######################################
# Pockety Development Environment Setup
# Personal Finance Manager
#######################################

set -e  # Exit on error

echo "================================================"
echo "  Pockety Development Environment Setup"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
echo -e "${BLUE}Checking Docker...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${YELLOW}Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker is running${NC}"
echo ""

# Check if web_app container exists and is running
echo -e "${BLUE}Checking for web_app container...${NC}"
if ! docker ps | grep -q web_app; then
    echo -e "${YELLOW}Warning: web_app container is not running.${NC}"
    echo "Please ensure your Docker stack is running before proceeding."
    echo "Refer to your docker-compose.yml or docker stack documentation."
    echo ""
    read -p "Do you want to continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✓ web_app container is running${NC}"
fi
echo ""

# Check /etc/hosts for dev.pockety.com
echo -e "${BLUE}Checking /etc/hosts configuration...${NC}"
if ! grep -q "dev.pockety.com" /etc/hosts 2>/dev/null; then
    echo -e "${YELLOW}Warning: dev.pockety.com not found in /etc/hosts${NC}"
    echo "Please add the following line to /etc/hosts:"
    echo "  127.0.0.1  dev.pockety.com"
    echo ""
    echo "You can do this by running:"
    echo "  sudo sh -c 'echo \"127.0.0.1  dev.pockety.com\" >> /etc/hosts'"
    echo ""
else
    echo -e "${GREEN}✓ /etc/hosts configured for dev.pockety.com${NC}"
fi
echo ""

# Install Composer dependencies
echo -e "${BLUE}Installing Composer dependencies...${NC}"
if docker ps | grep -q web_app; then
    docker exec -u appuser web_app bash -lc "cd /var/www/vhosts && composer install --no-interaction --prefer-dist"
    echo -e "${GREEN}✓ Composer dependencies installed${NC}"
else
    echo -e "${YELLOW}Skipping composer install (container not running)${NC}"
fi
echo ""

# Install NPM dependencies
echo -e "${BLUE}Installing NPM dependencies...${NC}"
if docker ps | grep -q web_app; then
    docker exec -u appuser web_app bash -lc "cd /var/www/vhosts && npm install"
    echo -e "${GREEN}✓ NPM dependencies installed${NC}"
else
    echo -e "${YELLOW}Skipping npm install (container not running)${NC}"
fi
echo ""

# Setup .env file if not exists
echo -e "${BLUE}Checking .env file...${NC}"
if [ ! -f .env ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo -e "${GREEN}✓ .env file created${NC}"
    echo -e "${YELLOW}  Please review .env and update database credentials if needed${NC}"
else
    echo -e "${GREEN}✓ .env file exists${NC}"
fi
echo ""

# Generate application key if not set
echo -e "${BLUE}Checking Laravel application key...${NC}"
if ! grep -q "APP_KEY=base64:" .env 2>/dev/null; then
    echo "Generating Laravel application key..."
    if docker ps | grep -q web_app; then
        docker exec -u appuser web_app bash -lc "cd /var/www/vhosts && php artisan key:generate"
        echo -e "${GREEN}✓ Application key generated${NC}"
    else
        echo -e "${YELLOW}Skipping key generation (container not running)${NC}"
    fi
else
    echo -e "${GREEN}✓ Application key is set${NC}"
fi
echo ""

# Run database migrations
echo -e "${BLUE}Running database migrations...${NC}"
if docker ps | grep -q web_app; then
    docker exec -u appuser web_app bash -lc "cd /var/www/vhosts && php artisan migrate --force"
    echo -e "${GREEN}✓ Database migrations complete${NC}"
else
    echo -e "${YELLOW}Skipping migrations (container not running)${NC}"
fi
echo ""

# Build frontend assets
echo -e "${BLUE}Building frontend assets...${NC}"
echo "This may take a few minutes on first run..."
if docker ps | grep -q web_app; then
    docker exec -u appuser web_app bash -lc "cd /var/www/vhosts && npm run build"
    echo -e "${GREEN}✓ Frontend assets built${NC}"
else
    echo -e "${YELLOW}Skipping build (container not running)${NC}"
fi
echo ""

# Summary
echo "================================================"
echo -e "${GREEN}  Setup Complete!${NC}"
echo "================================================"
echo ""
echo "Application Information:"
echo "  Name:        Pockety - Personal Finance Manager"
echo "  Local URL:   http://dev.pockety.com:8080/"
echo "  Container:   web_app"
echo ""
echo "Common Commands:"
echo "  Shell in container:     task shell"
echo "  Run tests:              task tests"
echo "  Start dev server:       task dev"
echo ""
echo "Development Server:"
echo "  To start the Vite development server with hot reload:"
echo "    task dev"
echo "  Then access: http://dev.pockety.com:8080/"
echo ""
echo "Next Steps:"
echo "  1. Review and update .env file if needed"
echo "  2. Run 'task dev' to start the development server"
echo "  3. Open http://dev.pockety.com:8080/ in your browser"
echo "  4. Review feature_list.json for implementation roadmap"
echo ""
echo -e "${GREEN}Happy coding!${NC}"
echo ""
