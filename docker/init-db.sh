#!/bin/sh
# init-db.sh
# This script ensures the database schema is pushed and seeded when the docker container starts

echo "Waiting for PostgreSQL to be ready..."
# The container will keep trying to connect until Postgres is up
while ! nc -z db 5432; do
  sleep 1
done
echo "PostgreSQL is ready!"

echo "Running Prisma DB Push..."
npx prisma db push --accept-data-loss

echo "Running Database Seeding..."
npx prisma db seed

echo "Database initialization complete."
