# AUREN - LOCAL RUNTIME ARCHITECTURE

AUREN is designed as a secure, local-first Universal Knowledge Core. While Docker provides an excellent sandboxed environment for development and consistent cross-platform deployments, the ultimate goal of AUREN is to be entirely runnable on bare-metal Windows (or macOS/Linux) without requiring Docker as a hard runtime dependency. 

This document audits the current infrastructure dependencies and outlines the architectural path to making Docker entirely optional.

## 1. Infrastructure Dependency Audit

### PostgreSQL (Metadata & Permissions)
- **Current State**: Runs in Docker (`postgres:15-alpine`).
- **Local Native Support**: Full. PostgreSQL has native Windows installers.
- **Path to Docker-Free**: 
  - The application uses standard Prisma/Postgres connection strings (`DATABASE_URL`).
  - No code changes are required. The user simply needs to install PostgreSQL natively and update the `.env` file to point to `localhost:5432`.
  - An installation script (e.g., PowerShell) could eventually automate the native DB setup or verify its existence.

### Qdrant (Vector Database)
- **Current State**: Runs in Docker (`qdrant/qdrant`).
- **Local Native Support**: Full. Qdrant is written in Rust and provides native binaries for Windows, macOS, and Linux.
- **Path to Docker-Free**:
  - The `QdrantClient` in `@qdrant/js-client-rest` connects via a simple HTTP endpoint (`QDRANT_URL`).
  - No architectural changes are needed in AUREN.
  - The binary can be downloaded and run natively, and AUREN will communicate with it exactly as it does now.

### Redis (Caching & Job Queues)
- **Current State**: Runs in Docker (`redis:7-alpine`).
- **Local Native Support**: Partial on Windows. Native Redis on Windows is deprecated by Microsoft, but it can run via WSL2 (Windows Subsystem for Linux) or a native port like Memurai.
- **Path to Docker-Free**:
  - If we want to avoid WSL2 entirely, AUREN could abstract the caching/queueing layer to support an in-memory fallback (e.g., SQLite or an in-memory Node.js queue like BullMQ's local alternatives) for single-instance local modes.
  - For true Redis, WSL2 is the recommended path for native Windows execution today.

### Ollama (LLM & Embeddings)
- **Current State**: Runs natively outside of Docker on `localhost:11434`.
- **Local Native Support**: Full. Ollama has a native Windows installer and natively utilizes available GPU/CPU resources without virtualization overhead.
- **Path to Docker-Free**:
  - Already achieved. AUREN expects Ollama to be running natively on the host machine.
  - AUREN requires `nomic-embed-text:latest` for embeddings and a lightweight model (e.g., `qwen2.5:14b`) for generation.

### Backend (Node.js / Express)
- **Current State**: Runs via Node.js natively or in a container.
- **Local Native Support**: Full. 
- **Path to Docker-Free**:
  - Runs natively via `npm run dev` or built binaries. 

### Frontend (React / Vite)
- **Current State**: Runs via Node.js natively or in a container.
- **Local Native Support**: Full.
- **Path to Docker-Free**:
  - Runs natively via `npm run dev` or built assets served by the backend.

## 2. Zero-Friction Setup Strategy (Future)

To achieve a true "install and run" experience on Windows without Docker:

1. **Dependency Verification Layer**: On startup, AUREN's backend will probe ports for PostgreSQL, Qdrant, Redis, and Ollama.
2. **Automated Provisioning**: If a dependency is missing, AUREN could trigger a PowerShell script to download the respective portable binaries (Qdrant, Memurai/Redis-compatible, etc.) and launch them as child processes.
3. **Embedded Fallbacks**: 
   - Replace Redis with an embedded queue if running in a lightweight "Personal Local Mode".
   - Replace PostgreSQL with SQLite (Prisma supports SQLite) if a massive multi-tenant database isn't needed for a single local user. *Note: Switching DB providers in Prisma requires maintaining two schemas, so this should be weighed against simply installing Postgres.*

## 3. Conclusion

The current architecture of AUREN is **fully decoupled** from Docker. Docker is merely a convenience layer for routing and orchestration. Because every component communicates via standard TCP/HTTP protocols governed by `.env` variables, the transition to a 100% native runtime requires zero changes to the application's core logic or security model.
