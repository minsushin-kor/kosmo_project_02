# Backend database deployment

## New production database

1. Create an empty PostgreSQL 17 database and application account.
2. Set `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, and
   `SPRING_PROFILES_ACTIVE=prod`.
3. Keep `FLYWAY_BASELINE_ON_MIGRATE` unset or set it to `false`.
4. Start Spring Boot. Flyway applies `V1__initial_schema.sql` automatically.
5. Hibernate starts with `ddl-auto=validate` and verifies the migrated schema.
6. Create the first user through `/api/auth/signup`; no seed data is required.

## Existing database without Flyway history

The local development database was created by Hibernate and already matches the
V1 schema. Development configuration uses `baseline-on-migrate=true`, so Flyway
creates `flyway_schema_history` at version 1 without rerunning V1 or deleting data.

Before baselining any existing production database:

1. Back it up.
2. Compare every table, column, constraint, and index with V1.
3. Start once with `SPRING_PROFILES_ACTIVE=prod` and
   `FLYWAY_BASELINE_ON_MIGRATE=true`.
4. Confirm that Hibernate validation succeeds and Flyway reports version 1.
5. Remove `FLYWAY_BASELINE_ON_MIGRATE` (or set it back to `false`) for later starts.

Do not baseline an unknown or partially initialized schema: a baseline records
the version but does not repair schema differences. Future changes must be added
as new versioned migrations; never edit an applied migration.
