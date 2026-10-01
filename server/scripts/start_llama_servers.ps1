# AUREN - Single Multimodal LLM Orchestrator (Generation: 8083, Embedding: 8081)
# Qwen2.5-VL-3B-Instruct Q4_K_M on port 8083 (text + image)
# nomic-embed-text on port 8081 (UNCHANGED)
$ErrorActionPreference = "Continue"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$serverDir = Resolve-Path "$scriptDir\.."
$modelsDir = "$serverDir\models"
$logsDir = "$serverDir\logs"

if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
}
if (-not (Test-Path $modelsDir)) {
    New-Item -ItemType Directory -Path $modelsDir -Force | Out-Null
}

# 1. Locate llama-server.exe
$llamaBin = "C:\Users\HomePC\llama-b10798-bin-win-cuda-13.3-x64\llama-server.exe"
if (-not (Test-Path $llamaBin)) {
    $llamaBin = (Get-Command llama-server.exe -ErrorAction SilentlyContinue).Source
}
if (-not $llamaBin -or -not (Test-Path $llamaBin)) {
    Write-Error "Could not locate llama-server.exe. Please ensure llama.cpp is installed."
    exit 1
}

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "   AUREN - Starting Multimodal LLM + Embedding Servers" -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan
Write-Host "Binary: $llamaBin" -ForegroundColor Gray

# 2. Stop any existing processes on ports 8081 and 8083
Write-Host "[1/5] Checking and clearing ports 8081, 8083..." -ForegroundColor Yellow
$ports = @(8081, 8082, 8083, 8084)
foreach ($p in $ports) {
    try {
        $conns = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue
        foreach ($conn in $conns) {
            $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
            if ($proc) {
                Write-Host "  Stopping process $($proc.Name) (PID: $($proc.Id)) on port $p..." -ForegroundColor DarkYellow
                Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
            }
        }
    } catch {}
}
Start-Sleep -Seconds 1

# 3. Model Resolution
Write-Host "`n[2/5] Resolving Model Paths in $modelsDir..." -ForegroundColor Yellow

# Generation Model: Qwen2.5-VL-3B-Instruct Q4_K_M (multimodal — text + vision)
$genModel = "$modelsDir\Qwen2.5-VL-3B-Instruct-Q4_K_M.gguf"
$genMmproj = "$modelsDir\mmproj-Qwen2.5-VL-3B-Instruct-f16.gguf"

if (-not (Test-Path $genModel)) {
    Write-Error "Generation model not found: $genModel"
    Write-Host "Please run the download script first." -ForegroundColor Red
    exit 1
}
if (-not (Test-Path $genMmproj)) {
    Write-Error "Multimodal projector not found: $genMmproj"
    Write-Host "Please run the download script first." -ForegroundColor Red
    exit 1
}

# Embedding Model: nomic-embed-text (UNCHANGED)
$embedModel = "$modelsDir\nomic-embed-text.gguf"
if (-not (Test-Path $embedModel)) {
    Write-Error "Embedding model not found: $embedModel"
    exit 1
}

Write-Host "  Generation Model (8083): $(Split-Path -Leaf $genModel)" -ForegroundColor Green
Write-Host "  Generation MMProj:       $(Split-Path -Leaf $genMmproj)" -ForegroundColor Green
Write-Host "  Embedding  Model (8081): $(Split-Path -Leaf $embedModel) [UNCHANGED]" -ForegroundColor Green

# 4. Launch Servers
Write-Host "`n[3/5] Spawning Server Instances..." -ForegroundColor Yellow

function Start-DetachedServer {
    param(
        [string]$binPath,
        [string]$argsStr
    )
    $proc = Start-Process -FilePath $binPath -ArgumentList $argsStr -WindowStyle Hidden -PassThru
    return $proc.Id
}

# Server 1: Generation (Multimodal) — Qwen2.5-VL-3B on Port 8083
$genLog = "$logsDir\llama_generation.log"
$genArgs = "-m `"$genModel`" --mmproj `"$genMmproj`" --port 8083 --host 127.0.0.1 -c 8192 -ngl 99 --parallel 2 --alias qwen2.5-vl-3b,qwen2.5-vl-3b-instruct --log-file `"$genLog`""
Write-Host "  Launching Multimodal Generation Server on port 8083..." -ForegroundColor Cyan
$genPid = Start-DetachedServer -binPath $llamaBin -argsStr $genArgs

# Server 2: Embedding — nomic-embed-text on Port 8081 (UNCHANGED)
$embedLog = "$logsDir\llama_embed.log"
$embedArgs = "-m `"$embedModel`" --port 8081 --host 127.0.0.1 --embedding -c 2048 -b 2048 -ub 2048 -ngl 99 --alias nomic-embed-text:latest --log-file `"$embedLog`""
Write-Host "  Launching Embedding Server on port 8081 (UNCHANGED)..." -ForegroundColor Cyan
$embedPid = Start-DetachedServer -binPath $llamaBin -argsStr $embedArgs

# 5. Health Check Verification
Write-Host "`n[4/5] Waiting for servers to initialize..." -ForegroundColor Yellow

function Test-Endpoint {
    param([string]$url, [int]$timeoutSec = 90)
    $startTime = Get-Date
    while ((Get-Date) -lt $startTime.AddSeconds($timeoutSec)) {
        try {
            $resp = Invoke-WebRequest -Uri $url -Method Get -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
            if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 400) {
                return $true
            }
        } catch {
            Start-Sleep -Milliseconds 800
        }
    }
    return $false
}

$genOk    = Test-Endpoint "http://127.0.0.1:8083/health" 90
$embedOk  = Test-Endpoint "http://127.0.0.1:8081/health" 30

function Get-PortPid([int]$port) {
    $c = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($c) { return $c.OwningProcess }
    return "N/A"
}

$genPortPid   = Get-PortPid 8083
$embedPortPid = Get-PortPid 8081

Write-Host "`n[5/5] Verification Results:" -ForegroundColor Yellow
Write-Host "  -----------------------------------------------------------------" -ForegroundColor Gray
Write-Host "  Service     | Port | PID   | Status" -ForegroundColor Gray
Write-Host "  -----------------------------------------------------------------" -ForegroundColor Gray
Write-Host ("  Generation  | 8083 | {0,-5} | {1}" -f $genPortPid,   $(if ($genOk)   { "ONLINE (OK) [Qwen2.5-VL-3B Q4_K_M + mmproj]" } else { "STARTING/FAILED" })) -ForegroundColor $(if ($genOk)   { "Green" } else { "Red" })
Write-Host ("  Embedding   | 8081 | {0,-5} | {1}" -f $embedPortPid, $(if ($embedOk) { "ONLINE (OK) [nomic-embed-text - UNCHANGED]" }   else { "STARTING/FAILED" })) -ForegroundColor $(if ($embedOk) { "Green" } else { "Red" })
Write-Host "  -----------------------------------------------------------------`n" -ForegroundColor Gray

if ($genOk -and $embedOk) {
    Write-Host "All AUREN servers are ACTIVE and healthy!" -ForegroundColor Green
    Write-Host "  Generation: http://127.0.0.1:8083  (Qwen2.5-VL-3B-Instruct Q4_K_M)" -ForegroundColor Green
    Write-Host "  Embedding:  http://127.0.0.1:8081  (nomic-embed-text - UNCHANGED)" -ForegroundColor Green
} else {
    Write-Host "Some servers are still initializing. Check logs in $logsDir." -ForegroundColor Yellow
    if (-not $genOk) {
        Write-Host "  Generation log: $genLog" -ForegroundColor Yellow
    }
}
