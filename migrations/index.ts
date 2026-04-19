import * as migration_20260419_075000_support_chat_columns from './20260419_075000_support_chat_columns';

export const migrations = [
  {
    up: migration_20260419_075000_support_chat_columns.up,
    down: migration_20260419_075000_support_chat_columns.down,
    name: '20260419_075000_support_chat_columns'
  },
];
