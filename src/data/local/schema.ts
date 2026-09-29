import { appSchema, tableSchema } from '@nohost/watermelon';

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'profiles',
      columns: [
        { name: 'display_name', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'entries',
      columns: [
        { name: 'user_id', type: 'string' },
        { name: 'body_ciphertext', type: 'string' },
        { name: 'body_nonce', type: 'string' },
        { name: 'mood_label', type: 'string', isOptional: true },
        { name: 'mood_confidence', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'device_vector_clock', type: 'string' },
      ],
    }),
    tableSchema({
      name: 'habits',
      columns: [
        { name: 'user_id', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'cadence', type: 'string' }, // 'daily' | 'weekly' | 'custom'
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'habit_logs',
      columns: [
        { name: 'habit_id', type: 'string', isIndexed: true },
        { name: 'logged_at', type: 'string' }, // YYYY-MM-DD
      ],
    }),
  ],
});
