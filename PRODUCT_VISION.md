# HRM System — Product Vision

## 1. Product Overview

**Product Name:** HRM System (working title: "PeopleHub")

**Tagline:** Modern, intelligent, and all-in-one Human Resource Management for growing businesses.

**Vision Statement:**  
Build a comprehensive HRM platform that simplifies every aspect of human resource management — from recruitment to retirement — while leveraging AI-driven insights to help organizations make smarter people decisions.

**Product Summary:**  
PeopleHub is a cloud-based, multi-tenant HRM system designed for small to mid-sized enterprises (50–5,000 employees). It consolidates employee lifecycle management, attendance tracking, payroll processing, performance evaluation, recruitment, training, and organizational analytics into a single, intuitive platform. The system emphasizes ease of use, data-driven decision-making, and seamless integrations with existing business tools (accounting, ERP, communication platforms).

**Key Value Propositions:**
- **All-in-one platform:** No need to stitch together multiple HR tools
- **AI-powered insights:** Predictive analytics for attrition risk, hiring quality, payroll anomalies
- **Self-service employee portal:** Reduce HR workload with employee self-service for leave, payslips, and profile updates
- **Multi-language & multi-currency:** Built for global/remote teams
- **Compliance-ready:** Configurable tax rules, labor law compliance templates per region
- **Open API & webhooks:** Integrate with any third-party system

---

## 2. Target Users & Personas

### 2.1 Primary Personas

| Persona | Role | Pain Points | What They Need |
|---------|------|-------------|----------------|
| **HR Admin (Admin)** | System administrator, HR department head | Managing data across spreadsheets, manual payroll, compliance risks | Centralized dashboard, automated payroll, compliance tracking, audit logs |
| **HR Manager** | Day-to-day HR operations | Time-consuming onboarding, tracking performance reviews, managing leave approvals | Automated workflows, leave management, performance tracking, recruitment pipeline |
| **Department Manager** | Team lead, middle management | Visibility into team attendance, performance, budget | Team dashboard, approval workflows, KPI tracking, reporting |
| **Employee** | General staff | Can't access own records, manual leave requests, unclear payslip details | Self-service portal, mobile check-in, payslip viewer, training enrollment |
| **Recruiter** | Talent acquisition team | Disorganized applicant tracking, slow hiring cycles | ATS pipeline, job posting distribution, interview scheduling, scorecards |
| **Executive (C-level)** | CEO, CFO, COO | Lack of real-time workforce insights, budget overruns | Executive dashboard, workforce analytics, cost-per-hire, attrition reports |

### 2.2 Company Size Target

- **Sweet spot:** 50–5,000 employees
- **Industries:** Technology, manufacturing, retail, professional services, healthcare
- **Geography:** Initially Vietnam/SEA market, then expand globally (multi-language, multi-currency support)

---

## 3. Competitor Analysis

### 3.1 Competitor Comparison Matrix

| Feature | BambooHR | Workday | SAP SuccessFactors | Zoho People | Gusto | **PeopleHub (Target)** |
|---------|----------|---------|---------------------|-------------|-------|------------------------|
| Employee Management | Yes | Yes | Yes | Yes | Yes | Yes |
| Time & Attendance | Basic | Yes | Yes | Yes | Limited | Yes (advanced) |
| Payroll | US only | Yes | Yes | Regional | US/UK only | Yes (multi-region) |
| Performance Mgmt | Yes | Yes | Yes | Basic | No | Yes (KPI + OKR) |
| Recruitment/ATS | Basic | Yes | Yes | No | No | Yes (full ATS) |
| Training/LMS | No | Yes | Yes | No | No | Yes (built-in LMS) |
| AI/Analytics | Basic | Advanced | Advanced | Basic | Basic | Yes (AI-driven) |
| Mobile App | Yes | Yes | Yes | Yes | No | Yes |
| Open API | Yes | Yes | Yes | Yes | Yes | Yes |
| Pricing | $8-12/emp/mo | Custom ($20+) | Custom ($15+) | $3-5/emp/mo | $6+/emp/mo | $4-10/emp/mo |
| Best For | SMB (50-200) | Enterprise (1000+) | Enterprise (500+) | SMB (10-200) | US SMB payroll | Mid-market (50-5000) |

