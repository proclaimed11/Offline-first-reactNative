import { schemaMigrations, createTable, unsafeExecuteSql } from '@nozbe/watermelondb/Schema/migrations';

export const migrations = schemaMigrations({
  migrations: [
    {
      toVersion: 3, // Increment version
      steps: [
        // Drop the existing table
        //unsafeExecuteSql('DROP TABLE IF EXISTS clients'),
        // Recreate the table
        createTable({
          name: 'clients',
          columns: [
            { name: 'name', type: 'string' },
            { name: 'email', type: 'string' },
            { name: 'job', type: 'string' },
            { name: 'rate', type: 'string' },
            { name: 'is_active', type: 'boolean', isOptional: true },
            { name: 'custom_sync_status', type: 'string' },
            { name: 'version', type: 'number' },
            { name: 'updated_at', type: 'number' },
            { name: 'created_at', type: 'number' },
            { name: 'deleted_at', type: 'number', isOptional: true },
          ],
        }),
      ],
    },
  ],
});

