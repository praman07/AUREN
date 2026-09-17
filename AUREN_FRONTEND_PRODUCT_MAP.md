# AUREN FRONTEND PRODUCT MAP & SURFACE INVENTORY

> **Audit Mode:** Read-Only Codebase Inspection  
> **Date:** September 8, 2026  
> **Target:** Complete product inventory for AUREN UI/UX Redesign  

---

## 1. Route Map

| Route | Page / Component | Purpose | Access Control | Scope | Major Actions | Data Displayed | Loading / Empty / Error / Realtime | Status |
|---|---|---|---|---|---|---|---|---|
| `/login` | `LoginForm.tsx` | User authentication via email/password or Clerk | Public (Unauthenticated) | Global | Login submit, toggle auth provider, navigate to signup/forgot-password | Email/password fields, Clerk login button, liquid glass background | Spinner loading, error toast on invalid credentials | **Functional** |
| `/signup` | `SignUpForm.tsx` | User registration & account creation | Public (Unauthenticated) | Global | Register user, input organization name/domain | Name, email, password, org name fields | Submit loading state, error alert on duplicate email | **Functional** |
| `/forgot-password` | `LoginForm.tsx` | Password recovery | Public (Unauthenticated) | Global | Request reset link | Email input field | Toast feedback | **Partial** |
| `/onboarding` | `OnboardingPage.tsx` | First-time organization setup & industry template selection | Authenticated | Organization | Select industry (Corporate, Hospital, Legal, VC), save workspace settings | Industry template cards, organization profile inputs | Step transition loading, success redirect to `/dashboard` | **Functional** |
| `/dashboard` | `DashboardPage.tsx` | High-level workspace activity, storage stats & recent knowledge | Authenticated | Workspace / Org | Quick search, quick chat prompt, navigation shortcuts | Total documents, storage used, active connectors, recent queries, recent document list | Skeleton loaders, zero-data empty state cards, polling metrics | **Functional** |
| `/documents` | `DocumentsPage.tsx` | Knowledge catalog root (redirects to `/documents/org`) | Authenticated | Org / Personal | Redirect | N/A | Instant redirect | **Functional** |
| `/documents/:scopeRoute` | `DocumentsPage.tsx` | Primary document catalog by scope (`all`, `org`, `personal`, `dept`) | Authenticated | Multi-Scope | Upload file, delete, reprocess, view details, search, filter by scope/dept | Document table (title, scope, owner, dept, status, size, date), filter dropdowns, search bar | Shimmer table loading, zero-document empty state, refetching toast feedback | **Functional** |
| `/search` | `SearchPage.tsx` | Universal hybrid search interface | Authenticated | Workspace / Org | Multi-modal search query, scope filter, click result to open preview | Search input, hybrid match rank cards, relevance score breakdown, document snippet preview | Shimmer result cards, "No matching documents found" empty state | **Functional** |
| `/chat` | `ChatPage.tsx` | AUREN AI Conversational Assistant | Authenticated | Multi-Scope | Send prompt, toggle Knowledge Base, toggle Web Search, view citations, manage memory | Streaming message bubbles, source cards, scope indicators, conversation history list | Typing indicator, SSE streaming tokens, connection error alert | **Functional** |
| `/settings` | `SettingsPage.tsx` | Integrations, RBAC policies & workspace configuration | Authenticated | Workspace | Connect data sources, edit RBAC policies, manage connector access controls | Connector cards, RBAC policy table, workspace preferences form | Tab transition spinner, modal loading states | **Functional** |
| `/integrations` | `SettingsPage.tsx` | Direct shortcut to Data Connectors tab | Authenticated | Workspace | Same as `/settings?tab=connectors` | Connector list | Tab loading | **Functional** |
| `/memory` | `MemoryConsolePage.tsx` | SuperAdmin User Long-Term Memory console | SuperAdmin Only | SuperAdmin | View user memory key-values, delete memory entry | User memory table, user selector, memory key-value pair cards | Table spinner, empty memory state | **Functional** |
| `/organizations` | `OrganizationsPage.tsx` | Multi-Tenant Organization management | SuperAdmin Only | SuperAdmin | Create org, toggle web access policy, update industry template | Organization list, domain list, member counts | Shimmer loading | **Functional** |
| `/users` | `UsersPage.tsx` | Organization User & Role assignment management | SuperAdmin Only | SuperAdmin | Invite user, assign role, assign department, toggle SuperAdmin status | User table (name, email, role, department, status), edit drawer | User table loading state | **Functional** |
| `/departments` | `DepartmentsSecurityPage.tsx` | Department creation & security boundary management | SuperAdmin Only | SuperAdmin | Create department, set security classification defaults | Department list, security level badges, member counts | Loading cards | **Functional** |
| `/audit-logs` | `AuditLogsPage.tsx` | Enterprise Zero-Trust Audit log viewer | SuperAdmin Only | SuperAdmin | Filter audit logs by user/action/date, export logs | Audit log table (timestamp, user, IP, action, resource, status) | Realtime audit stream / polling | **Functional** |
| `/jobs` | `ProcessingJobsPage.tsx` | Background document processing job monitor | SuperAdmin Only | SuperAdmin | Retry failed ingestion job, view error trace | Job queue list (job ID, document, step, status, duration, error trace) | Polling job status updates | **Functional** |

