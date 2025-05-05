# Database Migration Scripts

These scripts are used to fix database schema issues, particularly around the `lastOrderDate` field in inventory items.

## How to Run These Scripts

Run these scripts in the following order:

### 1. Check Current Database State

This will show the current state of your inventory documents, including which fields exist:

```bash
node server/scripts/check-inventory-fields.js
```

### 2. Migrate from lastOrdered to lastOrderDate

This will copy values from `lastOrdered` field to `lastOrderDate` field for all inventory items that have a `lastOrdered` value:

```bash
node server/scripts/update-inventory-schema.js
```

### 3. Add Missing lastOrderDate Fields

This will add a `lastOrderDate` field with current date to any inventory items that don't have it yet:

```bash
node server/scripts/add-missing-lastorderdate.js
```

### 4. Verify Results

Run the check script again to confirm changes were applied:

```bash
node server/scripts/check-inventory-fields.js
```

## Notes

- These scripts should be run when the application is not actively modifying data
- They work directly with the MongoDB database, bypassing Mongoose
- They use the same database connection configuration as the main application
- Each script includes detailed logging to help troubleshoot any issues

If you encounter any issues, check the error messages in the console output for guidance.