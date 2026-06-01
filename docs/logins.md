# IIT Tirupati Default Logins

The application has been securely seeded with three distinct profiles representing the primary Role-Based Access Control (RBAC) tiers for **IIT Tirupati**.

You can use the credentials below to test the application's access scopes.

---

### 1. Institute Administrator
**Role**: `INSTITUTION_ADMIN`
- **Email**: `admin@iittp.ac.in`
- **Password**: `password123`
- **Capabilities**: Can view and manage all publications and faculty across the entire institution. Cannot submit publications directly (unless tied to a faculty profile).

### 2. Head of Department (Computer Science & Engineering)
**Role**: `HOD`
**Name**: Dr. Turing
- **Email**: `hod.cs@iittp.ac.in`
- **Password**: `password123`
- **Capabilities**: Has full dashboard access to all faculty publications strictly within the **CSE** department. Responsible for reviewing `PENDING` or `FLAGGED` publications and approving/rejecting them.

### 3. Faculty Member (Computer Science & Engineering)
**Role**: `FACULTY`
**Name**: Dr. Sairaj
- **Email**: `sairaj.cs@iittp.ac.in`
- **Password**: `password123`
- **Capabilities**: Can log in to submit new publications (manual entry, DOI, batch). Can only view their own publication history and track approval statuses.
