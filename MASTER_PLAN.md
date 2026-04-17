# PeopleHub HRM System — Master Plan

**Version:** 1.0.0  
**Created:** April 2026  
**Author:** Engineering Planner — AGENT-TEAM  
**Status:** Approved for Sprint execution

---

## Project Overview

| Attribute | Detail |
|-----------|--------|
| **Product** | PeopleHub — All-in-one HRM Platform |
| **Target** | Mid-market companies (50–5,000 employees) |
| **Frontend** | React 19 + TypeScript + Ant Design 5 + Vite + Zustand + TanStack Query |
| **Backend** | NestJS 11 + Prisma + PostgreSQL + Redis + JWT |
| **Testing** | Jest (backend), Vitest + RTL (frontend) |
| **Infrastructure** | Docker Compose + Nginx + Cloudflare Tunnel |
| **Total Sprints** | 5 |
| **Sprint Duration** | 2 weeks each (estimated) |

---

## Sprint Roadmap Summary

| Sprint | Name | Goal | Complexity |
|--------|------|------|------------|
| **Sprint 1** | Foundation & Core Employee Management | MVP with auth, employee CRUD, org structure | Medium |
| **Sprint 2** | Attendance, Leave & Time Management | Time tracking, leave workflow, shift scheduling | High |
| **Sprint 3** | Payroll & Compensation | Salary calculation, tax engine, payslip generation | Very High |
| **Sprint 4** | Performance & Recruitment | Reviews, KPIs, ATS pipeline, interviews | High |
| **Sprint 5** | Training, Reports & Polish | LMS, analytics dashboard, notifications, security hardening | High |

---

## Sprint 1: Foundation & Core Employee Management (MVP)

### Sprint Goal

Establish the complete development infrastructure and deliver a working MVP with user authentication, role-based access control, employee profile management, and organizational hierarchy. The system must be deployable end-to-end with a login page, admin dashboard, and basic employee CRUD operations.

### Backend Tasks

| # | Task | Module | Details |
|---|------|--------|---------|
| BE-1.1 | Initialize NestJS project | Infrastructure | NestJS 11 with TypeScript, ESLint, Prettier, module structure |
| BE-1.2 | Configure Prisma ORM | Infrastructure | schema.prisma with models: Tenant, User, Session, RefreshToken, Role, Permission, Department, Position, Employee |
| BE-1.3 | Database migrations | Infrastructure | Initial migration, seed script for default roles (ADMIN, HR_MANAGER, MANAGER, EMPLOYEE, RECRUITER) and sample tenant |
| BE-1.4 | Docker Compose setup | Infrastructure | Services: postgres:16, redis:7, backend, frontend, minio, nginx |
| BE-1.5 | Auth module | Auth | JWT access + refresh tokens, bcrypt/argon2 password hashing, login/register/password-reset endpoints |
| BE-1.6 | RBAC system | Auth | Role guard, permission guard, `@Roles()`, `@Permissions()` decorators, data-level scope middleware |
| BE-1.7 | User management module | Auth | CRUD for users, activate/deactivate, password reset, session management, refresh token rotation |
| BE-1.8 | Department module | Organization | CRUD, hierarchical tree (parent/children), manager assignment, budget/cost center |
| BE-1.9 | Position module | Organization | CRUD, salary range, headcount, department association |
| BE-1.10 | Employee module | Employee | CRUD, employee code auto-generation, profile fields (personal, contact, bank, emergency), status management, photo upload |
| BE-1.11 | Organization tree endpoint | Organization | Recursive CTE query for full org chart, flattened tree for UI |
| BE-1.12 | Swagger/OpenAPI docs | Infrastructure | Decorate all Sprint 1 endpoints, enable Swagger UI at `/api/docs` |
| BE-1.13 | Global error handling | Infrastructure | Exception filters, standardized error response format, validation pipe |
| BE-1.14 | Tenant isolation middleware | Infrastructure | Extract tenant from JWT/subdomain, enforce `tenantId` on all queries |
| BE-1.15 | Unit + E2E tests (Sprint 1 scope) | Testing | Auth service tests, employee CRUD tests, RBAC guard tests, Prisma repository tests |

### Frontend Tasks

