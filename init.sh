#!/bin/bash

#######################################
# Pockety Development Environment Setup
# Personal Finance Manager
#
# Stack: Laravel (PHP) + React + TypeScript + Inertia (Vite)
# Local stack: pleets/devbox-station (Docker container `web_app`)
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
RED='\033[0;31m'
NC='\033[0m' # No Color

# Container used by the devbox-station stack (see Taskfile.yml / AGENTS.md)
CONTAINER="web_app"
WORKDIR="/var/www/vhosts"

run_in_container() {
    docker exec -u appuser -w "$WORKDIR" "$CONTAINER" bash -lc "$1"
}

container_running() {
    docker ps --format '{{.Names}}' 2>/dev/null | grep -qx "$CONTAINER"
}

# ---------------------------------------------------------------------------
# 1. Check the Docker environment
# ---------------------------------------------------------------------------
echo -e "${BLUE}Checking Docker...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Docker is not running.${NC}"
    echo "Start Docker and the devbox-station stack, then re-run ./init.sh"
    echo "Stack docs: https://github.com/pleets/devbox-station#readme"
    exit 1
fi
echo -e "${GREEN}✓ Docker is running${NC}"
echo ""

echo -e "${BLUE}Checking for the ${CONTAINER} container...${NC}"
if container_running; then
    echo -e "${GREEN}✓ ${CONTAINER} container is running${NC}"
    HAVE_CONTAINER=1
else
    echo -e "${YELLOW}Warning: ${CONTAINER} container is not running.${NC}"
    echo "Start the devbox-station stack before running install/build steps."
    read -p "Continue with checks only? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
    HAVE_CONTAINER=0
fi
echo ""

# ---------------------------------------------------------------------------
# 2. Host name check
# ---------------------------------------------------------------------------
echo -e "${BLUE}Checking /etc/hosts for dev.pockety.com...${NC}"
if ! grep -q "dev.pockety.com" /etc/hosts 2>/dev/null; then
    echo -e "${YELLOW}Warning: dev.pockety.com not found in /etc/hosts${NC}"
    echo "Add this line to /etc/hosts:"
    echo "  127.0.0.1  dev.pockety.com"
    echo "With: sudo sh -c 'echo \"127.0.0.1  dev.pockety.com\" >> /etc/hosts'"
else
    echo -e "${GREEN}✓ /etc/hosts configured for dev.pockety.com${NC}"
fi
echo ""

if [[ "$HAVE_CONTAINER" -eq 1 ]]; then
    # -----------------------------------------------------------------------
    # 3. PHP dependencies
    # -----------------------------------------------------------------------
    echo -e "${BLUE}Installing Composer dependencies...${NC}"
    run_in_container "composer install --no-interaction --prefer-dist"
    echo -e "${GREEN}✓ Composer dependencies installed${NC}"
    echo ""

    # -----------------------------------------------------------------------
    # 4. Node dependencies
    # -----------------------------------------------------------------------
    echo -e "${BLUE}Installing NPM dependencies...${NC}"
    run_in_container "npm install"
    echo -e "${GREEN}✓ NPM dependencies installed${NC}"
    echo ""

    # -----------------------------------------------------------------------
    # 5. Application .env / key
    # -----------------------------------------------------------------------
    echo -e "${BLUE}Checking .env file...${NC}"
    if [ ! -f .env ]; then
        echo "Creating .env from .env.example..."
        cp .env.example .env
        echo -e "${GREEN}✓ .env file created${NC}"
        echo -e "${YELLOW}  Review .env and update database credentials if needed${NC}"
    else
        echo -e "${GREEN}✓ .env file exists${NC}"
    fi
    echo ""

    echo -e "${BLUE}Checking Laravel application key...${NC}"
    if ! grep -q "^APP_KEY=base64:" .env 2>/dev/null; then
        run_in_container "php artisan key:generate"
        echo -e "${GREEN}✓ Application key generated${NC}"
    else
        echo -e "${GREEN}✓ Application key is set${NC}"
    fi
    echo ""

    # -----------------------------------------------------------------------
    # 6. Database
    # -----------------------------------------------------------------------
    echo -e "${BLUE}Running database migrations...${NC}"
    run_in_container "php artisan migrate --force"
    echo -e "${GREEN}✓ Database migrations complete${NC}"
    echo ""

    # -----------------------------------------------------------------------
    # 7. Frontend assets
    # -----------------------------------------------------------------------
    echo -e "${BLUE}Building frontend assets...${NC}"
    echo "This may take a few minutes on first run..."
    run_in_container "npm run build"
    echo -e "${GREEN}✓ Frontend assets built${NC}"
    echo ""
fi

# ---------------------------------------------------------------------------
# 8. Optional integration: Open Exchange Rates (spec section 8)
# ---------------------------------------------------------------------------
echo -e "${BLUE}Checking exchange-rate configuration...${NC}"
if [ -f .env ] && grep -q "^OPENEXCHANGERATES_APP_ID=..*" .env 2>/dev/null; then
    echo -e "${GREEN}✓ OPENEXCHANGERATES_APP_ID is set${NC}"
else
    echo -e "${YELLOW}OPENEXCHANGERATES_APP_ID is not set.${NC}"
    echo "The exchange-rates:fetch command logs a warning and exits without writing a row."
    echo "Add a free app id from https://openexchangerates.org/ to .env to enable daily fetches."
fi
echo ""

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo "================================================"
echo -e "${GREEN}  Setup Complete!${NC}"
echo "================================================"
echo ""
echo "Application Information:"
echo "  Name:        Pockety - Personal Finance Manager"
echo "  Local URL:   http://dev.pockety.com:8080/"
echo "  Container:   ${CONTAINER} (source mount ${WORKDIR})"
echo ""
echo "Common Commands (host, via Taskfile.yml):"
echo "  Shell in container:      task shell"
echo "  Root shell:              task shell-root"
echo "  Run backend + frontend:  task tests"
echo "  Run backend tests:       task backend-tests"
echo "  Run frontend unit tests: task frontend-tests"
echo "  Seed browser test data:  task browser-test-seed"
echo "  Install Playwright:      task browser-test-install"
echo "  Run browser tests:       task browser-tests"
echo "  Start Vite dev server:   task dev"
echo "  Build assets:            task build"
echo ""
echo "Exchange rates:"
echo "  Daily fetch (local):     php artisan exchange-rates:fetch"
echo "  Production scheduler:    php artisan schedule:run (add to cron)"
echo ""
echo "Documentation (once docs/ exists):"
echo "  Serve docsify guides:    npx --yes docsify-cli serve docs"
echo ""
echo "Next Steps:"
echo "  1. Review .env if needed"
echo "  2. Run 'task dev' and open http://dev.pockety.com:8080/"
echo "  3. Work through feature_list.json one feature at a time"
echo "     (features may only be flipped to \"passes\": true, never edited or removed)"
echo ""
echo -e "${GREEN}Happy coding!${NC}"
echo ""
