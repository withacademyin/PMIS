# UI/UX & Design System Guidelines (`skills.md`)

## 1. Visual Theme & Philosophy
* **Aesthetic:** Modern, high-density enterprise SaaS (resembling Linear, Stripe Dashboard, or Greenhouse).
* **Base Background:** Off-white canvas (`bg-slate-50` / `bg-zinc-50`).
* **Surfaces:** Pure white containers (`bg-white`) with crisp neutral borders (`border-slate-200` or `border-zinc-200`).
* **Shadows:** Minimal, subtle elevation (`shadow-xs` or `shadow-sm`). Never use glowing or colored drop-shadows.

## 2. Color System
* **Brand Primary:** Deep Indigo (`bg-indigo-600 hover:bg-indigo-700 text-white`).
* **Text Hierarchy:**
  * Primary Headings: `text-slate-900 font-semibold tracking-tight`
  * Body Text: `text-slate-600 text-sm`
  * Meta & Secondary: `text-slate-400 text-xs`
* **Semantic Match Scores:**
  * High Match ($\ge 80\%$): `bg-emerald-50 text-emerald-700 border-emerald-200`
  * Moderate Match ($50\% - 79\%$): `bg-amber-50 text-amber-700 border-amber-200`
  * Low Match ($< 50\%$): `bg-slate-100 text-slate-600 border-slate-200`
* **Application Workflow Badges:**
  * `APPLIED`: Neutral Slate (`bg-slate-100 text-slate-700`)
  * `SHORTLISTED`: Sky Blue (`bg-sky-50 text-sky-700 border-sky-200`)
  * `INTERVIEW_SCHEDULED`: Purple (`bg-purple-50 text-purple-700 border-purple-200`)
  * `ACCEPTED`: Emerald (`bg-emerald-50 text-emerald-700 border-emerald-200`)
  * `REJECTED`: Rose (`bg-rose-50 text-rose-700 border-rose-200`)

## 3. Component & Layout Rules
* **Skill Tags:**
  * Matched: `bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2 py-0.5 rounded-md`
  * Missing: `bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-md line-through`
* **Data Presentation:**
  * Recruiter candidate pipelines must use a compact `<Table>` element, never loose cards.
  * Modals must feature clear header actions, a dismiss button, and disabled loading states on submission.
