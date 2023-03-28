#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username $POSTGRES_USER --dbname $POSTGRES_DB <<-EOSQL
        CREATE USER $PONG_DB_USER WITH PASSWORD '$PONG_DB_PASSWORD';
        ALTER DEFAULT PRIVILEGES
                FOR USER $POSTGRES_USER
                IN SCHEMA public
                GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO $PONG_DB_USER;
EOSQL