| # | Task | Module | Details |
|---|------|--------|---------|
| FE-1.1 | Initialize React project | Infrastructure | Vite + React 19 + TypeScript, ESLint, Prettier, TailwindCSS 4, Ant Design 5 |
| FE-1.2 | Project structure | Infrastructure | Folder layout: src/pages, src/components, src/stores, src/services, src/hooks, src/types, src/utils |
| FE-1.3 | Zustand auth store | Auth | Token management, login/logout state, user profile, tenant context |
| FE-1.4 | TanStack Query setup | Infrastructure | Query client configuration, axios interceptor for token refresh, error handling, retry logic |
| FE-1.5 | Login page | Auth | Email/password form, validation (RHF + Zod), remember me, forgot password link |
| FE-1.6 | App shell / layout | Infrastructure | ProLayout sidebar, top bar with user menu, breadcrumb navigation, responsive design |
| FE-1.7 | Landing page | Public | Product overview, feature highlights, login/register CTA, public careers page stub |
| FE-1.8 | Dashboard (admin) | Dashboard | KPI cards (total employees, departments, active/inactive), recent activity feed, quick actions |
| FE-1.9 | Employee list page | Employee | ProTable with filtering (department, status, search), pagination, bulk actions, export CSV |
| FE-1.10 | Employee detail page | Employee | Tabbed view: profile, documents, employment history, salary info, manager/direct reports |
| FE-1.11 | Employee create/edit form | Employee | Multi-step form (personal, contact, employment, bank), photo upload, Zod validation |
| FE-1.12 | Department management | Organization | Tree view (Ant Design Tree), CRUD modal, manager dropdown, drag-and-drop reorder |
| FE-1.13 | Position management | Organization | ProTable CRUD, department filter, salary range inputs |
| FE-1.14 | User management | Auth | Admin user list, role assignment, activate/deactivate toggle |
| FE-1.15 | Route guards | Auth | `ProtectedRoute` component, role-based route access, redirect to login |
| FE-1.16 | Unit + component tests (Sprint 1 scope) | Testing | Login form tests, employee table tests, auth store tests, route guard tests |

### Expected Deliverables

- [ ] Fully containerized dev environment (`docker compose up`)
- [ ] Working PostgreSQL database with Prisma migrations
- [ ] JWT authentication with refresh token rotation
- [ ] RBAC with 5 pre-defined roles
- [ ] Employee CRUD with photo upload
- [ ] Department hierarchy with visual tree
- [ ] Position management
- [ ] Admin dashboard with KPI cards
- [ ] Swagger API documentation
- [ ] Login page and protected app shell

### Success Criteria

- [ ] `docker compose up` starts all services without errors
- [ ] User can register, login, and receive valid JWT
- [ ] Refresh token rotation works correctly
- [ ] RBAC guards block unauthorized access (verified via E2E tests)
- [ ] Employee CRUD operations work with tenant isolation
- [ ] Department tree displays correctly with nested children
- [ ] All Sprint 1 API endpoints documented in Swagger
- [ ] Frontend compiles with zero TypeScript errors
- [ ] Test coverage: backend > 60%, frontend > 50%
- [ ] Deployed URL accessible via Cloudflare Tunnel

### Estimated Complexity

**Medium** — Core infrastructure and CRUD operations. Well-understood patterns. Primary complexity is in the RBAC system and tenant isolation middleware.

**Estimated effort:** ~80 developer-hours (backend: 45h, frontend: 35h)

---

## Sprint 2: Attendance, Leave & Time Management

### Sprint Goal

Deliver a complete time and attendance system with web-based check-in/out, shift scheduling, leave request workflow with approvals, leave balance accrual tracking, holiday calendar management, and attendance reports. Add a manager dashboard for team visibility.

### Backend Tasks

