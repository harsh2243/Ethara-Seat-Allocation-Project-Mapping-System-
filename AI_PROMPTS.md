# AI Tool Usage and Prompts Log

This document details the prompts used to structure, build, and debug the **Ethara Seat Allocation & Project Mapping System**, along with validation details and code corrections.

---

## 1. Prompt Flow Logs

### Prompt 1 – Architecture & Stack Planning
> **Prompt:**
> "I need to design a full-stack corporate seat mapping and project allocation system for Ethara. The system must support around 5,000 employees, 5,500 seats across 5 floors/zones/bays, and map employees to active projects. I want to build it in the MERN stack (MongoDB, Express, React, Node.js). What is the suggested project directory structure, schema model relationships, and visual UI layout for the interactive floor maps and dashboard?"

### Prompt 2 – Database Schema Design
> **Prompt:**
> "Write the Mongoose schemas for four collections:
> 1. `Project` (name, description, manager_name, status).
> 2. `Employee` (employee_code, name, email, department, role, joining_date, status, project_id).
> 3. `Seat` (floor, zone, bay, seat_number, status).
> 4. `SeatAllocation` (employee_id, seat_id, project_id, allocation_status, allocation_date, released_date).
> Define database-level indexes for fast search of emails, employee codes, and seat coordinates. Most importantly, write partial unique indexes for active seat allocations so that an employee can only have one active seat, and a seat can only have one active employee, while still permitting unlimited historical released allocations."

### Prompt 3 – Backend CRUD & Aggregation APIs
> **Prompt:**
> "Create Express controllers and routing files for:
> - **Employee CRUD**: Supporting search filters and paginated results (critical for 5,000 employees). When an employee is deactivated (status set to Inactive), release their active seat allocations automatically.
> - **Project APIs**: Standard project actions and fetching project employees.
> - **Dashboard Metrics**: Using MongoDB aggregation pipelines to calculate:
>   1. Overall summary counts (available, occupied, reserved, maintenance seats, and pending unallocated employees).
>   2. Project utilization density (grouped by project name).
>   3. Floor-wise occupancy rate percentages."

### Prompt 4 – Proximity Seat Allocation Logic
> **Prompt:**
> "Write a seat allocation controller in Node.js that checks if a seat is available and if the employee doesn't have an active booking. Implement a proximity seat routing algorithm: when suggesting seats for a new employee, look up where current employees on the same project are seated (floor/zone densities). Sort the available seats so that:
> 1. Tier 1: Same floor and same zone as the project team.
> 2. Tier 2: Same floor but other zones.
> 3. Tier 3: Other floors.
> Suggest alternative zones if the preferred zone is fully occupied."

### Prompt 5 – AI Assistant NLP Engine
> **Prompt:**
> "Build an AI Assistant controller `/api/ai/query` in Node.js. It should feature:
> 1. A built-in regex-based NLP parser that parses natural queries:
>    - 'Where is employee Amit seated?' / 'Where is my seat? My email is amit@ethara.ai'
>    - 'Which project is Amit assigned to?'
>    - 'Show available seats on Floor 3'
>    - 'Who is sitting near Amit Patel?'
>    - 'How many seats are occupied for Project Talos?'
>    - 'Allocate a seat for a new employee joining today.'
> 2. An optional Gemini API integration that dynamically answers conversational prompts using `process.env.GEMINI_API_KEY` if set, otherwise falling back to the local NLP engine."

### Prompt 6 – Frontend Layout, Visual Maps & Dashboard
> **Prompt:**
> "Generate React.js components for:
> - **App.jsx**: A premium dark-mode sidebar layout that handles tab-switching and shares quick-allocation employee state.
> - **Dashboard.jsx**: Showing radial metrics, Recharts bar charts for project utilization, capacity progress bars per floor, and a sidebar for pending joiners with quick-allocate buttons.
> - **SeatMap.jsx**: Responsive floor/zone visual grid grouping seats by Bay (1-5), coloring them by status (emerald for available, red for occupied, purple for reserved, amber for maintenance), showing hover cards with occupant detail, and providing click modals to book or release. Connect it with the proximity recommendations sidebar.
> - **EmployeeList.jsx**: Table containing paginated records, multi-parameter search (name, email, code, status, project), and onboard modal."

### Prompt 7 – Testing & Business Rule Verification
> **Prompt:**
> "Write a Node.js verification script `test-apis.js` that connects to Mongoose, executes test seed records, books a seat, attempts duplicate allocation (proving double-bookings are blocked), releases a seat, runs mockup NLP questions to verify response compliance, and cleans up."

