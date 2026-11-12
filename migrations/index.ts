import * as migration_20261112_084113_initial_cms_schema from './20261112_084113_initial_cms_schema';
import * as migration_20261112_102753_add_invitations_and_project_case_study from './20261112_102753_add_invitations_and_project_case_study';

export const migrations = [
  {
    up: migration_20261112_084113_initial_cms_schema.up,
    down: migration_20261112_084113_initial_cms_schema.down,
    name: '20261112_084113_initial_cms_schema',
  },
  {
    up: migration_20261112_102753_add_invitations_and_project_case_study.up,
    down: migration_20261112_102753_add_invitations_and_project_case_study.down,
    name: '20261112_102753_add_invitations_and_project_case_study'
  },
];