| # | Task | Module | Details |
|---|------|--------|---------|
| BE-2.1 | Shift model & CRUD | Attendance | Shift entity (name, start/end time, break, type: FIXED/ROTATING/FLEXIBLE), assign to departments/employees |
| BE-2.2 | Attendance log model | Attendance | Check-in/out records (employeeId, timestamp, type, location/IP, status: PRESENT/LATE/EARLY_LEAVE) |
| BE-2.3 | Check-in/out endpoint | Attendance | Web-based check-in with IP capture, duplicate prevention (same-day), geolocation support (optional) |
| BE-2.4 | Shift assignment service | Attendance | Assign shifts to employees, rotating shift schedule generator, conflict detection |
| BE-2.5 | Attendance calculation service | Attendance | Daily attendance summary (worked hours, late minutes, early leave), status determination based on shift rules |
| BE-2.6 | Leave type model & CRUD | Leave | Leave types (ANNUAL, SICK, MATERNITY, etc.), accrual rules (days/year, monthly accrual rate, carry-over limit) |
| BE-2.7 | Leave balance service | Leave | Accrual calculation engine, balance queries per employee per leave type, scheduled accrual jobs (cron) |
| BE-2.8 | Leave request model & CRUD | Leave | Create, edit, cancel leave requests, date range validation, balance check before submission |
| BE-2.9 | Approval workflow engine | Leave | Multi-level approval (manager → HR), approval chain resolution, delegate approver, auto-escalation |
| BE-2.10 | Leave approval endpoints | Leave | Approve/reject endpoints, bulk approval, approval history audit trail |
| BE-2.11 | Holiday model & CRUD | Leave | Holiday calendar (name, date, type: PUBLIC/COMPANY), recurring holidays, per-department holidays |
| BE-2.12 | Attendance report service | Reports | Daily/weekly/monthly attendance reports, late frequency, absence patterns, export CSV/PDF |
| BE-2.13 | Manager team view | Dashboard | Team attendance overview, pending leave approvals, team calendar, absence alerts |
| BE-2.14 | BullMQ scheduled jobs | Infrastructure | Daily accrual cron, attendance summary generation, late arrival notifications |
| BE-2.15 | Unit + E2E tests (Sprint 2 scope) | Testing | Leave balance calculation tests, approval workflow tests, shift conflict detection tests |

### Frontend Tasks

| # | Task | Module | Details |
|---|------|--------|---------|
| FE-2.1 | Check-in/out page | Attendance | Big clock display, check-in/out button, today's status, recent history, current shift info |
| FE-2.2 | Attendance calendar | Attendance | Monthly calendar view (Ant Design Calendar), color-coded attendance status, click for details |
| FE-2.3 | Attendance history table | Attendance | ProTable with date range filter, employee filter, status filter, export |
| FE-2.4 | Shift management page | Attendance | Shift list CRUD, shift assignment modal (multi-select employees), rotating schedule preview |
| FE-2.5 | Leave request form | Leave | Date picker (range), leave type dropdown, reason text, attachment upload, half-day toggle |
| FE-2.6 | Leave request list | Leave | Employee's own requests, status badges, cancel button (if pending), detail modal |
| FE-2.7 | Leave balance dashboard | Leave | Card layout showing balances per leave type, progress bars, accrual history |
| FE-2.8 | Leave approval page | Leave | Manager view: pending requests list, approve/reject with comment, bulk actions |
| FE-2.9 | Holiday calendar page | Leave | Year calendar with holiday markers, CRUD modal, import holiday list |
| FE-2.10 | Attendance reports page | Reports | Date range selector, chart (bar: daily attendance), summary stats, export buttons |
| FE-2.11 | Manager dashboard | Dashboard | Team attendance widget, pending approvals widget, team calendar, quick actions |
| FE-2.12 | Leave type management | Admin | CRUD for leave types, accrual rule configuration form |
| FE-2.13 | Employee self-service nav | Infrastructure | Sidebar section: My Attendance, My Leave, My Balance, My Schedule |

### Expected Deliverables

- [ ] Web-based check-in/out with IP tracking
- [ ] Shift creation, assignment, and rotating schedules
- [ ] Leave request creation with balance validation
- [ ] Multi-level approval workflow
- [ ] Automated leave balance accrual (cron job)
- [ ] Holiday calendar management
- [ ] Attendance reports with charts
- [ ] Manager team dashboard
- [ ] Employee self-service attendance/leave portal

### Success Criteria

