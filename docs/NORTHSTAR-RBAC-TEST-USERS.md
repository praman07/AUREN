# Northstar Technologies Enterprise RBAC Test User Guide

This document provides a complete guide for manually logging into the AUREN web application frontend to test and verify multi-tenant document retrieval, role-based access control (RBAC), departmental isolation, explicit deny rules, and super-admin privileges.

---

## 🔑 Master Test Credentials

> **Common Password for ALL Accounts**: `NorthstarTest@2026!`

---

## 🏢 1. Account Directory

| Name | Email Address | Password | Organization | Department | Role | Special Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Arjun Mehta** | `arjun.mehta@northstar-test.local` | `NorthstarTest@2026!` | Northstar Technologies | Executive | CEO | - |
| **Vikram Sharma** | `vikram.sharma@northstar-test.local` | `NorthstarTest@2026!` | Northstar Technologies | Executive | CTO | - |
| **Neha Kapoor** | `neha.kapoor@northstar-test.local` | `NorthstarTest@2026!` | Northstar Technologies | Executive | CFO | - |
| **Rahul Verma** | `rahul.verma@northstar-test.local` | `NorthstarTest@2026!` | Northstar Technologies | Engineering | Engineering Manager | - |
| **Ananya Singh** | `ananya.singh@northstar-test.local` | `NorthstarTest@2026!` | Northstar Technologies | Engineering | Senior Backend Engineer | - |
| **Karan Arora** | `karan.arora@northstar-test.local` | `NorthstarTest@2026!` | Northstar Technologies | Engineering | Senior Frontend Engineer | - |
| **Aditya Jain** | `aditya.jain@northstar-test.local` | `NorthstarTest@2026!` | Northstar Technologies | Engineering | Backend Engineer | - |
| **Riya Gupta** | `riya.gupta@northstar-test.local` | `NorthstarTest@2026!` | Northstar Technologies | Engineering | Junior Developer | Explicit Deny Target |
| **Manish Kumar** | `manish.kumar@northstar-test.local` | `NorthstarTest@2026!` | Northstar Technologies | Engineering | DevOps | - |
| **Simran Kaur** | `simran.kaur@northstar-test.local` | `NorthstarTest@2026!` | Northstar Technologies | Product | Product Manager | - |
| **Harsh Patel** | `harsh.patel@northstar-test.local` | `NorthstarTest@2026!` | Northstar Technologies | Product | Product Analyst | - |
| **Meera Joshi** | `meera.joshi@northstar-test.local` | `NorthstarTest@2026!` | Northstar Technologies | Human Resources | HR Director | - |
| **Nisha Sethi** | `nisha.sethi@northstar-test.local` | `NorthstarTest@2026!` | Northstar Technologies | Human Resources | HR Manager | - |
| **Amit Khanna** | `amit.khanna@northstar-test.local` | `NorthstarTest@2026!` | Northstar Technologies | Finance | Finance Manager | - |
| **Tanya Mehra** | `tanya.mehra@northstar-test.local` | `NorthstarTest@2026!` | Northstar Technologies | Finance | Senior Accountant | - |
| **Saurabh Kapoor** | `saurabh.kapoor@northstar-test.local` | `NorthstarTest@2026!` | Northstar Technologies | Sales | Sales Director | - |
| **Deepak Arora** | `deepak.arora@northstar-test.local` | `NorthstarTest@2026!` | Northstar Technologies | Sales | Account Executive | - |
| **Ishita Verma** | `ishita.verma@northstar-test.local` | `NorthstarTest@2026!` | Northstar Technologies | Marketing | Marketing Manager | - |
| **Kavya Malhotra** | `kavya.malhotra@northstar-test.local` | `NorthstarTest@2026!` | Northstar Technologies | Legal | Legal Counsel | - |
| **Admin Tester** | `superadmin@northstar-test.local` | `NorthstarTest@2026!` | Northstar Technologies | Executive | Super Admin | `isSuperAdmin = true` |
| **Varun Shah** | `varun.shah@bluepeak-test.local` | `NorthstarTest@2026!` | BluePeak Systems | Engineering | Engineering Lead | Tenant B |
| **Maya Rao** | `maya.rao@bluepeak-test.local` | `NorthstarTest@2026!` | BluePeak Systems | Human Resources | HR Manager | Tenant B |
| **Rohan Gupta** | `rohan.gupta@bluepeak-test.local` | `NorthstarTest@2026!` | BluePeak Systems | Finance | Finance Manager | Tenant B |
| **BluePeak Admin** | `superadmin@bluepeak-test.local` | `NorthstarTest@2026!` | BluePeak Systems | Executive | Super Admin | Tenant B Super Admin |

