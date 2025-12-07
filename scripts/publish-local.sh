#!/bin/bash
set -e

VERSION=$(node -p "require('./package.json').version")
TIMESTAMP=$(date +%s)
TEST_VERSION="${VERSION}-test-ci.${TIMESTAMP}"
echo "Publishing version: $TEST_VERSION"

# Build the package first
npm run build

# Setup and login to Verdaccio
npx npm-cli-login -u test -p 1234 -e test@domain.test -r http://localhost:4873

# Create test version of package.json
node -e "
const pkg = require('./package.json');
pkg.version = '$TEST_VERSION';
require('fs').writeFileSync('package.json.test', JSON.stringify(pkg, null, 2));
"
mv package.json package.json.orig
mv package.json.test package.json

# Publish to local Verdaccio (--tag test for prerelease version)
npm publish --registry http://localhost:4873 --tag test

# Restore original package.json
mv package.json.orig package.json

# Install in test-app
cd test-app
npm uninstall "mfe-store" 2>/dev/null || true
npm install "mfe-store@$TEST_VERSION" --registry http://localhost:4873

echo "Done! Package published and installed in test-app"
