# AUREN — Frontend Prototype Architecture & Execution Plan

## 1. Project Overview & Prototype Scope
AUREN is an AI-powered Knowledge Assistant and Research Workspace providing dual-tier knowledge boundaries (Personal vs. Organization), automatic document intelligence, grounded source citations, and connected workspace sources.

This plan defines the complete, interactive frontend prototype architecture for the definitive visual and interaction blueprint.

---

## 2. Routes & Navigation
The prototype supports client-side SPA routing with smooth transitions and history preservation:

- `/login`: Clean, minimalist authentication screen with email/pass, OAuth buttons, and link to Signup / Forgot Password.
- `/signup`: Registration interface creating user profile and triggering Onboarding.
- `/onboarding`: Interactive 5-step guided setup:
  - Step 1: Personal Details & Role (Praman Singh Bhogal, Member/Lead Architect)
  - Step 2: Knowledge Workspace Selection (Personal Vault vs. Organization Workspace)
  - Step 3: Knowledge Preferences & Default Chat Synthesis
  - Step 4: Connect Workspace Sources (GitHub, Google Drive, Notion, Slack)
  - Step 5: Completion & Launch into Workspace
- `/dashboard` (or `/home`): Central calm Home experience with greeting ("Hi Praman"), subtitle, restrained floating composer, contextual suggestions, recent knowledge, and connected sources.
- `/chat`: Focused research and question-answering workspace with session grouping (Today, Yesterday, Previous), realistic simulated token-by-token streaming, clickable source citations, follow-up chips, and document context attachments.
- `/documents` (Library): Knowledge workspace table with tabs (All, Personal, Organization), search, type filters, state-based ingestion progress, and actions (Open, Ask AUREN, Delete, Upload).
- `/documents/:id` (Document Detail): Deep automatic document intelligence view featuring Executive Summary, Document Purpose, Key Topics, Entities, Technologies, Reading Time, Sections, Security Policy, Version History, and Related Knowledge.
- `/search`: Universal search (Raycast + Perplexity style) with instant filtering across documents, conversations, code, and sources.
- `/connectors`: Connection manager showing active integrations, Personal vs. Organization scope, and access control.
- `/connectors/github`: Dedicated GitHub management view displaying connected repositories, branches, commit SHAs in JetBrains Mono, webhook status, and live sync trigger.
- `/settings`: Quiet settings management (Profile, Workspace, Preferences, Security, Connectors).
- `/profile`: Dedicated profile view with "Context AUREN can use" memory card, personal metadata, and active organization membership.

---

## 3. Screens & Workflows

### 3.1 Authentication & Onboarding
- **Login / Signup / Forgot Password**: Elegant obsidian/paper white cards, form validation, quick bypass for testing prototype.
- **5-Step Onboarding**: Progress stepper, interactive source toggles, preference selection, seamless transition to dashboard.

### 3.2 Home Experience
- Dynamic greeting: "Hi Praman," and "How can I help today?"
- Subtitle: "Search your knowledge, ask AUREN, or explore connected sources."
- Restrained floating composer with Enter to send, Shift+Enter for newline, Web toggle, and Attach Document pill.
- Contextual actions:
  - *Summarize a document*
  - *Explain this code*
  - *Find related information*
  - *Compare documents*
- Recent chats: "Q2 Architecture Review", "Zero-Trust Retrieval Spec"
- Recent knowledge: "Product Requirements.pdf", "architecture.md"
- Connected sources overview (GitHub, Google Drive, Notion)

### 3.3 Research Chat
- Chronological session grouping: Today, Yesterday, Previous.
- Realtime simulated streaming via progressive token buffer with blinking cursor and instant response.
- First-class clickable source citations:
  - Internal Document (Product Requirements.pdf)
  - GitHub (`architecture.md` @ commit sha)
  - Internal Policy (Security Guidelines)
  - Web (Verified technical paper)
- Click source -> opens Document Detail or GitHub commit reference.
- Suggested follow-up prompt chips for continuous exploration.

### 3.4 Document Intelligence & Detail View
- Automatic generation of:
  - Executive Summary
  - Document Purpose ("What is this document?")
  - Key Topics & Tags
  - Named Entities & Organizations
  - Referenced Technologies
  - Estimated Reading Time
  - Structural Sections with page references
  - Related Knowledge with match confidence
- "Ask AUREN about this" button immediately opening Chat with attached document context.

### 3.5 Asynchronous Ingestion & Document Upload
- File drag & drop supporting PDF, DOCX, TXT, Code, and Images.
- Stage-based processing lifecycle simulation:
  `Uploading` -> `Extracting` -> `Understanding` -> `Building knowledge` -> `Generating overview` -> `Ready`.
- Live notification triggered upon completion with unread counter update.

### 3.6 Connectors & GitHub Deep Dive
- Available connectors: GitHub, Google Drive, Gmail, Notion, Slack.
- Coming Soon connectors: Jira, Confluence, OneDrive.
- Dedicated GitHub Deep-Dive (`/connectors/github`):
  - Account: `praman@example.com`
  - Repositories: `auren`, `retrieval-service`, `vector-pipeline`
  - Commit SHA: `a91c2e7`, `7f9a2e1` in JetBrains Mono
  - Webhook Push Sync Active badge
  - "Sync Now" button simulating commit update and firing notification.
- Connector Policy Modal for managing role and department access.

### 3.7 Profile & Contextual Memory
- User profile: Praman Singh Bhogal, Lead Architect, `praman@example.com`, Organization: GNA / AUREN Workspace.
- Subtle "Context AUREN can use" memory card:
  - Preferred language: TypeScript
  - Current project: AUREN Knowledge Platform
  - Recent interests: RAG, Zero-Trust Architecture, Distributed Systems

### 3.8 Notifications & Activity Center
- Interactive notification dropdown in TopHeader.
- Live notifications for:
  - Document ready
  - GitHub synchronization
  - Connector connected
  - Security policy updated
- Mark all as read, clear, and direct click to navigate to related entity.

---

## 4. Reusable Design Primitives
- `Button` & `IconButton`: Primary, secondary, outline, ghost, with active micro-interactions.
- `Badge`: Scope (Personal, Organization, Hybrid), Status (Ready, Extracting, Building knowledge, Failed), DocType.
- `Input` & `SearchInput`: Accessible form controls with clear focus rings.
- `Modal` & `Drawer`: Accessible dialogs with Escape key handler and backdrop dismiss.
- `CommandPalette`: `Cmd+K` / `Ctrl+K` universal search and navigation.
- `Popover`: Notification bell and user profile switcher.

---

## 5. Prototype State Architecture
All mock data is rich, realistic, and managed in client-side React state and Context:
- `AuthContext`: Manages current user (`Praman Singh Bhogal`), active scope (`personal` vs `organization`), user preferences, and login/logout state.
- `NotificationContext`: Manages interactive notifications, unread counts, and push simulation.
- `WorkspaceDataContext`: Centralizes documents, conversations, connectors, and GitHub repository states with mutation methods (addDocument, updateDocStatus, syncGithub, deleteDoc, addChat, streamMessage).
