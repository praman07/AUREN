# Project Run Guide

This guide explains how to start the full stack for the project, including the containerized infrastructure, the backend server, and the frontend client.

> [!NOTE]  
> The backend port has been reverted to `5000` to resolve the `HTTP 500` port conflicts. In addition, the `.env` configurations have been adjusted to explicitly use IPv4 (`127.0.0.1`) instead of `localhost` to prevent Node.js from accidentally attempting an IPv6 (`::1`) connection, which was causing the `ECONNREFUSED` error for Redis.

## Prerequisites
- **Node.js** (v18+)
- **Docker Desktop** (must be running before starting)

---

## 1. Start Infrastructure Services

The project relies on Docker for its databases and search/crawl services. You **must** have Docker Desktop running.

1. Open your terminal.
2. Navigate to the `server` directory:
   ```bash
   cd server
   ```
3. Start the containers using Docker Compose:
   ```bash
   docker-compose up -d
   ```
4. This will start:
   - **PostgreSQL** (Port 5432)
   - **Redis** (Port 6379)
   - **Qdrant** (Port 6333)
   - **SearXNG** (Port 8080)
   - **Crawl4AI** (Port 11235)

*(You can verify their status with `docker ps` or by using the `node check_services.js` script in the `server` directory).*

---

## 2. Start the Backend Server

Once the infrastructure is up, you can start the Node.js backend.

1. Keep your terminal in the `server` directory.
2. Install dependencies (if you haven't already):
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
> [!TIP]
> You should see a success message indicating: `🚀 EKOS Backend is running on http://localhost:5000 in development mode`. 

---

## 3. Start the Frontend Client

With the backend running on port 5000, start the frontend Vite server.

1. Open a **new terminal window**.
2. Navigate to the `client` directory:
   ```bash
   cd client
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the frontend:
   ```bash
   npm run dev
   ```

*(The frontend proxy is correctly configured to route `/api` requests to `http://127.0.0.1:5000`)*.

---

## Troubleshooting

### `ECONNREFUSED ::1:6379` (Redis/Database connection issues)
This occurs if Node.js resolves `localhost` to the IPv6 address `::1`, while the Docker container is bound to the IPv4 address `127.0.0.1`. 
**Fix:** This is already fixed in your `.env` by explicitly using `127.0.0.1` for Redis, Ollama, SearXNG, and Crawl4AI. Ensure your `DATABASE_URL` also uses `127.0.0.1`.

### Backend Port Conflicts
If you encounter `EADDRINUSE: address already in use :::5000`, it means another process or a previous crashed instance is holding the port. You can kill it by running this in PowerShell:
```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force
```

### Docker Daemon Not Running
If you see an error like `failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine`, you need to launch the **Docker Desktop** application from your Windows Start Menu before running `docker-compose`.