---

## 2. Authentication & Account Inventory

- **Login (`/login`)**:
  - **UI**: High-end glassmorphism card over dynamic `LiquidGlassShader.tsx` webgl backdrop. Toggle between Clerk OAuth and local JWT credentials mode.
  - **Backend**: Calls `POST /api/v1/auth/login`. Returns JWT bearer token stored in `localStorage` and `useAuthStore`.
  - **States**: `IS_SUBMITTING` button spinner, error toast on bad password.

- **Signup (`/signup`)**:
  - **UI**: Multi-input form (First Name, Last Name, Email, Password, Organization Name).
  - **Backend**: Calls `POST /api/v1/auth/register`.

- **Onboarding (`/onboarding`)**:
  - **UI**: Stepped wizard allowing administrators to select industry templates (`CORPORATE`, `HOSPITAL`, `LEGAL`, `VENTURE_CAPITAL`).
  - **Backend**: Updates Organization industry setting via `/api/v1/organizations/onboarding`.

- **Session & Identity Management**:
  - `EnterpriseAuthProvider.tsx` wraps the entire React app tree.
  - Intercepts HTTP 401 response codes and redirects unauthenticated users to `/login`.
  - User identity (`id`, `email`, `roles`, `departments`, `organizationId`, `isSuperAdmin`) managed via `useAuthStore` (Zustand).

---

## 3. Personal User Experience

AUREN provides strict logically isolated personal spaces:

- **Personal Knowledge Space (`/documents/personal`)**:
  - Documents uploaded with `scope: PERSONAL` and `visibility: PRIVATE`.
  - Strictly owned by `userId`.
  - Vector filtering in Qdrant enforces `ownerId == userId` via `PermissionFilter.ts`.

- **Personal Source Cards in Chat**:
  - When retrieved during RAG, personal documents display a distinct `PERSONAL` scope badge on source cards.

- **Personal Data Flow**:
  1. User selects "Personal Knowledge" tab or uploads file inside Personal section.
  2. Document record saved with `scope: PERSONAL` and `ownerId: user.id`.
  3. Processing job embeds document chunks into organization Qdrant collection with payload `ownerId: user.id` and `scope: PERSONAL`.
  4. RAG queries issued by other users are filtered out at the Qdrant query level (`PermissionFilter.ts` excludes `PERSONAL` chunks not belonging to `request.userId`).

---

## 4. Organization Experience

- **Organization Knowledge (`/documents/org`)**:
  - Shared knowledge base accessible to team members based on RBAC and ACL permissions.

- **Departments (`/departments`)**:
  - Structural units (e.g. Executive, Engineering, HR, Finance, Legal, Sales).
  - Documents assigned to a department are readable only by users belonging to that department unless marked `ORG_WIDE`.

- **Roles & Permissions (`/users`, `/settings?tab=rbac`)**:
  - System roles (`Super Admin`, `CEO`, `CTO`, `Engineering Manager`, `Senior Backend Engineer`, `HR Director`, etc.).
  - Resource access policies evaluated dynamically without service restarts.

---

## 5. Knowledge Experience & Workflow

### Document User Journey:
```
UPLOAD ──► PROCESSING ──► READY ──► HYBRID SEARCH / RAG QUERY ──► SOURCE CARD ──► DRAWER VIEW
```

- **Upload Component**: `UploadDialog.tsx` & `DropzoneArea.tsx`
  - Drag-and-drop file upload.
  - Supports PDF, TXT, MD, DOCX, CSV.
  - Sets scope (`ORGANIZATION`, `PERSONAL`, `DEPARTMENT`).

- **Processing State Monitor**: `UploadQueue.tsx` & `ProcessingJobsPage.tsx`
  - Statuses shown: `PENDING`, `PARSING`, `EMBEDDING`, `INDEXING`, `READY`, `FAILED`.

