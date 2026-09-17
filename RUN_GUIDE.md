# AUREN Enterprise Knowledge OS — Complete Execution & Run Guide

This document provides a comprehensive, step-by-step guide to running the entire **AUREN Enterprise Knowledge OS** platform — including the React frontend, Express API backend, PostgreSQL database, Qdrant vector store, Redis cache, SearXNG search engine, Crawl4AI crawler, and local host GPU `llama-server` inference engines.

---

## 📋 System Prerequisites

Before running the application, ensure your machine has:
1. **Node.js** (v18.x or later) & **npm** (v9.x or later)
2. **Docker Desktop** (running with Linux container support enabled)
3. **PowerShell** (for Windows model server orchestration scripts)
4. **Python 3.10+** (optional, for GGUF model downloading)

---

## 🚀 Quick Run Summary

| Mode | Command | Best For |
|---|---|---|
| **Development Mode** | `npm run dev` in `/server` & `/client` | Active coding, UI/API development & live debugging |
| **Docker Compose Mode** | `docker compose up -d --build` | Full one-command containerized production pilot deployment |

---

## 🛠️ Option A: Step-by-Step Local Development Mode

### Step 1: Start Host Model Servers (`llama-server`)

AUREN uses 3 local GPU-accelerated `llama-server` instances for local AI model execution (Chat on port 8083, Embeddings on port 8081, and Vision on port 8082).

You can start all 3 servers using either of the following commands:

#### Option 1: Via npm (Recommended)
Open a terminal in the `server` directory:
```bash
cd server
npm run llama:start
```

#### Option 2: Via PowerShell
Open a PowerShell window in the project root directory:
```powershell
powershell -ExecutionPolicy Bypass -File .\server\scripts\start_llama_servers.ps1
```

---

> ℹ️ **What this script does:**
> - Automatically detects your local `llama-server.exe` binary.
> - Clears ports 8081, 8082, and 8083 if previous background instances are running.
> - Loads model weights from `./server/models`:
>   - **Embedding Server**: `http://127.0.0.1:8081` (`nomic-embed-text.gguf`)
>   - **Vision Server**: `http://127.0.0.1:8082` (`qwen2.5-vl-7b-instruct-q4_k_m.gguf`)
>   - **Chat Server**: `http://127.0.0.1:8083` (`ornith-9b.gguf` or `qwen2.5-14b.gguf`)
> - Runs health checks on all 3 ports until `ONLINE (OK)` status is confirmed.

---

> 💡 **Useful Llama Server Commands:**
> - **Check Status**: `npm run llama:status` (or `powershell -ExecutionPolicy Bypass -File .\server\scripts\check_llama_servers.ps1`)
> - **Stop Servers**: `npm run llama:stop` (or `powershell -ExecutionPolicy Bypass -File .\server\scripts\stop_llama_servers.ps1`)

---

### Step 2: Launch Background Infrastructure (Docker)
Ensure **Docker Desktop** is open and running, then start the containerized databases and web search services:

```bash
# From workspace root
docker compose up -d postgres redis qdrant searxng crawl4ai
```

> **Active Services & Ports:**
> - **PostgreSQL**: `127.0.0.1:5432` (Relational DB & RBAC metadata)
> - **Redis**: `127.0.0.1:6379` (Job queues & state caching)
> - **Qdrant**: `127.0.0.1:6333` (Vector database)
> - **SearXNG**: `127.0.0.1:8080` (Self-hosted search engine)
> - **Crawl4AI**: `127.0.0.1:11235` (Deep web content extraction engine)

---

### Step 3: Initialize & Start Backend API Server

Open a terminal window:

```bash
# Navigate to server directory
cd server

# Install dependencies (if not already installed)
npm install

# Push database schema to PostgreSQL
npx prisma db push

# Seed initial organization, super-admin, and demo accounts
npm run db:seed

# Start backend server in development mode
npm run dev
```

- 🚀 **Backend API Endpoint:** `http://127.0.0.1:5000`
- 🟢 **Health Check:** `http://127.0.0.1:5000/health`

---

### Step 4: Start Frontend Client

Open a **second terminal window**:

```bash
# Navigate to client directory
cd client

# Install dependencies (if not already installed)
npm install

# Start Vite React development server
npm run dev
```

- 🌐 **Frontend Application:** `http://localhost:5174`
- Log in using your seeded admin credentials or quick demo profiles on the login page.

---

## 🐳 Option B: Full Containerized Stack (Production Deployment)

To deploy the entire AUREN application stack (including backend API and frontend Nginx SPA) in containerized mode:

### 1. Start Host GPU Model Servers
Run in terminal (from `server` directory):
```bash
cd server
npm run llama:start
```
Or via PowerShell from root:
```powershell
powershell -ExecutionPolicy Bypass -File .\server\scripts\start_llama_servers.ps1
```

### 2. Launch Docker Compose Stack
From the workspace root directory:
```bash
docker compose up -d --build
# stop docker
docker stop $(docker ps -q)  

```

- 🌐 **Web Frontend Application**: `http://localhost:5174` (or `http://localhost`)
- 🚀 **Backend API**: `http://localhost:5000`
- 📁 **Uploaded Document Storage**: Persisted locally at `./server/storage`

To stop all containers:
```bash
docker compose down
```

---

## ⚡ Useful Scripts Reference

### Client (`/client`)
| Script | Action |
| :--- | :--- |
| `npm run dev` | Starts Vite development server with Hot Module Reloading |
| `npm run build` | Runs TypeScript check & compiles static production bundle |
| `npm run preview` | Previews production build locally |

### Server (`/server`)
| Script | Action |
| :--- | :--- |
| `npm run dev` | Starts Express backend server with `nodemon` live-reload |
| `npm run build` | Compiles TypeScript into `/dist` |
| `npm run start` | Executes production server (`node dist/index.js`) |
| `npm run db:seed` | Seeds database with initial tenant, admin, and demo users |
| `.\scripts\start_llama_servers.ps1` | Launches host GPU `llama-server` instances |
| `.\scripts\stop_llama_servers.ps1` | Terminates running `llama-server` processes |
| `.\scripts\check_llama_servers.ps1` | Probes health status of ports 8081, 8082, and 8083 |

---

## 🔍 Troubleshooting & Common Resolutions

### ❌ Port Conflict (`EADDRINUSE: address already in use :::5000`)
If a previous crashed process is holding port 5000, terminate it in PowerShell:
```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force
```

### ❌ Database Connection Error (`ECONNREFUSED ::1:6379` or `::1:5432`)
Node.js v18+ defaults to IPv6 (`::1`). Ensure your `server/.env` uses explicit IPv4 loopback bindings:
```ini
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/ekos_db?schema=public&client_encoding=utf8"
REDIS_URL="redis://127.0.0.1:6379"
QDRANT_URL="http://127.0.0.1:6333"
```

### ❌ Docker Daemon Connection Error
If Docker reports `failed to connect to the docker API`, open **Docker Desktop** from your OS Start Menu before running `docker compose` commands.

### ❌ Model Server Port Offline (`llama-server` missing)
If chat or embeddings return provider errors, verify that `llama-server` is listening:
```powershell
curl http://127.0.0.1:8083/health
curl http://127.0.0.1:8081/health
```
If offline, re-run `.\server\scripts\start_llama_servers.ps1`.
