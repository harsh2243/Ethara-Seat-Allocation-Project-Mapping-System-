# Ethara Seat Allocation & Project Mapping System

A MERN stack (MongoDB, Express, React, Node.js) system designed to manage and track workspace seat allocations, project alignments, and occupancy rates for approximately 5,000 employees.

---

## Key Features

1. **Workspace Hub (Dashboard)**:
   - Live summaries of occupied, available, reserved, and maintenance seats.
   - Floor-wise capacity metrics and utilization ratios.
   - Top project occupancy distributions using interactive Recharts charts.
   - Quick-access panel showing **New Joiners Pending Allocation** with one-click placement routing.

2. **Interactive Seating Maps**:
   - Visual desk grid representation for **5 Floors** and **11 Zones** (Zones A to K), grouped by **5 Bays** (Bays 1 to 5).
   - Real-time seat status color-coding (Green: Available, Red: Occupied, Purple: Reserved, Amber: Maintenance).
   - Tooltip summaries displaying occupant name and project details on hover.
   - Smart proximity recomendation algorithms: prioritize seats closest to the team (same floor/zone) and suggest alternatives if full.

3. **Employee Directory**:
   - High-performance paginated tabular directory (vital for 5,000+ items).
   - Multi-field search (name, email, code, department, role).
   - Onboarding and profile editor forms.
   - Automatic seat-releasing on deactivation.

4. **AI Assistant**:
   - Chat helper containing clickable template questions.
   - Smart keyword/regex-based Natural Language query matching:
     - *"Where is employee Amit Patel seated?"* (resolves to Floor 2, Zone B, Bay 4, Seat B4-23, Project Talos).
     - *"Where is my seat? My email is amit@ethara.ai"*
     - *"Who is sitting near Amit Patel?"* (finds neighbors in the same Floor, Zone, and Bay).
     - *"Show all available seats on Floor 3"*
     - *"How many seats are occupied for Project Talos?"*
     - *"Allocate a seat for a new employee joining today."*
   - Built-in Gemini LLM fallback support when a `GEMINI_API_KEY` is provided.

---

## Technology Stack

- **Frontend**: React.js (Vite), Tailwind CSS v3, Recharts, Lucide Icons, Axios.
- **Backend**: Node.js, Express.js, Body-Parser, Cors, Dotenv, Axios.
- **Database**: MongoDB (Local or Atlas) using Mongoose ODM with sparse partial indexes for active bookings.

---

## Installation & Running Locally

### Prerequisites
- Node.js (v18 or higher)
- MongoDB running locally on port 27017 (or a MongoDB Atlas connection string)

### 1. Database Seeding
Navigate to the backend directory, configure database connection settings in `.env` if necessary, and run the seeding script:

```bash
cd backend
npm install
node scripts/seed.js
```

This generates:
- **12 Projects** (including Talos, Indigo, Preed, etc.)
- **5,505 Seats** (Floor 1-5, Zone A-K, Bay 1-5, Seat 1-20/25)
- **4,951 Employees**
  - **4,800 Occupied seats** (allocated to employees).
  - **150 Reserved seats**.
  - **10 Maintenance seats**.
  - **545 Available seats** (ready for booking).
  - **151 Active employees pending allocation** (unbooked new joiners).
  - *Amit Patel placed on Floor 2, Zone B, Bay 4, Seat B4-23 assigned to Project Talos.*

### 2. Run Backend API Server
Start the Express server on port 5000:
```bash
npm start
# or for development:
node server.js
```
The server will output: `Server running on port 5000`.

### 3. Run Frontend Dev Client
Navigate to the frontend directory, install dependencies, and run Vite:
```bash
cd ../frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## Verification & Business Rules Tests

We have written an automated testing suite that validates the database schemas, seat allocation integrity, duplicate booking blockages, and AI Assistant response formats.

Run the test suite from the backend directory:
```bash
cd backend
node test-apis.js
```
The script will output success checks for:
- [x] Project, seat, and employee creation.
- [x] Double booking prevention (database-level unique filters).
- [x] Seat de-allocation and auto-release.
- [x] Exact compliance of AI responses for Amit Patel's coordinates.

---

## API Endpoints List

### Employee APIs
- `POST /api/employees` - Create employee profile.
- `GET /api/employees` - Paginated, filterable employee list.
- `GET /api/employees/:id` - Fetch single employee.
- `PUT /api/employees/:id` - Update profile.
- `DELETE /api/employees/:id` - Deactivate employee (cascades seat release).

### Project APIs
- `POST /api/projects` - Create project.
- `GET /api/projects` - List all projects.
- `GET /api/projects/:id/employees` - List project employees.

### Seat APIs
- `POST /api/seats` - Create seat.
- `GET /api/seats` - Fetch seats (supports floor/zone filters).
- `GET /api/seats/available` - Proximity seating suggestion helper.
- `POST /api/seats/allocate` - Allocate seat to employee.
- `POST /api/seats/release` - Release seat allocation.

### Dashboard APIs
- `GET /api/dashboard/summary` - Aggregate metrics.
- `GET /api/dashboard/project-utilization` - Utilization by project.
- `GET /api/dashboard/floor-utilization` - Capacity rates by floor.

### AI Assistant API
- `POST /api/ai/query` - Request `{ "query": "..." }`, Response `{ "answer": "..." }`.
