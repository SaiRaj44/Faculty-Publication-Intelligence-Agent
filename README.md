# Faculty Publication Intelligence Agent

AI-powered publication tracking and analytics for universities.

## Getting Started

### Method 1: The "Full-Fledged" Docker Approach (Recommended)
This method spins up the Next.js App, the PostgreSQL database, and the Redis BullMQ server seamlessly. It also automatically seeds the database with the IIT Tirupati default logins.

**Step 1:** Ensure Docker and Docker Compose are installed on your machine.
**Step 2:** Clone this repository and navigate to the project directory.
**Step 3:** Create your `.env` file (Docker will use these values):
```bash
cp .env.example .env
```
**Step 4:** Launch the entire stack in detached mode:
```bash
docker compose up -d --build
```
*Note: The `db-init` container will automatically run the database migrations and seed the users for you before the `web` container boots up.*

**Step 5:** Open `http://localhost:3000` in your browser.

---

### Method 2: Local Development (Node.js)

**Step 1:** Ensure you have Node.js 20+ and a running PostgreSQL database. 
You can start a local PostgreSQL database using Docker:
```bash
docker run --name faculty-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=faculty_db -p 5432:5432 -d postgres:15-alpine
```

**Step 2:** Copy the environment variables:
```bash
cp .env.example .env
```
Ensure the `DATABASE_URL` matches your running PostgreSQL instance. 

**Step 3:** Push the schema to the database (Creates tables):
```bash
npx prisma db push
```

**Step 4:** Seed the database with the IIT Tirupati default users:
```bash
npm run db:seed
```

**Step 5:** Start the Next.js 16 (Turbopack) development server:
```bash
npm run dev
```

**Step 6 (Optional):** Start the background BullMQ workers in a separate terminal:
```bash
npm run workers
```

Open `http://localhost:3000` in your browser.

## Tech Stack
- Next.js 16 (App Router)
- React 19
- Tailwind CSS v4 & PostCSS
- Prisma 7 (with `@prisma/adapter-pg`)
- Google Gemini AI Integration
- NextAuth.js
