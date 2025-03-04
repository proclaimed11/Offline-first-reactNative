import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { mySchema } from './schema';
import Client from './models/client';
import { migrations } from './migrations';

const adapter = new SQLiteAdapter({
  schema: mySchema,
  migrations,
  onSetUpError: (error) => console.error('Database setup error:', error),
});

export const database = new Database({
  adapter,
  modelClasses: [Client],
});