- **Document Details Drawer (`DocumentDetailsDrawer.tsx`)**:
  - **Overview**: Title, MIME type, size, owner, creation date, classification.
  - **Permissions**: Allowed/Denied users, roles, departments.
  - **Version History**: File hashes, S3 keys, version numbers.
  - **Chunk Inspector**: Individual text chunks and vector embedding status.

---

## 6. Chat & AUREN Assistant Experience

- **Chat Interface (`/chat`)**:
  - **Empty Chat State**: Prompt suggestion chips ("Summarize our leave policy", "What are our engineering guidelines?", "Search web for NVIDIA news").
  - **Composer (`ChatInput.tsx`)**: Text input, Knowledge Base toggle switch, Web Search toggle switch, send button.
  - **Message Stream (`MessageBubble.tsx`)**: Realtime server-sent events (`data: {...}`).
  - **Intent Badges**: `CASUAL` (0 sources), `INTERNAL_KNOWLEDGE` (RAG source cards), `EXTERNAL_WEB` (SearXNG citations), `DOC_CATALOG_BROWSE`.

---

## 7. Data Connectors Inventory

| Connector | Type | Capability | Connection Flow | Sync Mechanism | Status |
|---|---|---|---|---|---|
| **GitHub** | `GITHUB` | Organization & Personal repos | OAuth Redirect -> Repo Selection Modal | Webhook auto-sync + manual re-sync | **Functional** |
| **Google Drive** | `GOOGLE_DRIVE` | Files, Docs, Sheets | Google OAuth2 consent flow | Polling / manual sync | **Functional** |
| **Gmail** | `GMAIL` | Team emails & threads | Google OAuth2 consent flow | Polling / manual sync | **Functional** |
| **Notion** | `NOTION` | Workspace wikis & databases | Integration Token | Polling sync | **Partial** |
| **Slack** | `SLACK` | Channel conversations & files | Slack Bot Token / OAuth | Webhook stream | **Partial** |

---

## 8. GitHub Connector Complete UX

1. **Connect**: User clicks "Connect GitHub" in `/settings?tab=connectors`.
2. **OAuth**: Redirects to GitHub OAuth consent page.
3. **Callback**: Returns with OAuth code to `/api/v1/connectors/github/callback`.
4. **Repository Selection Modal (`GitHubRepoPickerModal.tsx`)**:
   - Searches user's GitHub repositories via API.
   - User checks desired repositories for indexing.
5. **Sync**: Ingestion pipeline parses code, commits, issues, and README files.
6. **Live Auto-Sync**: GitHub webhook receives push/create/delete events and automatically updates Qdrant vectors.

---

## 9. Connector Access Control & RBAC UI

- **Modal Component**: `ConnectorPolicyModal.tsx`
- **Capabilities**:
  - Configure explicit `Allowed Users`, `Denied Users`, `Allowed Roles`, `Denied Roles`, `Allowed Departments`, `Denied Departments`.
  - Enforces Zero-Trust isolation so connecting a repository does not automatically expose it to unauthorized departments.

---

## 10. People / RBAC Management

- **Users List (`/users`)**: Table with user details, role pills, department tags, and status badges.
- **Departments & Security (`/departments`)**: Security boundary configuration per department.
- **RBAC Policy Manager (`RBACPolicyManager.tsx`)**: Centralized access policy rule builder.

---

## 11. Admin & SuperAdmin Surfaces

SuperAdmin users have access to dedicated administrative management surfaces:
- **Organizations (`/organizations`)**: Multi-tenant workspace management.
- **Audit Logs (`/audit-logs`)**: Complete Zero-Trust immutable audit record viewer.
- **Processing Jobs (`/jobs`)**: Background ingestion job monitoring & retry controls.
- **Memory Console (`/memory`)**: Inspection of user long-term memories.

---

## 12. Settings Navigation Structure

The Settings page (`/settings`) contains 3 primary tabs:
1. **Data Connectors (`ConnectorsList.tsx`)**: Active integration cards, OAuth connect buttons, sync controls, access policy management.
2. **Security & RBAC (`RBACPolicyManager.tsx`)**: Organization security rules and access matrices.
3. **Workspace Preferences (`Workspace`)**: Organization name, industry template selection, default model parameters.

---

## 13. Realtime & State Update Architecture

