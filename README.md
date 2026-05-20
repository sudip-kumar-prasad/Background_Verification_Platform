# VerifyFlow: Background Verification Platform

VerifyFlow is a secure, scalable, and responsive **Background Verification Platform** built to allow organizations and recruiters to register candidates, run automated credential checks (Aadhaar & PAN card verifications), inspect audit logs from third-party registries, and compile professional verification reports as PDFs.

---

## Key Features

1. **Recruiter Authentication**: Secure login and sign-up using JWT tokens, bcrypt password hashing, and endpoint auth middleware protection.
2. **Candidate Management**: Full CRUD interface supporting candidate profile creation, editing, status tracking, global search, status filtering, and pagination.
3. **Automated Verification**: Integrates a two-step verification workflow invoking external/mock identity registries:
   * **Aadhaar Verification**: Checks 12-digit numeric constraint, matches demographic data, and returns verified status.
   * **PAN Verification**: Checks `ABCDE1234F` regex format constraints, verifies active status, and logs response logs.
4. **API Registry Logs**: View raw JSON request and response payloads from mock verification services directly inside the Candidate dashboard timeline.
5. **Professional PDF Reports**: Dynamically compiles and generates professional candidate screening summaries using `pdfkit` (containing profile metadata, audit results, security seal, and signature fields).
6. **Harmonious Modern UI**: Premium glassmorphic design system using Tailwind CSS, responsive Sidebar and Navbar navigation shell, state indicators, and layout transitions.

---

## Tech Stack

### Frontend
* **Core**: Next.js 15 (App Router, TypeScript)
* **Styling**: Tailwind CSS (v4)
* **Icons**: Lucide React
* **State Management**: Zustand
* **Form & Validation**: React Hook Form + Zod

### Backend
* **Server**: Node.js + Express.js + TypeScript
* **Database & ORM**: PostgreSQL (via Docker) + Prisma ORM
* **Authentication**: JSON Web Tokens (JWT) + bcryptjs
* **PDF Engine**: PDFKit

---

## Project Structure

```text
Background_Verification_Platform/
├── backend/
│   ├── prisma/             # Schema definitions and DB migrations
│   ├── src/
│   │   ├── config/         # Prisma DB Client instance
│   │   ├── controllers/    # Route controllers (auth, candidate, verification, report)
│   │   ├── middleware/     # JWT authentication filter
│   │   ├── routes/         # Express endpoint routing
│   │   ├── services/       # Verification calls & PDF report rendering logic
│   │   └── app.ts          # Server entry point
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/            # Next.js App Router (Layouts, Login, Dashboard, Candidates)
│   │   ├── services/       # Axios API client helper
│   │   └── store/          # Zustand authentication store
│   ├── .env.local
│   └── package.json
│
├── docker-compose.yml      # Local PostgreSQL container configuration
└── README.md
```

---

## Installation & Setup Instructions

### Prerequisites
* **Node.js** (v18+)
* **Docker** & **Docker Compose**
* **Git**

### Step 1: Clone and Set Up the Database
Start the PostgreSQL container locally using Docker:
```bash
docker compose up -d
```

### Step 2: Configure and Start Backend API
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create your `.env` file from the template:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run Prisma DB Migrations (this initializes the tables in PostgreSQL and generates the client):
   ```bash
   npx prisma migrate dev
   ```
5. Start the development server (runs on port `5001` to avoid macOS AirPlay conflict):
   ```bash
   npm run dev
   ```

### Step 3: Configure and Start Frontend UI
1. Navigate to the frontend folder (in a new terminal):
   ```bash
   cd frontend
   ```
2. Configure environmental settings:
   Create a `.env.local` file containing:
   ```text
   NEXT_PUBLIC_API_URL=http://localhost:5001/api
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the Next.js development server:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to `http://localhost:3000`.

---

## REST API Summary

### Authentication
* `POST /api/auth/register` - Create recruiter account.
* `POST /api/auth/login` - Authenticate & retrieve JWT token.

### Candidate Directory
* `POST /api/candidates` - Add new candidate profile *(Authenticated)*.
* `GET /api/candidates` - Search, filter, and paginate candidate records *(Authenticated)*.
* `GET /api/candidates/:id` - Fetch candidate records & audit timeline logs *(Authenticated)*.
* `PUT /api/candidates/:id` - Update candidate details *(Authenticated)*.
* `DELETE /api/candidates/:id` - Remove candidate profile *(Authenticated)*.

### Verification Engine
* `POST /api/verifications/:id/start` - Trigger Aadhaar & PAN verification workflow *(Authenticated)*.
* `GET /api/reports/:id` - Generate and download PDF verification report *(Authenticated)*.

### Mock Verification Services (External APIs)
* `POST /api/mock/aadhaar/verify` - Simulates Government Identity database checks.
* `POST /api/mock/pan/verify` - Simulates Tax Registry PAN checks.

#### Mock API Failure Simulation:
To test failure outcomes:
* Submit a candidate with an **Aadhaar ending in `0000`** -> Triggers Aadhaar match fail.
* Submit a candidate with a **PAN ending in `Z`** -> Triggers PAN active check fail.
* Both conditions met -> Triggers overall `FAILED` verification status.
* Single condition met -> Triggers overall `PARTIAL` verification status.
