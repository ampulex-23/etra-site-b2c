import * as migration_20260419_075000_support_chat_columns from './20260419_075000_support_chat_columns';
import * as migration_20260423_140000_orders_rels from './20260423_140000_orders_rels';

export const migrations = [
  {
    up: migration_20260419_075000_support_chat_columns.up,
    down: migration_20260419_075000_support_chat_columns.down,
    name: '20260419_075000_support_chat_columns'
  },
  {
    up: migration_20260423_140000_orders_rels.up,
    down: migration_20260423_140000_orders_rels.down,
    name: '20260423_140000_orders_rels'
  },
];