| Feature Surface | Update Mechanism | Primary Hook / Query | Performance Notes |
|---|---|---|---|
| **Chat Streaming** | SSE (`text/event-stream`) | `streamChat()` native HTTP stream | Token-by-token update without full page re-render |
| **Processing Jobs** | Polling (5s interval) | `useQuery(['processing-jobs'])` | Refetches job list during active ingestion |
| **Documents Catalog** | React Query invalidation | `useQuery(['documents'])` | Invalidates cache on upload/delete |
| **Connector Sync** | Manual trigger + Polling | `useSyncConnector()` mutation | Updates sync status badge on completion |
| **Audit Logs** | React Query refetch | `useQuery(['audit-logs'])` | Periodic data update |

---

## 14. Render & State Performance Audit

- **Zustand Stores**:
  - `useAuthStore`: Subscribed by layout and guards for user session.
  - `useDocumentStore`: Subscribed by document catalog components.
- **React Query Cache**:
  - Used for document lists, connector states, user lists, and audit logs.
- **Re-render Optimization Targets for Redesign**:
  - Localize Chat stream buffer state inside message list to prevent input composer re-renders.
  - Memoize table rows in `DocumentsPage` and `AuditLogsPage`.

---

## 15. Current Design System Primitives

- **Typography**: Inter / Sans-serif system font stack (`font-sans`).
- **Color Palette**:
  - Primary Background: Neutral light glass / slate (`#f8fafc`, `#ffffff`).
  - Text: Slate 900 (`#0f172a`), Slate 600 (`#475569`).
  - Brand Accents: Indigo/Blue (`#3b82f6`), Emerald (`#10b981`), Purple (`#a855f7`).
- **Visual Effects**:
  - `LiquidGlassShader.tsx`: WebGL shader background for auth screens.
  - Glassmorphism: `backdrop-blur-md`, `bg-white/80`, `border-slate-200/80`.
- **UI Components**: Radix UI primitives, Lucide React icons, Sonner toast notifications.

---

## 16. Shared UI Architecture

```
EnterpriseLayout
├── Navigation Dock (Sidebar.tsx)
├── Header Bar (User profile dropdown, Org badge)
└── Page View Container
    ├── Header Section (Title, subtitle, action buttons)
    ├── Filter Bar (Search input, Scope tabs, Dropdowns)
    └── Main Data View (Table / Grid / Chat Stream)
```

---

## 17. Missing / Partial UX Gaps

1. **Notification Center**: Currently lacks a top-bar notifications drawer for async ingestion completions.
2. **Workspace Preferences Form**: `/settings?tab=workspace` is currently a placeholder card requiring full input controls for org branding and LLM temperature defaults.
3. **Offline Webhook Status Indicator**: GitHub connector sync badge could display webhook reachability status.

---

## 18. Complete User Journeys

### 1. Administrative Onboarding & Setup
`Signup` ──► `Onboarding (Industry Selection)` ──► `Dashboard` ──► `Connectors Setup` ──► `Users & Roles`

### 2. Knowledge Ingestion & Query
`Documents Page` ──► `Upload File` ──► `Processing Queue` ──► `AI Chat Assistant` ──► `Source Citation Inspection`

---

## 19. Recommended UI Redesign Screen Inventory

### **AUTH**
- `LoginScreen` (`/login`)
- `SignUpScreen` (`/signup`)
- `ForgotPasswordScreen` (`/forgot-password`)
- `OnboardingWizard` (`/onboarding`)

### **WORKSPACE**
- `ExecutiveDashboard` (`/dashboard`)
- `UniversalSearch` (`/search`)

### **KNOWLEDGE**
- `KnowledgeCatalog` (`/documents`)
- `DocumentDetailsDrawer` (Overlay)
- `UploadModal` (Modal)

### **CHAT**
- `AssistantChatWorkspace` (`/chat`)
- `UserMemoryModal` (Modal)

### **CONNECTORS**
- `ConnectorsHub` (`/settings?tab=connectors`)
- `GitHubRepoSelector` (Modal)
- `ConnectorAccessPolicyEditor` (Modal)

### **PEOPLE & SECURITY**
- `UserManagement` (`/users`)
- `DepartmentsSecurityConsole` (`/departments`)
- `RBACPolicyBuilder` (`/settings?tab=rbac`)

### **ADMIN**
- `SuperAdminOrganizations` (`/organizations`)
- `ZeroTrustAuditLogs` (`/audit-logs`)
- `IngestionJobsMonitor` (`/jobs`)
- `MemoryConsole` (`/memory`)

### **SETTINGS**
- `SettingsWorkspace` (`/settings`)
