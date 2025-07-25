#!/bin/bash

echo "Setting up Clive's Coming Soon page..."

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "pnpm not found. Installing pnpm..."
    npm install -g pnpm
fi

# Install dependencies
echo "Installing dependencies..."
pnpm install

echo "Setup complete! Run 'pnpm dev' to start the development server." 