### Prompt 8 – Authentication & RBAC Integration
> **Prompt:**
> "I need to integrate JWT authentication and Role-Based Access Control (RBAC) in this project.
> 1. Update the `Employee` model to include a hashed `password` field and a `system_role` field with values 'Employee', 'HR', or 'Admin'.
> 2. Create a login controller and a `/api/auth/login` endpoint that issues JSON Web Tokens.
> 3. Create an authorization middleware in `backend/middleware/auth.js` to intercept requests, decode the token, verify authorization roles, and protect APIs (e.g., deactivating employees requires Admin/HR; seat status updates require Admin).
> 4. Update the seed script to pre-calculate bcrypt hashes and insert sandbox accounts for David (Admin), Sarah (HR), Amit (Employee), and populate generic credentials ('ethara123') for all other staff."

### Prompt 9 – UI Authorization Controls
> **Prompt:**
> "Modify the frontend client:
> 1. Build a `Login.jsx` portal containing quick pre-fill selection cards for the Admin, HR, and Employee mock profiles to streamline sandbox reviews.
> 2. Add an Axios request interceptor in `api.js` to automatically attach stored JWT tokens to API request headers.
> 3. Update `App.jsx`, `Dashboard.jsx`, `SeatMap.jsx`, and `EmployeeList.jsx` to dynamically hide/disable booking actions, deactivation buttons, and onboarding modals for standard Employee logins, while revealing seat status controls (Available/Reserved/Maintenance) for Admin logins."

### Prompt 10 – Tailwind CSS v4 & Build Compatibility Debugging
> **Prompt:**
> "My build is crashing on Vercel with PostCSS load errors, and Tailwind CSS v4 directives (like @apply and @theme) are not working, rendering the website without styles. How do I fix the peer dependency warnings and build errors under Vite?"

---

## 2. AI Code Generation Assessment

### What AI Generated Correctly
1. **Schema Design & Indexes**: The Mongoose schemas and sparse partial unique indexes successfully protected the database against duplicate seat bookings at the database tier.
2. **Proximity Algorithm**: The logic grouping active seat allocations by project density and sorting available seats into Tier 1 (same floor/zone), Tier 2 (same floor/alt zone), and Tier 3 (alt floors) correctly suggested the closest spots.
3. **Regex Intent Parsing**: The local NLP query processor correctly parsed all requested sentence intents, resolving emails, names, and floor capacity queries accurately.
4. **JWT & RBAC Guards**: Auth middleware correctly blocked requests and distinguished system role privileges.

### What AI Generated Incorrectly
1. **Dependency Out-of-Sync**: The AI controller referenced `axios` for external Gemini connections, but it was not added to the backend `package.json` dependencies.
2. **Dynamic Imports in Vite**: Dynamic imports of API service functions inside `Dashboard.jsx` and `SeatMap.jsx` triggered `INEFFECTIVE_DYNAMIC_IMPORT` warnings during production compiling.
3. **Tailwind v4 Silent Failures on Vite 8**: The Vite project was scaffolding with the bleeding-edge Vite v8. Vite v8 uses the new Rolldown compiler, which is incompatible with `@tailwindcss/vite`'s peer dependency limits. This caused Tailwind compiler hooks to fail silently, resulting in uncompiled `@apply`, `@theme`, and `@utility` rules in production bundles.

### What the Candidate Manually Fixed
1. **Vite Downgrade**: Downgraded `vite` from v8 to v6 (`^6.0.0`) and the react plugin to v5 (`^5.0.0`) to restore compatibility.
2. **Config Purge**: Deleted the legacy `postcss.config.js` and `tailwind.config.js` files, resolving build failures on Vercel.
3. **Mongoose Hook Refactoring**: Fixed the password hashing pre-save hook in `Employee.js` to be a standard Promise-returning async function.
4. **Static API Imports**: Added `updateSeatStatus` to `api.js` and statically imported it in `SeatMap.jsx` to clean up import warnings.

---

## 3. How Correctness was Verified

1. **Production Build Compilation**: Ran `npm run build` using Vite 6. The compiler successfully resolved and expanded all Tailwind CSS v4 utility classes and variable mappings, completing with **zero warnings** or minification warnings.
2. **Backend Integration Suite**: Executed `node test-apis.js` in the backend directory. Verified token validation, password matching, HR seat allocations, Admin releases, and duplicate blocker constraints.
3. **Sandbox Cross-Login Runs**: Logged in as Admin, HR, and Employee to verify role-based layouts, and checked responsiveness locally on port `5173`.
