# OpenBizz - Udyam MSME Registration Portal Replica (Steps 1 & 2)

A production-ready full-stack replication of the first two steps of the official Indian Government's **Udyam Registration Portal**. This project features a clean modular architecture, dynamic schema-driven form rendering, robust validation logic, a mock SMS/PAN verification interface, and database integration with PostgreSQL + Prisma ORM.

---

## 🚀 Key Features

1. **High-Fidelity UI/UX**: Recreates the first two steps exactly as per government requirements, with a modern dark mode, responsive mobile-first layouts, glassmorphic card designs, and micro-interactions (framer-motion and canvas-confetti).
2. **Schema-Driven Form Rendering**: Forms are dynamically generated from `/scraped/schema.json` allowing for easy extension and change of fields, validations, placeholders, and options.
3. **Robust Input Validation (Zod + React Hook Form)**:
   - **Aadhaar**: Exactly 12 numeric digits.
   - **PAN**: Validated against standard regex `[A-Z]{5}[0-9]{4}[A-Z]{1}` and crosschecked for duplicate registrations.
   - **OTP**: Exactly 6 numeric digits with active resend countdown timer.
4. **Mock API Verification Workflows**:
   - `POST /api/otp/send`: Simulates SMS gateway output (logs OTP code to server console and includes it in response during local testing).
   - `POST /api/otp/verify`: Validates OTP against stored session details.
   - `POST /api/pan/validate`: Simulates check against Income Tax database (with mock error states, e.g. PANs starting with `'Z'` will simulate validation failure).
5. **Postal PIN Code Lookup**: Entering a 6-digit Indian PIN Code automatically triggers the Indian Post Office directory API to dynamically resolve and populate the **District** and **State** fields.
6. **Robust Offline-First Database Persistence**: Wires up PostgreSQL through Prisma Client (using Prisma 7's TS driver adapter). If PostgreSQL is offline, the backend gracefully falls back to persistent in-memory caching and displays a status notification.
7. **Client-Side Form Persistence**: Progress and input details are preserved in browser localStorage, allowing users to refresh without losing their inputs.

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide React, Framer Motion, Canvas Confetti.
- **Form Management**: React Hook Form, `@hookform/resolvers`, Zod.
- **Backend APIs**: Next.js Route Handlers.
- **Database & ORM**: PostgreSQL, Prisma ORM (v7.8+).
- **Testing**: Jest, `@testing-library/react`, Jest-DOM, Ts-Jest.
- **Infrastructure**: Docker, Docker Compose.

---

## 📁 Project Directory Structure

```
├── app/                  # Next.js App Router (pages and APIs)
│   ├── api/              # API Route Handlers (OTP, PAN, and Submit)
│   ├── layout.tsx        # Base shell layout (includes Navbar & Footer)
│   ├── page.tsx          # Main wizard entry coordinator
│   └── globals.css       # Core styling & custom HSL design tokens
├── components/           # Reusable form, nav, and card components
├── hooks/                # Custom React hooks (localStorage persistence)
├── lib/                  # Shared utility code (Prisma 7 driver configuration)
├── prisma/               # Database schemas, migrations config
├── scraped/              # Form schemas representing official step structures
├── services/             # Mock DB cache store services
├── tests/                # Jest validation and API integration tests
├── Dockerfile            # Multi-stage production build configuration
├── docker-compose.yml    # Wires up PostgreSQL and Next.js web services
└── prisma.config.ts      # Prisma 7 Database connection configuration
```

---

## ⚙️ Setup & Installation

### 1. Prerequisites
Ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/en) (v18.x or later recommended)
- [NPM](https://www.npmjs.com/)
- [Docker](https://www.docker.com/) (Optional - to run database containers)

### 2. Clone and Install Dependencies
Navigate into the workspace and run:
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory (one is created automatically with defaults):
```env
DATABASE_URL="postgresql://udyam_user:udyam_password@localhost:5432/udyam_db?schema=public"
```

---

## 🏃 Running Locally

### Step A: Starting Database (Docker)
If you have Docker installed, start the PostgreSQL container:
```bash
docker compose up -d postgres
```
Apply migrations to sync the database schema:
```bash
npx prisma db push
```

*Note: If you do not have Docker or PostgreSQL running, the application will automatically fall back to an in-memory/JSON store so you can still fully test and interact with the UI.*

### Step B: Starting Dev Server
Run the local Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Running Tests

Unit and integration tests are powered by Jest. The test suite checks format constraints and simulated route parameters.

To execute tests:
```bash
npm run test
```

---

## 🐳 Docker Deployment

To launch the entire stack (PostgreSQL and standalone Next.js container) in production mode:

1. **Build and Start Container Services**:
   ```bash
   docker compose up --build -d
   ```
2. **Access Application**:
   Open [http://localhost:3000](http://localhost:3000).
3. **Stop Services**:
   ```bash
   docker compose down -v
   ```

---

## 🔧 Mock Verification Details

For testing validation logic:
1. **SMS Gateway Simulation**: When you submit Aadhaar, the mock code generates a random 6-digit OTP code, prints it in the Node server console, and displays a green notification box on the screen containing the code for easy testing.
2. **PAN Verification Simulation**:
   - Standard validation requires format `[A-Z]{5}[0-9]{4}[A-Z]{1}`.
   - Enter a PAN starting with **'Z'** (e.g. `ZBCDE1234F`) to test the API validation failure response (simulates tax database mismatch).
   - Validation will block you if you attempt to submit a PAN that was already registered (duplicates check).
3. **PIN Auto-fill**: Enter **`110001`** (New Delhi) or **`400001`** (Mumbai) to see District and State autofill instantly using the public PostPin directory API.
