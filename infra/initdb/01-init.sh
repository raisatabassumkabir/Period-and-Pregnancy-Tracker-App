#!/bin/bash
set -e

APP_USER="${APP_DB_USER:-femtech}"
APP_PASS="${APP_DB_PASSWORD:-femtech}"
APP_DB="${POSTGRES_DB:-femtech}"

echo "Configuring PostgreSQL role '$APP_USER' and database '$APP_DB'..."

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$APP_USER') THEN
            CREATE ROLE $APP_USER WITH LOGIN PASSWORD '$APP_PASS' NOSUPERUSER NOBYPASSRLS CREATEDB;
        ELSE
            ALTER ROLE $APP_USER WITH PASSWORD '$APP_PASS';
        END IF;
    END
    \$\$;

    SELECT 'CREATE DATABASE $APP_DB OWNER $APP_USER'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$APP_DB')\gexec

    GRANT ALL PRIVILEGES ON DATABASE $APP_DB TO $APP_USER;
EOSQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "template1" <<-EOSQL
    CREATE EXTENSION IF NOT EXISTS vector;
EOSQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$APP_DB" <<-EOSQL
    CREATE EXTENSION IF NOT EXISTS vector;
    GRANT ALL ON SCHEMA public TO $APP_USER;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $APP_USER;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $APP_USER;
EOSQL

echo "PostgreSQL role and extensions initialized successfully."