- [ ] Employee can check in/out and see real-time status
- [ ] Leave request correctly deducts from balance on approval
- [ ] Approval workflow routes to correct manager
- [ ] Accrual cron job runs daily and updates balances
- [ ] Holiday dates are excluded from leave calculations
- [ ] Attendance report accurately reflects worked hours
- [ ] Manager sees all team members' attendance in one view
- [ ] Test coverage: backend > 65%, frontend > 55%

### Estimated Complexity

**High** — Accrual engine, approval workflow routing, and shift scheduling involve non-trivial business logic. Leave balance calculations must handle edge cases (carry-over, pro-rata, mid-year hires).

**Estimated effort:** ~120 developer-hours (backend: 70h, frontend: 50h)

---

## Sprint 3: Payroll & Compensation

### Sprint Goal

Build a comprehensive payroll engine with configurable salary components, automated tax and deduction calculations, pay period management, payroll run workflows, payslip PDF generation, and employee self-service for viewing payslips. This is the most complex sprint due to financial accuracy requirements.

### Backend Tasks

| # | Task | Module | Details |
|---|------|--------|---------|
| BE-3.1 | Salary component model | Payroll | Components: BASE, ALLOWANCE (meal, transport, phone), DEDUCTION (insurance, tax, loan), BONUS |
| BE-3.2 | Employee salary setup | Payroll | Assign salary components to employees, effective dates, version history |
| BE-3.3 | Tax rule model & CRUD | Payroll | Tax brackets, progressive tax calculation, regional tax configs, social insurance rates |
| BE-3.4 | Tax calculation engine | Payroll | Progressive tax computation, social insurance (employee + employer), dependent deductions |
| BE-3.5 | Pay period model | Payroll | Monthly/biweekly/weekly, start/end dates, cutoff dates, fiscal year config |
| BE-3.6 | Payroll run model | Payroll | DRAFT → PENDING_APPROVAL → APPROVED → PROCESSED → PAID status workflow |
| BE-3.7 | Payroll calculation engine | Payroll | Gross pay, deductions, net pay, employer cost, overtime pay, pro-rated salary for mid-month hires |
| BE-3.8 | Payroll approval workflow | Payroll | HR creates draft → manager reviews → finance approves → payment processed |
| BE-3.9 | Payslip PDF generation | Payroll | PDF template (company logo, employee details, earnings, deductions, net), watermark for drafts |
| BE-3.10 | Payslip storage | Payroll | Store PDF in MinIO/S3, link to employee, access control |
| BE-3.11 | Salary history | Payroll | Track salary changes over time, change reason, approval trail |
| BE-3.12 | Payroll reports | Reports | Payroll summary by department, cost analysis, tax liability report, bank transfer file generation |
| BE-3.13 | Employee payslip endpoint | Payroll | Employee can view own payslips, download PDF, year-to-date summary |
| BE-3.14 | Payroll audit trail | Audit | Log every calculation, adjustment, and approval for compliance |
| BE-3.15 | Unit + E2E tests (Sprint 3 scope) | Testing | Tax calculation tests (multiple brackets), payroll run tests, PDF generation tests, decimal precision tests |

### Frontend Tasks

| # | Task | Module | Details |
|---|------|--------|---------|
| FE-3.1 | Salary component setup | Payroll | CRUD for salary components, assign to employees, effective date picker |
| FE-3.2 | Tax rule configuration | Admin | Tax bracket table, rate inputs, regional toggle, social insurance rates |
| FE-3.3 | Payroll run dashboard | Payroll | Payroll run list, status badges, create new run wizard (select pay period, employees) |
| FE-3.4 | Payroll calculation preview | Payroll | Table showing calculated pay for each employee, drill-down to component breakdown, manual adjustment |
| FE-3.5 | Payroll approval flow | Payroll | Review → Approve → Process steps, comments, rejection with reason |
| FE-3.6 | Payslip viewer | Payroll | Employee self-service: list of payslips, PDF viewer, download, YTD summary |
| FE-3.7 | Payslip admin view | Payroll | HR can view/generate any employee's payslip, resend via email |
| FE-3.8 | Salary history page | Payroll | Timeline view of salary changes, before/after comparison, change reason |
| FE-3.9 | Payroll reports | Reports | Department cost breakdown chart, monthly trend line, tax liability summary, export to Excel |
| FE-3.10 | Bank file generation | Payroll | Generate bank transfer file (CSV format per bank template), download |
| FE-3.11 | Pay period management | Admin | CRUD pay periods, calendar view, cutoff date config |

