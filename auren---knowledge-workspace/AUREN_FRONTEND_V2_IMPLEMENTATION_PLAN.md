# AUREN Frontend V2 Implementation Plan

## Executive Summary
AUREN is an AI-powered Knowledge Assistant and Research Workspace bridging personal and organization knowledge through secure connectors, rich documents, retrieval, and source-grounded conversations. This plan establishes the frontend architecture, design system, API client, state management, and real-time mechanics adhering strictly to the Apple + Linear + Perplexity + Notion + Raycast design philosophy (understated, calm, fast, minimal, ultra-premium, dark mode supported, zero AI-slop or flashy gradients).

---

## 1. Reusable Design System & Components
A unified atomic and molecular component library will be constructed in `/src/components/ui/` with full dark/light theme support, mathematically sound border-radii, restrained color contrast, and solid-colored minimalism:

- **Buttons & IconButtons**: Solid neutral primary, ghost secondary, outline subtle, destructive. Strict 2:1 horizontal to vertical padding, `whitespace-nowrap`, active micro-press transitions.
- **Inputs & SearchInputs**: Clean single-line inputs with integrated shortcut badges (`⌘K`), clear buttons, and focus rings with subtle neutral accents.
- **Floating Composer**: Minimalist elevated pill/surface with scope badge, attachment chips, multi-line auto-expanding textarea, action triggers (Enter to send, Shift+Enter for newline), web search toggle, and source grounding indicator.
- **Cards & Containers**:
  - `Card`: Solid subtle border, flat or subtle elevation, no glassmorphism abuse.
  - `SourceCard`: Distinct visual card showing source type icon (Internal Document, GitHub, Web, Visual), title, document identifier, scope badge, version/time, and citation anchor.
  - `DocumentCard` & `DocumentTableRow`: Responsive card and table row displays with processing state indicators, reading time, tags, scope, and contextual menus.
  - `ConnectorCard`: Clean status, sync timestamp, connected account identity, repository/resource counters, and action menu.
- **Pills, Badges & Tabs**: Restrained scope indicators (`Personal` / `Organization`), state badges (`Ready`, `Processing`, `Extracting`, `Building Knowledge`, `Failed`), single-line, zero wrap.
- **Overlays**:
  - `CommandPalette` (Raycast-inspired `⌘K` universal switcher and search).
  - `NotificationPopover`: Real activity stream for document processing, GitHub webhooks, connector syncs.
  - `DocumentDetailDrawer` / `Modal`: Deep overview with executive summaries, key topics, reading time, entities, permissions, versions, and "Ask AUREN about this" CTA.

---

## 2. Components to Replace vs. Preserve
- **Replace**:
  - Unstructured placeholder layouts and any ad-hoc components with coherent design system components.
  - Hardcoded or raw JSON responses with structured, source-grounded UI renderers.
  - Cluttered multi-tier navigation systems with a single, disciplined Left Rail + Scope Header.
- **Preserve**:
  - Clean Left Navigation: AUREN mark, Primary "New Chat" action, Home, Library, Connectors, Search, Settings, Profile.
  - Strict Scope Partitioning: Personal vs. Organization context isolation.
  - Document Processing Pipeline Stages: `Uploading` → `Processing` → `Extracting` → `Building Knowledge` → `Generating Overview` → `Ready`.
  - SSE Streaming Chat Engine with token-by-token emission and real-time citation hydration.

---

## 3. Pages to Redesign & Specialize
1. **Home**:
   - Clean central greeting: *"Hi [First Name], How can I help today?"*
   - Subtitle: *"Search your knowledge, ask AUREN, or explore connected sources."*
   - Central Floating Composer with contextual quick-prompts (*Summarize a document*, *Explain this code*, *Find related information*, *Compare documents*).
   - Right Rail (compact, responsive): Connected Sources quick-status & Recent Sources / Documents.
   - Lower Section: Recent Chats and Recent Knowledge updates.
