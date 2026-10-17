# Implementation Plan: GigHive Local UI Redesign & Feature Expansion

Redesign the application UI to precisely match the user's uploaded UI/UX Design Collection mockup, brand as **GigHive Local** with the tagline **"Your Skills. Your City. Your Next Opportunity."**, transition from dark violet to a modern crisp SaaS design system (Deep Navy, Royal Blue, Emerald Green, Clean Slate canvas), and build the prioritized features.

---

## 1. Visual Identity & Design System Alignment

- **Brand & Logo**:
  - Update branding across headers, footers, meta tags, and hero to **GigHive Local** with the official tagline: *"Your Skills. Your City. Your Next Opportunity."*
  - Recreate the SVG brand badge inspired by the uploaded logo graphic (graduation cap atop a location pin enclosing a briefcase, accented with skyline silhouette and forward green career pathway).
- **Color Palette & Theme Transformation**:
  - **Background**: Modern crisp light canvas (`#F8FAFC` slate-50 / white cards) with dark navy header/sidebar accents (`#0F172A` / `#1E293B`).
  - **Primary**: Royal Blue (`#2563EB` / `#1D4ED8`) for high-contrast CTA buttons and active states.
  - **Accent**: Emerald Green (`#10B981` / `#059669`) for match percentages, verified badges, and offer notifications.
  - **Typography**: Clean, professional sans-serif typography with distinct visual hierarchy, subtle card borders (`border-slate-200/80`), and refined soft shadows (`shadow-sm` / `shadow-md`).

---

## 2. Dedicated Student Dashboard (Screen 3 from Mockup)

Implement the full **Student Dashboard** view matching Panel 3 of the uploaded collection:
- **Personalized Header**:
  - Greeting banner (*"Welcome back, Alex!"*) with student avatar, college badge, and notification status.
- **Top Quick Stat Cards**:
  - Profile Completion (`72%` with progress bar)
  - Resume Readiness (`88%` with status)
  - Saved Jobs (`24`)
  - Active Applications (`16`)
- **Career Progress Ring & Actionable Checklist**:
  - Circular progress gauge (SVG-rendered animated ring) showing Career Score (`72%`).
  - Next Steps checklist:
    - *Add a project to your profile*
    - *Improve your resume summary*
    - *Learn 1 missing skill (Docker / REST APIs)*
    - *Apply to 2 recommended jobs*
- **Recommended Opportunities & Upcoming Interviews Split View**:
  - Recommended matches with live percentage tags (e.g., `92% Match`, `84% Match`).
  - Upcoming interview schedule card (*Innovatech Labs, Technical Interview on 19 Oct 2026, 10:00 AM* with direct "View Schedule" and Google Calendar shortcut).
- **Recent Applications Journey Table**:
  - Quick status summary table with company, role, applied date, and real-time status pills.

---

## 3. Dedicated Job Catalog with Filter Sidebar (Screen 2 from Mockup)

Implement the split-pane **Find Jobs** directory matching Panel 2 of the uploaded collection:
- **Search & Query Bar**:
  - Multi-input search with keyword/job title, city/locality picker, category selector, and search button.
- **Left Sticky Filter Sidebar**:
  - **Job Type**: Internships, Micro-internships, Part-Time, Full-Time, Freelance, Remote.
  - **Work Arrangement**: On-site, Hybrid, Remote.
  - **Location Radius**: Manually select city or use approximate distance slider (e.g., *Within 10 km*).
  - **Salary / Stipend Range**: Interactive minimum/maximum stipend slider (e.g., `₹5,000 – ₹50,000`).
  - **Skills Tag Filter**: Interactive skill pills to multi-select required skills.
  - **Experience Level**: Freshers / Entry-level, 0–1 year, 1–3 years.
  - **Sort Options**: Relevance, Newest, Nearest, Highest Stipend, Earliest Deadline.
- **Right Job Grid**:
  - Clean card design with company logo avatar, title, verified recruiter badge, location pin, salary box, skill tags, match percentage pill (`94% Match`), and 1-click **Apply** modal.

---

## 4. Preservation of Real-time Status Alerts & Multi-Channel Notifications

- Maintain the complete in-app notification system:
  - Transitioning an application from `under_review` to `interviewed` or `hired` fires the audio chime, celebratory toast banner, top bell indicator, and visual 4-step progress tracker.
  - Ensure compatibility with both student simulation triggers and the private Administrator Command Suite (`/?admin=true`).

---

## 5. Verification & Testing

- Run `lint_applet` to verify clean TypeScript compilation and imports.
- Run `compile_applet` to ensure successful production build.
- Run existing test suites (`node --test src/utils/engine.test.ts`) to ensure domain logic integrity.
- Restart dev server and verify UI responsiveness on both desktop and mobile viewports.