### Expected Deliverables

- [ ] Configurable salary components (base, allowances, deductions, bonuses)
- [ ] Progressive tax calculation engine with regional rules
- [ ] Payroll run workflow (draft → approve → process → pay)
- [ ] Payslip PDF generation with company branding
- [ ] Salary history tracking with audit trail
- [ ] Employee self-service payslip viewer
- [ ] Payroll reports and cost analysis
- [ ] Bank transfer file generation

### Success Criteria

- [ ] Payroll calculation matches manual verification for 10+ test cases
- [ ] Tax calculation correctly applies progressive brackets
- [ ] Payroll run status transitions are enforced
- [ ] Payslip PDF renders correctly with all components
- [ ] Employees can only view their own payslips
- [ ] Payroll adjustments are logged in audit trail
- [ ] Decimal precision: all monetary values use 2 decimal places, no floating-point errors
- [ ] Test coverage: backend > 70%, frontend > 55%
- [ ] **Zero** calculation errors in test suite (financial accuracy is non-negotiable)

### Estimated Complexity

**Very High** — This is the most critical and complex sprint. Payroll calculations must be mathematically precise. Tax rules vary by region and require progressive bracket logic. The approval workflow must prevent unauthorized changes. Decimal precision throughout is essential.

**Estimated effort:** ~150 developer-hours (backend: 90h, frontend: 60h)

---

## Sprint 4: Performance & Recruitment

### Sprint Goal

Implement a full performance management system with configurable review cycles, KPI templates, goal tracking, and 360-degree feedback. Build a complete ATS (Applicant Tracking System) with job posting management, candidate pipeline (Kanban board), interview scheduling, scorecards, and offer management.

### Backend Tasks

| # | Task | Module | Details |
|---|------|--------|---------|
| BE-4.1 | Performance review cycle model | Performance | Cycle name, period (quarterly/annual), template, status, participants |
| BE-4.2 | KPI template model & CRUD | Performance | Pre-built KPI templates by role/department, custom KPIs, weight/scoring config |
| BE-4.3 | Goal model & CRUD | Performance | SMART goals, deadline, progress tracking, manager alignment |
| BE-4.4 | Review submission model | Performance | Self-evaluation, manager evaluation, peer evaluation, rating scale |
| BE-4.5 | 360-degree feedback service | Performance | Invite peers/subordinates, anonymous feedback, aggregation |
| BE-4.6 | Review cycle service | Performance | Auto-create review submissions, deadline tracking, reminder notifications |
| BE-4.7 | Performance rating calculation | Performance | Weighted average of self/manager/peer scores, calibration mode |
| BE-4.8 | Job posting model & CRUD | Recruitment | Title, description, requirements, department, position, status, publish/unpublish |
| BE-4.9 | Candidate model & CRUD | Recruitment | Applicant info, resume parsing (text extraction), source tracking, status |
| BE-4.10 | Pipeline stage management | Recruitment | Kanban stages (NEW → SCREENING → INTERVIEWING → OFFERED → HIRED/REJECTED), custom stages |
| BE-4.11 | Candidate pipeline endpoint | Recruitment | Bulk status update, drag-and-drop stage changes, search and filter |
| BE-4.12 | Interview model & CRUD | Recruitment | Interview date/time, type (phone/video/on-site), interviewer(s), location/link |
| BE-4.13 | Interview scorecard | Recruitment | Structured evaluation form per interview, rating per criterion, notes, recommendation |
| BE-4.14 | Offer model & CRUD | Recruitment | Offer letter details (salary, start date, benefits), status, e-signature stub |
| BE-4.15 | Calendar integration service | Recruitment | Check interviewer availability, conflict detection, calendar invite generation (ICS) |
| BE-4.16 | Unit + E2E tests (Sprint 4 scope) | Testing | Review cycle tests, KPI scoring tests, candidate pipeline tests, interview scheduling tests |

### Frontend Tasks