### 3.2 Deep Dive per Competitor

#### BambooHR
- **Strengths:** Excellent UX, great for SMBs, strong employee self-service, good culture tools
- **Weaknesses:** Limited payroll (US only), no built-in LMS, basic recruitment, expensive at scale
- **Our Opportunity:** Offer broader payroll, built-in training, advanced ATS at lower price

#### Workday
- **Strengths:** Enterprise-grade, comprehensive HCM, powerful analytics, strong compliance
- **Weaknesses:** Extremely expensive, complex implementation, overkill for mid-market, long onboarding
- **Our Opportunity:** Provide 80% of Workday features at 30% of the cost, faster setup

#### SAP SuccessFactors
- **Strengths:** Deep HR functionality, global compliance, strong performance management
- **Weaknesses:** Complex UI, expensive, requires consultants, slow innovation cycle
- **Our Opportunity:** Modern, intuitive UI, faster deployment, AI-native features

#### Zoho People
- **Strengths:** Affordable, integrates with Zoho ecosystem, good for small teams
- **Weaknesses:** Limited advanced features, basic analytics, no ATS, clunky UI
- **Our Opportunity:** Superior UX, full ATS + LMS, better analytics, still affordable

#### Gusto
- **Strengths:** Excellent payroll for US SMBs, simple setup, good integrations
- **Weaknesses:** US-only payroll, no performance management, no ATS, limited HR features
- **Our Opportunity:** Global payroll, comprehensive HR suite, not just payroll-focused

### 3.3 Market Gap Analysis

**What competitors collectively lack:**
1. **AI-native HR platform** — Most use AI as an afterthought; we build AI-first (predictive attrition, smart matching for recruitment, payroll anomaly detection)
2. **True mid-market focus** — Gap between cheap SMB tools and expensive enterprise suites
3. **Regional compliance** — Most focus on US/EU; we target SEA/APAC with local tax and labor law support
4. **All-in-one at fair price** — Competitors force you to buy add-ons; we include everything in base plan
5. **Developer-friendly** — Better API, webhooks, and webhook-based integrations than most competitors

---

## 4. Feature List (Organized by Module)

### Module 1: Employee Management
- [ ] Employee profiles (personal info, emergency contacts, bank details, documents)
- [ ] Employee document management (upload, store, version control, expiry alerts)
- [ ] Employment contracts (create, track, renew, archive)
- [ ] Employee lifecycle tracking (onboarding → active → offboarding)
- [ ] Employee directory with search and filters
- [ ] Custom fields and profile templates
- [ ] Employee self-service portal (update personal info, view documents)
- [ ] Bulk import/export (CSV, Excel)
- [ ] Organizational chart (interactive, auto-generated from hierarchy)
- [ ] Employee tags and custom categories

### Module 2: Attendance & Time Tracking
- [ ] Check-in/check-out (web, mobile app, kiosk mode, GPS-based)
- [ ] Shift management (create, assign, rotate)
- [ ] Leave management (apply, approve, reject, cancel)
- [ ] Leave types & policies (annual, sick, maternity, unpaid, custom)
- [ ] Leave balance tracking and accrual rules
- [ ] Overtime tracking and approval workflow
- [ ] Attendance reports (daily, weekly, monthly, custom)
- [ ] Holiday calendar management (company-wide, per department, per region)
- [ ] Late arrival and early departure tracking
- [ ] Biometric/hardware integration support (fingerprint, face recognition)
- [ ] Geofencing for remote check-in

### Module 3: Payroll Management
- [ ] Salary structure configuration (base, allowances, deductions, bonuses)
- [ ] Automated salary calculation (gross, net, tax, social insurance)
- [ ] Tax calculation (configurable per region/country)
- [ ] Deductions management (insurance, loan, advance salary, union dues)
- [ ] Bonus and commission management
- [ ] Payslip generation and distribution (PDF, email, portal)
- [ ] Payroll run scheduling and approval workflow
- [ ] Bank file generation for direct deposit
- [ ] Payroll history and audit trail
- [ ] Year-end tax reporting (W-2, PIT, etc.)
- [ ] Multi-currency payroll support
- [ ] Payroll anomaly detection (AI-powered)

