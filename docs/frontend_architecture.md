# Frontend Architecture (`Next.js`)

## 1. Project Mission & Target
Build a clean, production-ready frontend for an Internship Hiring Portal MVP connecting Learners, Recruiters, and Admins.
* Focus on reliable state management and clear visual hierarchy.
* Eliminate all cyberpunk/neon placeholder landing page tropes. Build real functional SaaS dashboards.

## 2. Technical Stack
* **Framework:** Next.js (App Router, JavaScript, React 19).
* **Styling:** Tailwind CSS v4.
* **Component Library:** shadcn/ui primitives.
* **Icons:** `lucide-react`.
* **API Communication:** HTTP requests via centralized client (`src/lib/api.js`) targeting `http://localhost:5001/api`.

## 3. Strict Rules
* **Imports:** ALWAYS ensure that every UI component and `lucide-react` icon used in the JSX is explicitly imported at the top of the file to prevent Runtime ReferenceErrors.

## 3. Directory Layout & Architecture
```text
src/
├── app/
│   ├── layout.js            # Global root layout & Inter font
│   ├── page.js              # Main dashboard hosting active role views
│   └── globals.css          # Tailwind & shadcn CSS theme tokens
├── components/
│   ├── ui/                  # shadcn primitives (Button, Table, Dialog, Badge, Card)
│   ├── Navbar.jsx           # Global header with instant Role Switcher
│   ├── AssessmentModal.jsx  # AI screening quiz workflow
│   └── ScheduleModal.jsx    # Recruiter interview scheduling dialog
├── views/
│   ├── LearnerView.jsx      # Job cards, match % preview, apply triggers
│   ├── RecruiterView.jsx    # Candidate ranking table & status update actions
│   └── AdminView.jsx        # Student verification toggle table
└── lib/
    ├── api.js               # Centralized fetch wrapper for Node.js API
    └── utils.js             # shadcn cn() class merger




Proper Flow :
Onboarding and Verification -> Learner and companies/recruiters
Student ID/college verification
Profile builder — academic details, skills, resume upload, portfolio links
Internship/opportunity listings
Skill-tagging & matching engine
Application workflow (If Via portal)
email notifications
Interview scheduling (if Via Portal)
Progress tracking (if Via Portal)