| # | Task | Module | Details |
|---|------|--------|---------|
| FE-4.1 | Review cycle setup | Performance | Create cycle wizard (select template, period, participants), timeline view |
| FE-4.2 | KPI template management | Performance | CRUD templates, drag-and-drop KPI ordering, weight adjustment |
| FE-4.3 | Performance review form | Performance | Multi-section form (self-eval, manager eval), rating sliders, comment fields, submit |
| FE-4.4 | 360 feedback page | Performance | Feedback form for peers, anonymous indicator, submission confirmation |
| FE-4.5 | Performance dashboard | Performance | Individual view: goals progress, KPI scores, review history; Manager view: team performance overview |
| FE-4.6 | Performance reports | Performance | Rating distribution chart, department comparison, trend over cycles |
| FE-4.7 | Job posting management | Recruitment | ProTable CRUD, publish/unpublish toggle, preview public page |
| FE-4.8 | Candidate Kanban board | Recruitment | Kanban columns per stage, drag-and-drop cards, candidate preview on hover, add candidate modal |
| FE-4.9 | Candidate detail page | Recruitment | Profile info, resume viewer, timeline of activities, scorecards, notes, email history |
| FE-4.10 | Interview scheduling | Recruitment | Calendar picker, interviewer multi-select, type selector, send invite button, ICS download |
| FE-4.11 | Interview scorecard form | Recruitment | Structured evaluation per criterion, rating, pass/fail recommendation, submit |
| FE-4.12 | Offer management | Recruitment | Offer letter template editor, variable substitution (name, salary, date), send/track status |
| FE-4.13 | Recruitment dashboard | Dashboard | Pipeline funnel chart, time-to-hire metric, open positions count, source effectiveness |
| FE-4.14 | Public job board | Public | List of published jobs, job detail page, apply form (name, email, resume upload) |

### Expected Deliverables

- [ ] Performance review cycle creation and management
- [ ] KPI templates with role-based defaults
- [ ] Goal tracking with progress indicators
- [ ] 360-degree feedback collection
- [ ] Job posting creation and publishing
- [ ] Candidate Kanban pipeline board
- [ ] Interview scheduling with calendar integration
- [ ] Interview scorecards and evaluations
- [ ] Offer letter generation and tracking
- [ ] Public job board for external applicants
- [ ] Recruitment analytics dashboard

### Success Criteria

- [ ] Review cycle auto-creates submissions for all participants
- [ ] KPI scoring correctly applies weights
- [ ] 360 feedback is anonymous to recipients
- [ ] Candidate can be dragged between pipeline stages
- [ ] Interview scheduling detects conflicts
- [ ] Offer letter renders with correct variable substitution
- [ ] Public job board displays only published postings
- [ ] Test coverage: backend > 65%, frontend > 55%

### Estimated Complexity

**High** — Two large modules (Performance + Recruitment) delivered simultaneously. The Kanban board, interview scheduling with conflict detection, and 360-degree feedback aggregation are technically challenging. Offer letter templating requires careful variable handling.

**Estimated effort:** ~140 developer-hours (backend: 75h, frontend: 65h)

---

## Sprint 5: Training, Reports & Polish

### Sprint Goal

Complete the product with a training/LMS module (course management, enrollment, certification tracking), comprehensive reports and analytics dashboard with export capabilities, system settings and configuration, notification system (email + in-app), mobile-responsive improvements across all pages, and final security hardening.

### Backend Tasks

