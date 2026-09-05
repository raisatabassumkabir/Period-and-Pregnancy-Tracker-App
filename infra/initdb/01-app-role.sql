-- Application role: LOGIN but NOT superuser and NOT BYPASSRLS, so FORCE row
-- level security actually binds it. CREATEDB is for pytest-django's test
-- database creation — dev convenience only; the production role doesn't get it.
CREATE ROLE femtech WITH LOGIN PASSWORD 'femtech' NOSUPERUSER NOBYPASSRLS CREATEDB;

CREATE DATABASE femtech OWNER femtech;

-- Install pgvector in template1 so every database created from it (including
-- pytest's test_femtech) inherits the extension without superuser rights.
\connect template1
CREATE EXTENSION IF NOT EXISTS vector;

\connect femtech
CREATE EXTENSION IF NOT EXISTS vector;