### Module 4: Performance Management
- [ ] KPI framework (create, assign, track KPIs per role/department)
- [ ] OKR support (objectives and key results)
- [ ] Performance review cycles (quarterly, annual, custom)
- [ ] 360-degree feedback (peer, manager, self, subordinate)
- [ ] Goal setting and tracking
- [ ] Performance rating scales (configurable)
- [ ] Performance improvement plans (PIP)
- [ ] Competency framework and assessment
- [ ] Performance analytics and trend reports
- [ ] Calibration sessions for manager alignment
- [ ] Integration with compensation (merit increases, bonuses)

### Module 5: Recruitment & Onboarding (ATS)
- [ ] Job posting creation and management
- [ ] Multi-channel job distribution (company site, LinkedIn, Indeed, etc.)
- [ ] Applicant tracking pipeline (kanban-style board)
- [ ] Resume parsing and AI matching
- [ ] Candidate scoring and evaluation
- [ ] Interview scheduling (calendar integration)
- [ ] Interview scorecards and feedback forms
- [ ] Offer letter generation and e-signature
- [ ] Rejection communication templates
- [ ] Talent pool/database for future hiring
- [ ] Referral management
- [ ] Onboarding checklist and workflow
- [ ] New hire welcome portal
- [ ] Equipment and access provisioning tracking

### Module 6: Training & Development (LMS)
- [ ] Course creation and management
- [ ] Training calendar and scheduling
- [ ] Enrollment management (self-enroll, auto-assign)
- [ ] Course progress tracking and completion certificates
- [ ] Certification management (expiry alerts, renewal reminders)
- [ ] Skills tracking and gap analysis
- [ ] Training budget tracking
- [ ] External training registration and reimbursement
- [ ] Training feedback and evaluation forms
- [ ] Learning path recommendations (AI-powered)
- [ ] SCORM/xAPI content support
- [ ] Video and document-based learning materials

### Module 7: Organization Management
- [ ] Department and division management
- [ ] Position/job title management
- [ ] Reporting hierarchy and manager assignments
- [ ] Cost center and budget allocation
- [ ] Company policies and handbook management
- [ ] Branch/location management
- [ ] Team and group management
- [ ] Headcount planning and forecasting
- [ ] Organizational restructuring tools
- [ ] Succession planning

### Module 8: Reports & Analytics
- [ ] Executive dashboard (KPIs, headcount, attrition, cost metrics)
- [ ] HR dashboard (open positions, leave trends, training completion)
- [ ] Custom report builder (drag-and-drop, SQL-like filters)
- [ ] Pre-built report templates (50+ templates)
- [ ] Scheduled report delivery (email, PDF, Excel)
- [ ] Export to CSV, Excel, PDF
- [ ] Visual analytics (charts, graphs, heatmaps)
- [ ] Predictive analytics (attrition risk, hiring timeline)
- [ ] Benchmarking (industry averages, historical comparison)
- [ ] Audit log and compliance reports

### Module 9: Role-Based Access Control (RBAC)
- [ ] Pre-built roles: Admin, HR Manager, Department Manager, Employee, Recruiter
- [ ] Custom role creation with granular permissions
- [ ] Permission matrix (view, create, edit, delete, approve per module)
- [ ] Data-level permissions (own data, team data, department data, all data)
- [ ] Field-level permissions (hide salary, SSN, etc. from certain roles)
- [ ] Temporary access grants (time-limited permissions)
- [ ] IP-based access restrictions (optional)
- [ ] Two-factor authentication (2FA)
- [ ] Single Sign-On (SSO) via SAML/OIDC
- [ ] Session management and device tracking

### Module 10: Notifications & Alerts
- [ ] In-app notification center
- [ ] Email notifications (configurable templates)
- [ ] Push notifications (mobile app)
- [ ] SMS notifications (optional, configurable)
- [ ] Slack/Teams integration for notifications
- [ ] Notification preferences per user
- [ ] Automated alerts:
  - Leave request submitted/approved/rejected
  - Payroll processed
  - Contract expiry (30/15/7 days before)
  - Document expiry
  - Birthday and work anniversary
  - Performance review due
  - Training enrollment and completion
  - Probation period ending
  - Overtime threshold exceeded
