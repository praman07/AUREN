# AUREN USER V2 — READ-ONLY GAP ANALYSIS & AUDIT

> **Audit Mode:** Read-Only Codebase Inspection & Gap Analysis  
> **Date:** September 8, 2026  
> **Classification Legend:**  
> - **A**: Already implemented and working  
> - **B**: Backend exists but frontend missing/incomplete  
> - **C**: Frontend exists but backend capability missing/incomplete  
> - **D**: Completely missing and needs implementation  

---

## 1. Feature Surface Gap Analysis

| Capability / Module | Current Implementation Status | Gap Classification | Details & Action Required |
|---|---|---|---|
| **Global User Shell** | `EnterpriseLayout.tsx`, `Sidebar.tsx` floating dock | **B** | Navigation dock exists; needs user profile bottom menu, workspace selector (Personal vs Org), top-bar global search, notifications bell icon, and clean Apple-like neutral styling. |
| **Home Hero Greeting** | Generic dashboard widgets | **B** | User identity exists in `useAuthStore`; needs clean hero greeting ("Hi Praman, how can I help you today?") with quick prompt composer. |
| **Home Primary Actions** | None | **B** | Search my knowledge, Search web, Just chat, Analyze document buttons exist as backend endpoints; need wiring to Home action chips. |
| **Home Contextual Prompts** | Static suggestion cards | **A** | Chips exist in `ChatInput.tsx`; need contextual triggers on Home page. |
| **Library / Knowledge Tabs** | `/documents/:scopeRoute` | **A** | Working scope filtering (`all`, `org`, `personal`, `dept`). |
| **Document Catalog Table** | `DocumentsPage.tsx` | **A** | Displays title, scope, owner, department, status, size, date. |
| **Document Upload & Queue** | `UploadDialog.tsx`, `UploadQueue.tsx` | **A** | Multipart upload via `/api/v1/documents/upload` -> BullMQ worker pipeline (`PENDING`, `PARSING`, `EMBEDDING`, `INDEXING`, `READY`). |
| **Automatic Document Intelligence** | Partial text extraction | **B/C** | Ingestion pipeline embeds vectors into Qdrant; needs automatic overview generation (executive summary, key topics, reading time, technologies, entities) stored in `Document.summary` JSON column. |
| **Document Detail View** | `DocumentDetailsDrawer.tsx` | **B** | Drawer exists with Overview & Security tabs; needs full tabbed view (Overview, AI Summary, Knowledge, Security, Versions, Activity) + "Ask AUREN about this" button. |
| **Document-to-Chat** | Target document filter in backend | **B** | `ChatRequestDTO` supports `targetDocumentIds`; needs one-click "Ask AUREN about this" trigger from document drawer/detail page. |
| **Related Documents** | Qdrant vector similarity engine | **B** | Backend vector store search exists; needs "Related Knowledge" recommendation section on document detail page. |
| **Chat Assistant Workspace** | `ChatPage.tsx`, `MessageBubble.tsx`, `ChatInput.tsx` | **A** | Realtime SSE streaming (`/api/v1/chat/stream`), source cards (`PERSONAL` vs `ORGANIZATION` badges), intent routing, DuckDuckGo/SearXNG web search. |
| **Chat Source Cards & Citations** | `MessageBubble.tsx` | **A** | Source cards display title, scope badge, document ID, relevance score, snippet text. |
| **Unified Search** | `SearchPage.tsx`, `RetrievalEngine.ts` | **A** | Hybrid vector + lexical BM25 search engine with scope and department filtering. |
| **Data Connectors Hub** | `ConnectorsList.tsx` | **A** | GitHub, Google Drive, Gmail, Notion, Slack connector cards. |
| **GitHub Integration** | `GitHubRepoPickerModal.tsx`, `GitHubController.ts` | **A** | OAuth redirect -> Repo picker modal -> Background indexing -> Webhook push auto-sync. |
| **Connector Access Control (RBAC)**| `ConnectorPolicyModal.tsx` | **A** | Allow/Deny policy editor for Users, Roles, Departments. |
| **Settings & Profile** | `SettingsPage.tsx` | **B** | Connectors and RBAC tabs work; needs user profile form and workspace preferences form polish. |
| **Notifications / Activity Center**| `AuditLogRepository`, Event Publisher | **C** | Event logging exists in backend; needs top-bar activity popover component for document processing and sync completions. |
| **Realtime / Render Architecture** | SSE, React Query, Zustand | **A/B** | SSE stream for chat tokens working; table rows and stream buffers can be localized to eliminate broad page re-renders. |

---

## 2. Architectural Audit Summary

1. **Security & Authorization (Preserved & Verified)**:
   - Tenant isolation (`organizationId`) enforced across all API endpoints and SQL/Qdrant queries.
   - `scope: PERSONAL` documents strictly filtered by `ownerId == req.user.id` in `PermissionFilter.ts`.
   - `ConnectorPolicy` allow/deny rules evaluated dynamically.

2. **Backend Services & Persistence**:
   - Express API (`http://127.0.0.1:5000`)
   - PostgreSQL (`ekos_db`) via Prisma ORM
   - Qdrant Vector Engine (`http://127.0.0.1:6333`)
   - Llama Chat Server (`http://127.0.0.1:8083`)
   - Llama Embedding Server (`http://127.0.0.1:8081`)
   - Llama Vision / VLM Server (`http://127.0.0.1:8082`)
   - SearXNG (`http://127.0.0.1:8080`)

3. **Planned Enhancements**:
   - Add `summary Json?` column to `Document` schema to persist automatically generated document intelligence overviews.
   - Implement automatic AI summary extractor in `DocumentProcessor.ts` upon ingestion completion.
   - Build clean Apple-like Home page with hero prompt composer, contextual quick actions, and personal/org workspace scope switch.
   - Build document detail page with full Overview, AI Summary, Knowledge, Security, Version History, and "Ask AUREN about this" document-to-chat action.
   - Build lightweight Notification Popover for ingestion & sync completion events.
