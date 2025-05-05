#!/bin/bash
echo "Starting inventory database field repair..."

# Set working directory to script location
cd "$(dirname "$0")"

# Check current state
echo "Checking current database state..."
node server/scripts/check-inventory-fields.js

# Migrate lastOrdered to lastOrderDate
echo "Migrating lastOrdered field to lastOrderDate..."
node server/scripts/update-inventory-schema.js

# Add missing lastOrderDate fields
echo "Adding missing lastOrderDate fields..."
node server/scripts/add-missing-lastorderdate.js

# Verify results
echo "Verifying results..."
node server/scripts/check-inventory-fields.js

echo "Inventory date field repair complete!"