| # | Task | Module | Details |
|---|------|--------|---------|
| BE-5.1 | Course model & CRUD | Training | Course title, description, instructor, department, schedule, capacity, status, materials |
| BE-5.2 | Enrollment model & service | Training | Self-enroll, admin-assign, waitlist, capacity management, enrollment status tracking |
| BE-5.3 | Certification model | Training | Certificate template, issue certificate on completion, expiry date, renewal reminders |
| BE-5.4 | Skills matrix model | Training | Skills catalog, employee skill assessment, skill gap analysis per position |
| BE-5.5 | Training progress tracking | Training | Module completion tracking, quiz scores (basic), attendance, completion certificates |
| BE-5.6 | Report engine | Reports | Pre-built report queries (headcount, turnover, diversity, cost-per-hire, training ROI) |
| BE-5.7 | Export service | Reports | Export to Excel (xlsx), PDF generation for reports, CSV for raw data |
| BE-5.8 | System settings module | Admin | Company info, timezone, language, currency, email/SMTP config, feature flags |
| BE-5.9 | Notification model & service | Notification | In-app notification CRUD, email templates, channel routing, user preferences |
| BE-5.10 | BullMQ notification processor | Notification | Process notification queue, send emails (Nodemailer), push in-app notifications |
| BE-5.11 | Scheduled notification jobs | Notification | Contract expiry alerts, document expiry, birthday/anniversary, probation ending |
| BE-5.12 | Audit log enhancement | Audit | Comprehensive audit trail across all modules, search and filter, export |
| BE-5.13 | API key management | Admin | Generate/revoke API keys, rate limiting per key, usage monitoring |
| BE-5.14 | Security hardening | Infrastructure | Helmet, CORS strict config, rate limiting, SQL injection prevention, XSS protection, input sanitization, audit of all endpoints |
| BE-5.15 | Performance optimization | Infrastructure | Database indexing review, query optimization, Redis caching for dashboard data, N+1 query fixes |
| BE-5.16 | Unit + E2E tests (Sprint 5 scope) | Testing | Course enrollment tests, notification delivery tests, report generation tests, export tests |

### Frontend Tasks

| # | Task | Module | Details |
|---|------|--------|---------|
| FE-5.1 | Course catalog page | Training | Course list with filters (department, status, date), enrollment button, capacity indicator |
| FE-5.2 | Course detail page | Training | Full description, schedule, instructor, enrolled employees list, materials download |
| FE-5.3 | Course management (admin) | Training | CRUD form with rich text editor, schedule picker, capacity config, publish toggle |
| FE-5.4 | Enrollment management | Training | Enroll employees modal, waitlist view, bulk enrollment, enrollment status update |
| FE-5.5 | My training page | Training | Employee view: enrolled courses, progress bars, completed certificates, upcoming training |
| FE-5.6 | Skills matrix page | Training | Grid view (employees x skills), proficiency levels, gap analysis visualization |
| FE-5.7 | Reports & Analytics dashboard | Reports | Multi-tab dashboard: workforce overview, attendance trends, payroll costs, training completion, recruitment funnel |
| FE-5.8 | Custom report builder | Reports | Drag-and-drop metric selection, date range filter, chart type selector, save report template |
| FE-5.9 | Export buttons | Reports | Export current view to Excel/PDF/CSV on all list pages |
| FE-5.10 | System settings page | Admin | Multi-tab settings: company profile, email config, feature toggles, branding (logo, colors) |
| FE-5.11 | Notification center | Notification | Bell icon in header, notification dropdown, mark as read, notification preferences page |
| FE-5.12 | Audit log viewer | Admin | ProTable with filters (module, action, user, date), detail modal |
| FE-5.13 | API key management page | Admin | Generate key modal, key list with usage stats, revoke button |
| FE-5.14 | Mobile responsiveness audit | Infrastructure | Review all pages on mobile breakpoints (375px, 768px), fix layout issues, touch-friendly interactions |
| FE-5.15 | Loading states & error boundaries | Infrastructure | Add loading spinners, empty states, error boundaries, retry mechanisms across all pages |
| FE-5.16 | Final UI polish | Infrastructure | Consistent spacing, color palette review, typography audit, icon consistency, animation refinement |

### Expected Deliverables

- [ ] Course catalog and management
- [ ] Training enrollment with capacity management
- [ ] Certificate generation on completion
- [ ] Skills matrix with gap analysis
- [ ] Reports & Analytics dashboard with 50+ pre-built metrics
- [ ] Export to Excel/PDF/CSV
- [ ] System settings and configuration panel
- [ ] Notification center (in-app + email)
- [ ] Scheduled alerts (contract expiry, birthdays, etc.)
- [ ] Audit log viewer
- [ ] API key management
- [ ] Mobile-responsive across all pages
- [ ] Security-hardened application
- [ ] Final UI polish and consistency

### Success Criteria

