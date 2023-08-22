#!/bin/bash

echo "Installing packages..."
mkdir -p node_modules
npm i

npm run build
echo "Executing: $@"
exec $@