- [ ] Digest mode (daily/weekly summary)

### Module 11: Admin Panel & System Configuration
- [ ] Company settings (name, logo, timezone, language, currency)
- [ ] System configuration (features on/off, defaults)
- [ ] Email/SMTP configuration
- [ ] Backup and restore management
- [ ] System health monitoring
- [ ] License and subscription management
- [ ] API key management and usage monitoring
- [ ] Webhook management
- [ ] Integration marketplace (connectors for Slack, Teams, accounting tools)
- [ ] Data import/export tools
- [ ] System audit logs
- [ ] Feature flags and beta toggles
- [ ] Custom branding (white-label option for enterprise)

### Module 12: Mobile Application
- [ ] iOS and Android native apps
- [ ] Mobile check-in/check-out with GPS
- [ ] Leave request and approval
- [ ] Payslip viewer
- [ ] Company directory
- [ ] Push notifications
- [ ] Training course access
- [ ] Profile management
- [ ] Offline mode for attendance

---

## 5. Differentiation Strategy

### 5.1 AI-First Approach
- **Predictive Attrition Model:** AI analyzes patterns (attendance, engagement, salary competitiveness, tenure) to flag flight-risk employees
- **Smart Recruitment Matching:** AI scores applicants against job requirements using NLP on resumes and job descriptions
- **Payroll Anomaly Detection:** AI flags unusual payroll runs (unexpected overtime spikes, duplicate payments)
- **Personalized Learning Paths:** AI recommends training based on skill gaps, career goals, and performance data

### 5.2 Speed to Value
- **Setup in hours, not weeks:** Guided onboarding wizard, pre-built templates, import from existing systems
- **No consultants required:** Self-serve setup for all core features
- **Sandbox environment:** Test configurations before going live

### 5.3 Regional Compliance Focus
- **Built-in compliance templates** for Vietnam, Thailand, Indonesia, Philippines, Malaysia
- **Auto-updating tax rules** per jurisdiction
- **Labor law alerts** when regulations change

### 5.4 Transparent, Fair Pricing
- **All features included** — no paywalling core HR features
- **Per-employee pricing** with volume discounts
- **No hidden costs** — support, updates, and storage included
- **Free tier** for companies with up to 10 employees

### 5.5 Developer-First
- **RESTful API** with comprehensive documentation
- **Webhooks** for real-time event streaming
- **SDKs** for Python, JavaScript, PHP
- **GraphQL** support for complex queries

---

## 6. Monetization Model

### 6.1 Pricing Tiers

| Tier | Price | Target | Features |
|------|-------|--------|----------|
| **Free** | $0 | Startups (≤10 employees) | Employee mgmt, attendance, basic leave, self-service portal |
| **Starter** | $4/employee/month | Small businesses (10-100 employees) | Free tier + payroll, basic reporting, email notifications |
| **Professional** | $7/employee/month | Mid-market (50-500 employees) | Starter + ATS, performance mgmt, LMS, custom reports, API |
| **Enterprise** | $10/employee/month | Large (500-5000 employees) | Professional + AI analytics, SSO, custom branding, dedicated support |

### 6.2 Revenue Streams
1. **Subscription fees** (primary) — monthly/annual billing
2. **Implementation services** (one-time) — data migration, custom setup ($500-5,000)
3. **Premium integrations** — advanced connectors (SAP, Oracle, custom ERP)
4. **Compliance add-ons** — region-specific legal compliance packs
5. **Marketplace revenue share** — third-party apps and integrations

### 6.3 Cost Structure
- Cloud infrastructure (AWS/GCP): ~15-20% of revenue
- Development & maintenance: ~40-50% of revenue
- Sales & marketing: ~20-25% of revenue
- Support & customer success: ~10-15% of revenue

---

## 7. Success Metrics

