# What is this directory?
This directory helps request all user-related information from plume database, loading them all into qstack database for account creation purposes

## Files
- `utils.py`: Utilities to migrate/import users from the Plume DB into QStack and to prepare QStack tables.

## Environment variables
Place these in `server/.env` or your environment. `utils.py` loads both the project root and `server/.env`.
- `EC2_DATABASE_HOST`: Plume EC2 Postgres hostname
- `EC2_DATABASE_USER`: Plume EC2 Postgres user
- `EC2_DATABASE_PASSWORD`: Plume EC2 Postgres password
- `EC2_DATABASE_NAME`: Plume EC2 Postgres database name
- `DATABASE_URL` (optional): Local Postgres URL if not running via Docker. Used by the commented local connection snippet in `create_qstack_connection()`.

## What the utilities do
Inside `utils.py`:
- `create_ec2_connection()`: Connects to the Plume (EC2) Postgres instance using the env vars above.
- `create_qstack_connection()`: Connects to the QStack Postgres. By default, targets the Docker service `database` with `qstackdb`/`postgres`/`password`. A local connection alternative using `DATABASE_URL` is provided but commented.
- `init_new_users_table()`: Prepares QStack for the new `users` table and updates `tickets`:
  - Renames existing `users` → `users_old` (if it exists)
  - Drops `tickets` foreign key constraints to `users`
  - TRUNCATES `tickets` and resets IDs (RESTART IDENTITY CASCADE)
  - Creates the new `users` table with appropriate schema and FK back to `tickets`
  - Alters `tickets.creator_id`/`tickets.claimant_id` types to `VARCHAR`
  - Re-adds `tickets` foreign key constraints referencing `users`
- `load_all_users()`: Reads all user IDs from Plume's `user` table and inserts them into QStack `users` with default fields. Skips existing IDs.
- `delete_users_old()`: Drops `users_old` and any leftover sequence.
- `get_info(uids)`: Fetches name/email for given Plume user IDs.

## Running the migration utilities
First, save all hackmit-critical EC2 related credentials in .env to connect to PostgreSQL database hosted in the EC2 container:
- `EC2_DATABASE_HOST`
- `EC2_DATABASE_USER`
- `EC2_DATABASE_PASSWORD`
- `EC2_DATABASE_NAME`

Once you've set up the enviroment variables, you can execute the script directly:

```bash
python server/plume/utils.py
```

By default, the main block runs:
- `init_new_users_table()`
- `delete_users_old()`

If you also want to import all users from Plume, uncomment the `load_all_users()` call in the `__main__` section.

## Important notes and safety
- TRUNCATE on `tickets` permanently deletes all ticket rows and resets IDs. This does not drop the table. Ensure you truly want to clear tickets before running.
- The operations modify schemas and constraints; run only when you intend to migrate.
- If you are not using Docker, switch `create_qstack_connection()` to use the commented `DATABASE_URL` path.

## Troubleshooting
- Connection issues: verify the env vars and network access to EC2 Postgres.
- Permission/role errors: ensure your Postgres user has privileges to ALTER/TRUNCATE/CREATE tables.
- If a migration partially ran, you may need to manually clean up constraints or tables before rerunning.