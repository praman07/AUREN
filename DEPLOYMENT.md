# AUREN — Pilot Deployment Guide

This document describes the one-command deployment procedure for the AUREN application stack and infrastructure.

---

## Architecture & Boundaries

AUREN operates using a hybrid containerized infrastructure model:

1. **Docker Compose Application Stack**:
   - **PostgreSQL**: Primary transactional database & permissions (`postgres_data` volume)
   - **Qdrant**: Vector storage & similarity index (`qdrant_data` volume)
   - **Redis**: Job queue & caching layer (`redis_data` volume)
   - **SearXNG**: Self-hosted web search engine
   - **Crawl4AI**: Web page extraction and markdown generation engine
   - **AUREN Backend**: Express API server (`./server/storage` persistent document volume)
   - **AUREN Frontend**: React SPA served via Nginx on port 80

2. **External Host GPU Boundary (`llama-server`)**:
   - Model serving (`llama-server`) runs natively on the customer's GPU host to ensure direct hardware acceleration (CUDA/Metal).
   - **Port 8083**: LLM Chat Inference
   - **Port 8081**: Embeddings Server (`nomic-embed-text`)
   - **Port 8082**: Vision Model Server (Qwen2.5-VL)
   - The containerized backend communicates with host model servers via `http://host.docker.internal:<port>`.

---

## Deployment Steps

### 1. Start External GPU Model Servers (Host Machine)
Ensure the host GPU machine is running `llama-server` on ports 8081, 8082, and 8083:
```powershell
# Windows PowerShell
.\server\scripts\start_llama_servers.ps1
```

### 2. Launch Containerized Application Stack
From the repository root directory, run:
```bash
docker compose up -d --build
```

### 3. Verify Deployment Health
Check service health and status:
```bash
docker compose ps
```
The stack is fully online when `auren-backend` and `auren-frontend` show healthy status.

Access the application in your browser at `http://localhost`.

---

## Operations & Persistence

- **Uploaded Document Storage**: Saved locally to `./server/storage` on the host system.
- **Database Backups**: PostgreSQL data is stored in the Docker volume `postgres_data`.
- **Vector Storage**: Qdrant vectors are persisted in `qdrant_data`.
- **Logs**: Backend and infrastructure logs can be viewed via `docker compose logs -f backend`.
