#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}CarbonPay Reset & Seed${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Step 1: Reset database
echo -e "${YELLOW}[1/2] Resetting database...${NC}"
docker exec -i carbonpay-postgres psql -U carbonpay -d carbonpay < "$SCRIPT_DIR/reset-db.sql"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Database reset complete${NC}"
else
  echo -e "${RED}✗ Database reset failed${NC}"
  exit 1
fi

echo ""

# Step 2: Seed database
echo -e "${YELLOW}[2/2] Seeding database...${NC}"
bash "$SCRIPT_DIR/seed.sh"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}========================================${NC}"
  echo -e "${GREEN}Reset and seed complete!${NC}"
  echo -e "${GREEN}========================================${NC}"
else
  echo -e "${RED}✗ Seeding failed${NC}"
  exit 1
fi