---

## 📄 2. Document Access Matrix & Verification Scenarios

### Scenario A: Cross-Tenant Isolation (Northstar vs. BluePeak)
- **Question**: `"When is our engineering deployment window?"`
- **Northstar User** (`rahul.verma@northstar-test.local`):
  - **Expected Answer**: `"Tuesday at 22:00 IST"`
  - **Citations**: `Northstar Production Deployment Runbook`
- **BluePeak User** (`varun.shah@bluepeak-test.local`):
  - **Expected Answer**: `"Thursday at 21:00 IST"`
  - **Citations**: `BluePeak Engineering Standards & Deployment Window`
- **Security Check**: Neither user should ever see or receive citations for the other company's deployment window!

---

### Scenario B: Departmental Boundaries (Finance vs. Engineering)
- **Question**: `"What are the expense approval thresholds?"`
- **Finance User** (`amit.khanna@northstar-test.local`):
  - **Expected Answer**: `"Expenses above ₹25,000 require Finance Manager approval. Expenses above ₹1,00,000 require CFO approval."`
  - **Citations**: `Northstar Finance Operations Manual`
- **Engineering User** (`aditya.jain@northstar-test.local`):
  - **Expected Answer**: System indicates no authorized finance documents found, or answers only from general ORG_WIDE employee policy (`₹25,000` manual content is hidden).

---

### Scenario C: Explicit Deny Override (`deniedUsers`)
- **Question**: `"What are the details of our engineering security architecture and zero-trust network?"`
- **Senior Backend Eng** (`ananya.singh@northstar-test.local`):
  - **Expected Answer**: Returns zero-trust network topology details from `Engineering Security Architecture`.
- **Junior Dev (Denied User)** (`riya.gupta@northstar-test.local`):
  - **Expected Answer**: Access denied / Information unavailable in authorized context.

---

### Scenario D: Explicit User Grant (`allowedUsers`)
- **Question**: `"What is the Q4 financial forecast and revenue projection?"`
- **CTO (Explicitly Allowed)** (`vikram.sharma@northstar-test.local`):
  - **Expected Answer**: Retrieves revenue projections and gross margin targets from `Finance Executive Forecast`.
- **Senior Frontend Eng (Not Allowed)** (`karan.arora@northstar-test.local`):
  - **Expected Answer**: Information unavailable.

---

### Scenario E: Private Document Ownership
- **Question**: `"What were the key achievements in my performance review?"`
- **Rahul Verma (Owner)** (`rahul.verma@northstar-test.local`):
  - **Expected Answer**: Exceeded engineering milestones in H1 2026, leading core API refactoring.
- **Ananya Singh (Non-Owner)** (`ananya.singh@northstar-test.local`):
  - **Expected Answer**: Information unavailable / 0 authorized chunks.

---

### Scenario F: Super Admin Boundaries
- **Question**: `"What is BluePeak Systems' deployment window?"`
- **Northstar Super Admin** (`superadmin@northstar-test.local`):
  - **Expected Answer**: Information unavailable. Super Admin privileges grant access to all documents *within* Northstar, but NEVER cross tenant boundaries into BluePeak Systems!

---

## 🧪 3. Step-by-Step UI Verification Procedure

1. **Open AUREN Web Client** in your web browser.
2. Log out if currently logged in.
3. Log in as **Rahul Verma** (`rahul.verma@northstar-test.local` / `NorthstarTest@2026!`).
4. Ask: `"When is our engineering deployment window?"`
   - Verify answer references **Tuesday at 22:00 IST**.
5. Log out and log in as **Varun Shah** (`varun.shah@bluepeak-test.local` / `NorthstarTest@2026!`).
6. Ask: `"When is our engineering deployment window?"`
   - Verify answer references **Thursday at 21:00 IST**.
7. Log out and log in as **Riya Gupta** (`riya.gupta@northstar-test.local` / `NorthstarTest@2026!`).
8. Ask: `"What are the details of our engineering security architecture?"`
   - Verify access is denied and 0 citations are returned.
