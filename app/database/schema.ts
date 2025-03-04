import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const mySchema = appSchema({
  version: 3,
  tables: [
    tableSchema({
      name: 'clients',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'email', type: 'string' },
        { name: 'job', type: 'string' },
        { name: 'rate', type: 'string' },
        { name: 'is_active', type: 'boolean', isOptional: true },
        { name: 'custom_sync_status', type: 'string' },  // Changed from sync_status
        { name: 'version', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'deleted_at', type: 'number', isOptional: true }
      ],
    }),
  ],
});