- [ ] Course enrollment respects capacity limits
- [ ] Certificate auto-generated on course completion
- [ ] Skills matrix displays correctly with gap highlighting
- [ ] Reports dashboard loads in < 3 seconds with cached data
- [ ] Export produces correctly formatted Excel/PDF files
- [ ] Notifications delivered via configured channels
- [ ] Scheduled alerts fire correctly (verified via test cron)
- [ ] All pages pass mobile responsiveness check at 375px and 768px
- [ ] Security audit: no OWASP Top 10 vulnerabilities
- [ ] All API endpoints have rate limiting
- [ ] Test coverage: backend > 70%, frontend > 60%
- [ ] Lighthouse score: Performance > 80, Accessibility > 90, Best Practices > 95

### Estimated Complexity

**High** — Largest sprint by feature count. Combines a new module (Training), a complex reporting engine, notification system, and comprehensive polish/security work. The report builder and export service require significant frontend and backend coordination.

**Estimated effort:** ~160 developer-hours (backend: 80h, frontend: 80h)

---

## Cross-Sprint Concerns

### Testing Strategy

| Level | Tool | Coverage Target | Notes |
|-------|------|-----------------|-------|
| Unit (backend) | Jest | > 70% | Service layer, calculation engines, validators |
| E2E (backend) | Jest + Supertest | All endpoints | Full request-response cycle testing |
| Unit (frontend) | Vitest | > 60% | Utils, hooks, stores, form validation |
| Component (frontend) | Vitest + RTL | > 55% | Key components: forms, tables, modals |
| E2E (frontend) | Playwright | Critical paths | Login, employee CRUD, leave request, payroll run |

### Deployment Pipeline

```
Developer → Git push → GitHub Actions → Tests → Build → Docker image → Deploy → Cloudflare Tunnel
```

- **CI (every push):** Lint, type-check, unit tests, build
- **CD (main branch):** E2E tests, Docker build, push to registry, deploy via tunnel
- **Environment variables:** Managed via `.env` files and Docker Compose secrets

### Code Quality Gates

- ESLint + Prettier with zero warnings
- TypeScript strict mode (no `any`)
- All PRs require passing CI
- Code review mandatory before merge
- No direct commits to `main`

### Data Migration Strategy

- Each sprint's database changes go through Prisma migrations
- Seed scripts for demo data at each sprint
- Migration rollback scripts tested before each sprint deploy
- Production migration run during maintenance window

### API Versioning

- All endpoints prefixed with `/api/v1/`
- Breaking changes require new version prefix
- Swagger docs generated per sprint

---

## Risk Register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Payroll calculation errors | Critical | Low | Dual-verification tests, manual override, audit trail, decimal precision enforcement |
| Scope creep in Sprint 3 | High | Medium | Strict MVP scope for Sprint 3; defer advanced features to Sprint 5 |
| Performance degradation with large datasets | Medium | Medium | Index all foreign keys, implement pagination, cache dashboard queries with Redis |
| Leave accrual edge cases (mid-year hires, transfers) | High | Low | Comprehensive test matrix covering all edge cases |
| Mobile responsiveness requiring major refactoring | Medium | Medium | Build responsive from Sprint 1, not as afterthought |
| Notification delivery failures | Medium | Low | BullMQ retry with exponential backoff, dead letter queue, monitoring alerts |

---

## Sprint Dependency Graph

```
Sprint 1 (Foundation)
    │
    ├──→ Sprint 2 (Attendance/Leave) — requires Employee, Department, User models
    │
    ├──→ Sprint 3 (Payroll) — requires Employee, Department, Attendance data
    │
    ├──→ Sprint 4 (Performance/Recruitment) — requires Employee, Department, Position models
    │
    └──→ Sprint 5 (Training/Reports/Polish) — requires all previous modules
```

---

## Total Estimated Effort

| Sprint | Backend (h) | Frontend (h) | Total (h) |
|--------|-------------|--------------|-----------|
| Sprint 1 | 45 | 35 | 80 |
| Sprint 2 | 70 | 50 | 120 |
| Sprint 3 | 90 | 60 | 150 |
| Sprint 4 | 75 | 65 | 140 |
| Sprint 5 | 80 | 80 | 160 |
| **Total** | **360** | **290** | **650** |

---

*Document Version: 1.0*  
*Created: April 2026*  
*Author: Engineering Planner — AGENT-TEAM*  
*Status: Ready for Sprint 1 execution*