2. **Library**:
   - Scope switcher: All / Personal / Organization.
   - Dense, high-legibility document table with Name, Type, Scope, Source, Updated, Status, and actions.
   - Upload drawer / dropzone supporting PDF, Markdown, TypeScript/Code, Text.
   - Integrated state-based processing tracker.
3. **Document Detail & Intelligence View**:
   - Immediate answer to: *"What is this document?"*
   - Sections: Overview, AI Executive Summary, Key Topics, Reading Time, Entities/Tech, Security & Permissions (ACL, Owner, Roles), Version History, and Related Knowledge.
   - Dedicated *"Ask AUREN about this"* action initiating a document-grounded conversation.
4. **Chat**:
   - Left session history categorized into Today, Yesterday, Older.
   - Central conversation area with user queries and AUREN responses.
   - Live SSE stream reader with token updates.
   - Right context panel for Source Citations (Internal, GitHub, Web), Document context card, and suggested follow-ups.
5. **Search**:
   - Universal fast query bar with instant filtering by Scope (Personal/Org), Source (Docs, GitHub, Web), Type, and Date.
   - Keyboard navigable with live preview.
6. **Connectors**:
   - Dedicated GitHub manager: OAuth state, connected user/organization account, selected repos, webhook sync status, commit SHA tracking, manual sync trigger, and ConnectorPolicy access control.
   - Google Drive, Gmail, Notion, Slack cards indicating realistic connection status and permission mapping.
7. **Settings**:
   - Profile (Name, Email, Role, Department, Organization, Avatar).
   - Preferences: Theme (Light/Dark/System), Default Scope (Personal/Organization), Default Chat Mode, Notifications.
   - Security & Access policies.

---

## 4. Backend Endpoints & API Contracts
To deliver real data with zero mock/faked UI, the backend server (`server.ts` via Express + Vite middleware) provides:
- `GET /api/me`: Returns current user identity, organization, role, and preferences.
- `GET /api/documents`: Returns list of documents filtered by scope, organization, and query.
- `POST /api/documents/upload`: Handles document file upload, stores content, initiates asynchronous processing pipeline simulation through Redis/BullMQ lifecycle.
- `GET /api/documents/:id`: Returns full document intelligence, executive summary, topics, sections, permissions, and related documents.
- `DELETE /api/documents/:id`: Deletes document.
- `POST /api/documents/:id/ask`: Creates a chat session directly grounded in the document.
- `GET /api/chat/conversations`: Returns session history grouped by date.
- `GET /api/chat/conversations/:id`: Returns full message history and citations.
- `POST /api/chat/message`: SSE streaming endpoint (`/api/chat/stream`) emitting real-time tokens, source citations, and follow-up suggestions (powered by Gemini API when configured, with high-quality deterministic semantic grounding fallback).
- `GET /api/connectors`: Returns connector status, repository lists, sync logs, and permissions.
- `POST /api/connectors/:id/sync`: Triggers manual synchronization and emits webhook/sync event.
- `PUT /api/connectors/:id/permissions`: Updates connector access policy.
- `GET /api/search`: Universal search endpoint returning matched documents, chunks, and conversations.
- `GET /api/notifications`: Returns real notification stream (document events, syncs, security).

---

## 5. Realtime Opportunities & State Localization
- **Chat Streaming**: Component-isolated token streaming to prevent whole-tree rerenders.
- **Document Ingestion**: Localized status polling/event updates for active uploads without refreshing the entire library.
- **GitHub Sync**: Incremental sync activity badge update.
- **Notification Feed**: Isolated popover badge state.
- **Theme**: Pure CSS class `.dark` toggle with persisted localStorage and system preference detection.

---

## 6. Performance & Security Risks
- **Cache Isolation**: Ensure queries key off `[scope, orgId, userId]` so Personal documents never leak into Organization views or vice-versa.
- **Authorization Enforcement**: Strict filtering on document access policies; do not rely solely on UI scope badges.
- **Memory & Re-render Containment**: Use stable callbacks, memoized rows for large document tables, and avoid broad context updates.