### 7.1 Product Metrics
| Metric | Target (Year 1) | Target (Year 2) | Target (Year 3) |
|--------|-----------------|-----------------|-----------------|
| Active companies | 500 | 2,000 | 5,000 |
| Total employees managed | 25,000 | 150,000 | 500,000 |
| Monthly active users (MAU) | 15,000 | 100,000 | 350,000 |
| Feature adoption rate | >60% | >70% | >80% |
| System uptime | 99.9% | 99.95% | 99.99% |
| API response time (p95) | <500ms | <300ms | <200ms |

### 7.2 Business Metrics
| Metric | Target (Year 1) | Target (Year 2) | Target (Year 3) |
|--------|-----------------|-----------------|-----------------|
| Annual recurring revenue (ARR) | $500K | $3M | $10M |
| Net revenue retention | >90% | >100% | >110% |
| Customer acquisition cost (CAC) | <$500 | <$400 | <$300 |
| Lifetime value (LTV) | >$3,000 | >$5,000 | >$8,000 |
| LTV:CAC ratio | >6:1 | >10:1 | >15:1 |
| Monthly churn | <3% | <2% | <1.5% |

### 7.3 User Satisfaction Metrics
| Metric | Target |
|--------|--------|
| Net Promoter Score (NPS) | >50 |
| Customer satisfaction (CSAT) | >4.5/5 |
| Time to first value (setup to first payroll) | <48 hours |
| Support ticket resolution time | <4 hours (P1), <24 hours (P2) |
| App store rating | >4.5 stars |

---

## 8. Technical Architecture Overview (High-Level)

- **Frontend:** React + TypeScript + TailwindCSS (web), React Native (mobile)
- **Backend:** NestJS (Node.js) with microservices architecture
- **Database:** PostgreSQL (relational data), Redis (caching, sessions)
- **Search:** Elasticsearch (employee search, candidate search)
- **File Storage:** S3-compatible object storage
- **Message Queue:** RabbitMQ/Redis for async jobs (payroll runs, email sending)
- **AI/ML:** Python microservice for predictive analytics, NLP
- **Infrastructure:** Docker + Kubernetes, CI/CD via GitHub Actions
- **Monitoring:** Prometheus + Grafana, Sentry for error tracking

---

## 9. Roadmap (High-Level)

### Phase 1 — MVP (Months 1-3)
- Employee management (profiles, documents, directory)
- Organization management (departments, positions, hierarchy)
- Attendance & time tracking (check-in/out, leave management)
- Basic payroll (salary calculation, payslips)
- Role-based access control (4 roles)
- Employee self-service portal
- Admin panel (basic configuration)

### Phase 2 — Core Features (Months 4-6)
- Full payroll (tax, deductions, bonuses, bank files)
- Performance management (KPIs, reviews, goals)
- Recruitment & ATS (pipeline, job postings, interviews)
- Notifications & alerts (email, in-app)
- Reports & analytics (dashboards, exports)
- Mobile app (basic)

### Phase 3 — Advanced Features (Months 7-9)
- Training & Development (LMS, courses, certifications)
- AI features (attrition prediction, smart matching)
- Advanced analytics (custom reports, predictive)
- SSO and 2FA
- API and webhooks
- Integrations (Slack, Teams, accounting)

### Phase 4 — Scale & Polish (Months 10-12)
- Multi-language and multi-currency
- Regional compliance packs
- Advanced mobile app (GPS, offline mode)
- Performance optimization
- White-label/enterprise branding
- Marketplace launch

---

## 10. Risks & Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Data breach / security incident | Critical | Low | Encryption at rest/in transit, regular audits, SOC 2 compliance, bug bounty |
| Low adoption / poor UX | High | Medium | User testing at each sprint, design system, progressive disclosure |
| Payroll calculation errors | Critical | Low | Automated testing, dual-calculation verification, audit trail, manual override |
| Competitor price war | Medium | High | Focus on differentiation (AI, UX), not price; build switching costs |
| Regulatory changes | High | Medium | Modular compliance system, legal advisory board, rapid update cycle |
| Integration complexity | Medium | Medium | API-first design, pre-built connectors, developer documentation |
| Scalability limits | Medium | Low | Cloud-native architecture, auto-scaling, load testing before launch |

---

*Document Version: 1.0*  
*Created: April 2026*  
*Author: CEO — AGENT-TEAM*  
*Status: Approved for Phase 0 execution*
