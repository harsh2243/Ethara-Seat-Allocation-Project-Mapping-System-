# Ethara Space - Seat Allocation & Project Mapping System

Ethara Space is a premium, full-stack MERN application designed to manage workspaces, seat allocations, and project alignments for approximately 5,000 employees. The system implements interactive floor grid layouts, team proximity seat recommendations, conversational NLP assistants, and role-based access control (RBAC).

---

## 🚀 Live Deployments

- **Frontend (Vercel)**: [https://ethara-seat-allocation-project-mapp-five.vercel.app/](https://ethara-seat-allocation-project-mapp-five.vercel.app/)
- **Backend API (Render)**: [https://ethara-backend-816a.onrender.com/health](https://ethara-backend-816a.onrender.com/health)

---

## 🔑 Sandbox Logins

The application features role-based layouts. You can log in using the one-click sandbox buttons on the login card, or enter credentials manually:

| Role | Email | Password | Panel Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@ethara.ai` | `admin123` | Full dashboard access, allocate/release seats, modify seat coordinate assets (`Available` / `Reserved` / `Maintenance`). |
| **HR Manager** | `hr@ethara.ai` | `hr123` | Employee CRUD, seat allocations/releases, deactivations, view pending joiners list. |
| **Employee** | `amit@ethara.ai` | `amit123` | Read-only directories, interactive seat maps (occupied tooltips), neighbors lookup, conversational AI queries. |
| **Generic Staff** | *Any other staff email* | `ethara123` | Standard employee dashboard privileges. |

---

## 🛠️ Technology Stack

### Backend (Node.js & Express)
- **Database**: MongoDB Atlas (document relationships, index-level uniqueness for active allocations).
- **Authentication**: JWT token validation with role authorization guards.
- **Security**: Cryptographic password hashing using `bcryptjs`.
- **NLP Engine**: Google Gemini API integration (conversational prompts) with a local regex-based keyword parser fallback.

### Frontend (React & Tailwind CSS v4)
- **Build System**: Vite 6 (ultra-fast compilation with zero HMR delays).
- **Styling**: Tailwind CSS v4 (CSS-first architecture using the `@tailwindcss/vite` compiler).
- **Icons**: Lucide React.
- **Data Visualizations**: Recharts (responsive radial gauges, capacity charts, and team distributions).

---

## 🗂️ Project Directory Structure

```
ethara-seat-mapping-system/
├── backend/
│   ├── config/
│   │   └── db.js (MongoDB Database connection)
│   ├── controllers/
│   │   ├── aiController.js (NLP & Gemini Controller)
│   │   ├── authController.js (JWT authentication & login mechanics)
│   │   ├── dashboardController.js (MongoDB aggregation pipelines)
│   │   ├── employeeController.js (Paginated CRUD Actions)
│   │   ├── projectController.js (Project listings & Manager mappings)
│   │   └── seatController.js (Proximity recommendations & bookings)
│   ├── middleware/
│   │   └── auth.js (Access verification and RBAC middleware)
│   ├── models/
│   │   ├── Employee.js (Pre-save hashing hooks)
│   │   ├── Project.js (Active/inactive projects)
│   │   ├── Seat.js (Coordinates map)
│   │   └── SeatAllocation.js (Conditional unique indexes)
│   ├── routes/ (Express router mappings)
│   ├── scripts/
│   │   └── seed.js (Auth data seeder)
│   ├── server.js (Express server entry point)
│   └── test-apis.js (Automated RBAC test suite)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AIAssistant.jsx (AI conversational interface)
│   │   │   ├── Dashboard.jsx (Workspace Hub statistics & charts)
│   │   │   ├── EmployeeList.jsx (Personnel Directory CRUD)
│   │   │   ├── SeatMap.jsx (Interactive layouts & Admin togglers)
│   │   │   └── Login.jsx (Auth credentials pre-filler portal)
│   │   ├── App.jsx (Nav frame and logout handlers)
│   │   ├── api.js (Axios API connection client with request interceptors)
│   │   ├── index.css (Tailwind CSS v4 CSS variables config)
│   │   └── .env.production (Vercel API URL route binding)
│   └── vite.config.js (Vite 6 and Tailwind v4 compilation pipeline)
├── render.yaml (Backend Node.js service blueprint configuration)
└── README.md (This file)
```

---

## 💡 Key Design & Implementation Features

### 1. Smart Proximity Seat Recommendation
When allocating a seat for a new hire, the system running at `backend/controllers/seatController.js` executes a proximity search:
- Fetches coordinates of all active seats currently occupied by members of the same project.
- Ranks available seats in three tiers:
  - **Tier 1**: Same floor AND same zone as the project team.
  - **Tier 2**: Same floor, different zones.
  - **Tier 3**: Other floors.
- Groups recommendations by proximity score to ensure new hires are placed immediately next to their teammates.

### 2. Double-Booking Prevention (Sparse Unique Indexes)
To ensure database integrity and block race conditions, `backend/models/SeatAllocation.js` defines partial unique indices filter criteria:
```javascript
// Ensure an employee can only have one active seat
seatAllocationSchema.index(
  { employee_id: 1 },
  { unique: true, partialFilterExpression: { allocation_status: 'Active' } }
);

// Ensure a seat can only have one active employee
seatAllocationSchema.index(
  { seat_id: 1 },
  { unique: true, partialFilterExpression: { allocation_status: 'Active' } }
);
```
This ensures that double bookings are rejected at the database tier, while still allowing infinite historical logs of past releases.

### 3. Conversational AI Assistant (Gemini & Local NLP)
The chat interface allows users to naturally ask for seat and project mappings:
- *“Where is my teammate Amit Patel sitting?”*
- *“Which project is Amit assigned to?”*
- *“How many seats are occupied for Project Talos?”*
- *“Show me available seats on floor 4.”*
- *“Who is sitting next to Sarah?”*

If `GEMINI_API_KEY` is provided, it operates as a full LLM. If missing, it falls back to a regex-based NLP engine to parse intent parameters.

---

## 🛠️ Local Setup & Installation

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (installed locally or an Atlas connection URI)

### 1. Backend Setup
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend/` folder:
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/ethara_seat_allocation
   JWT_SECRET=your_super_secret_jwt_key
   GEMINI_API_KEY=your_optional_google_gemini_api_key
   ```
4. Seed the database with 5,000+ employees and coordinates:
   ```bash
   node scripts/seed.js
   ```
5. Start the API server:
   ```bash
   npm start
   ```

### 2. Frontend Setup
1. Navigate to the frontend folder:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser to **`http://localhost:5173`** to access the system.

---

## 🧪 Running Security & RBAC Tests

The backend includes a dedicated test runner `test-apis.js` that registers mock accounts, attempts credentials validation, performs seat bookings, verifies that double bookings are blocked, and checks role permissions.

To execute the test suite:
```bash
cd backend
node test-apis.js
```
