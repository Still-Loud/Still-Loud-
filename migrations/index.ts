import * as migration_20261112_084113_initial_cms_schema from './20261112_084113_initial_cms_schema';

export const migrations = [
  {
    up: migration_20261112_084113_initial_cms_schema.up,
    down: migration_20261112_084113_initial_cms_schema.down,
    name: '20261112_084113_initial_cms_schema'
  },
];
