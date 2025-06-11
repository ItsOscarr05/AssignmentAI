#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "Running test coverage for AssignmentAI..."

# Run frontend tests
echo -e "\n${GREEN}Running frontend tests...${NC}"
cd frontend
npm run test -- --coverage --watchAll=false

# Check if frontend tests passed
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Frontend tests passed!${NC}"
else
    echo -e "${RED}Frontend tests failed!${NC}"
    exit 1
fi

# Run backend tests
echo -e "\n${GREEN}Running backend tests...${NC}"
cd ../backend
npm run test -- --coverage --watchAll=false

# Check if backend tests passed
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Backend tests passed!${NC}"
else
    echo -e "${RED}Backend tests failed!${NC}"
    exit 1
fi

# Generate combined coverage report
echo -e "\n${GREEN}Generating combined coverage report...${NC}"
cd ..
npx istanbul-combine -d coverage -r lcov -r html frontend/coverage/coverage-final.json backend/coverage/coverage-final.json

# Check coverage thresholds
echo -e "\n${GREEN}Checking coverage thresholds...${NC}"
npx istanbul check-coverage --statements 80 --branches 80 --functions 80 --lines 80

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Coverage thresholds met!${NC}"
else
    echo -e "${RED}Coverage thresholds not met!${NC}"
    exit 1
fi

echo -e "\n${GREEN}Coverage report generated in coverage/ directory${NC}"
echo "Open coverage/lcov-report/index.html to view the detailed report" 