# AUREN - 3 Llama Servers Orchestrator (Chat: 8083, Embedding: 8081, Vision: 8082)
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
Write-Host "   AUREN - Starting 3 Llama Servers (Chat, Embed, Vision)" -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan
Write-Host "Binary: $llamaBin" -ForegroundColor Gray

# 2. Stop any existing processes on ports 8081, 8082, 8083
Write-Host "[1/5] Checking and clearing ports 8081, 8082, 8083..." -ForegroundColor Yellow
$ports = @(8081, 8082, 8083)
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

$chatModel = "$modelsDir\ornith-9b.gguf"
if (-not (Test-Path $chatModel)) {
    $chatModel = "$modelsDir\qwen2.5-14b.gguf"
}

$embedModel = "$modelsDir\nomic-embed-text.gguf"
if (-not (Test-Path $embedModel)) {
    $embedModel = "$modelsDir\qwen3-embedding-8b.gguf"
}

$visionModel = "$modelsDir\qwen2.5-vl-7b-instruct-q4_k_m.gguf"
$mmprojModel = "$modelsDir\mmproj-Qwen2.5-VL-7B-Instruct-f16.gguf"
$hasTrueVision = (Test-Path $visionModel) -and (Test-Path $mmprojModel)

if (-not $hasTrueVision) {
    $visionModel = $chatModel
}

Write-Host "  Chat Model:      $(Split-Path -Leaf $chatModel)" -ForegroundColor Green
Write-Host "  Embedding Model: $(Split-Path -Leaf $embedModel)" -ForegroundColor Green
Write-Host "  Vision Model:    $(Split-Path -Leaf $visionModel) $(if ($hasTrueVision) { '(Multimodal MMProj active)' } else { '(Fallback weights)' })" -ForegroundColor Green

# 4. Launch Servers Detached via WMI
Write-Host "`n[3/5] Spawning Detached Background Llama Server Instances..." -ForegroundColor Yellow

function Start-DetachedServer {
    param(
        [string]$binPath,
        [string]$argsStr,
        [string]$logPath
    )
    $cmdLine = "cmd.exe /c `"`"$binPath`" $argsStr > `"$logPath`" 2>&1`""
    $res = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = $cmdLine }
    return $res.ProcessId
}

# Server 1: Chat Server (Port 8083)
$chatLog = "$logsDir\llama_chat.log"
$chatArgs = "-m `"$chatModel`" --port 8083 --host 127.0.0.1 -c 8192 -ngl 99 --parallel 2 --alias ornith:9b"
Write-Host "  Launching Chat Server on port 8083..." -ForegroundColor Cyan
$chatPid = Start-DetachedServer -binPath $llamaBin -argsStr $chatArgs -logPath $chatLog

# Server 2: Embedding Server (Port 8081)
$embedLog = "$logsDir\llama_embed.log"
$embedArgs = "-m `"$embedModel`" --port 8081 --host 127.0.0.1 --embedding -c 2048 -b 2048 -ub 2048 -ngl 99 --alias nomic-embed-text:latest,qwen3-embedding:8b"
Write-Host "  Launching Embedding Server on port 8081..." -ForegroundColor Cyan
$embedPid = Start-DetachedServer -binPath $llamaBin -argsStr $embedArgs -logPath $embedLog

# Server 3: Vision Server (Port 8082)
$visionLog = "$logsDir\llama_vision.log"
if ($hasTrueVision) {
    $visionArgs = "-m `"$visionModel`" --mmproj `"$mmprojModel`" --port 8082 --host 127.0.0.1 -c 16384 -np 1 -ngl 0 --alias qwen2.5-vl-7b-instruct-q4_k_m.gguf"
} else {
    $visionArgs = "-m `"$visionModel`" --port 8082 --host 127.0.0.1 -c 16384 -np 1 -ngl 0 --alias qwen2.5-vl-7b-instruct-q4_k_m.gguf"
}
Write-Host "  Launching Vision Server on port 8082..." -ForegroundColor Cyan
$visionPid = Start-DetachedServer -binPath $llamaBin -argsStr $visionArgs -logPath $visionLog

# 5. Health Check Verification
Write-Host "`n[4/5] Waiting for servers to initialize..." -ForegroundColor Yellow

function Test-Endpoint {
    param([string]$url, [int]$timeoutSec = 60)
    $startTime = Get-Date
    while ((Get-Date) -lt $startTime.AddSeconds($timeoutSec)) {
        try {
            $resp = Invoke-WebRequest -Uri $url -Method Get -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
            if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 400) {
                return $true
            }
        } catch {
            Start-Sleep -Milliseconds 800
        }
    }
    return $false
}

$embedOk = Test-Endpoint "http://127.0.0.1:8081/health" 30
$chatOk = Test-Endpoint "http://127.0.0.1:8083/health" 45
$visionOk = Test-Endpoint "http://127.0.0.1:8082/health" 60

function Get-PortPid([int]$port) {
    $c = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($c) { return $c.OwningProcess }
    return "N/A"
}

$chatPortPid = Get-PortPid 8083
$embedPortPid = Get-PortPid 8081
$visionPortPid = Get-PortPid 8082

Write-Host "`n[5/5] Verification Results:" -ForegroundColor Yellow
Write-Host "  ----------------------------------------------------------------" -ForegroundColor Gray
Write-Host "  Service   | Port | PID   | Status" -ForegroundColor Gray
Write-Host "  ----------------------------------------------------------------" -ForegroundColor Gray
Write-Host ("  Chat      | 8083 | {0,-5} | {1}" -f $chatPortPid, $(if ($chatOk) { "ONLINE (OK)" } else { "STARTING/FAILED" })) -ForegroundColor $(if ($chatOk) { "Green" } else { "Red" })
Write-Host ("  Embedding | 8081 | {0,-5} | {1}" -f $embedPortPid, $(if ($embedOk) { "ONLINE (OK)" } else { "STARTING/FAILED" })) -ForegroundColor $(if ($embedOk) { "Green" } else { "Red" })
Write-Host ("  Vision    | 8082 | {0,-5} | {1}" -f $visionPortPid, $(if ($visionOk) { "ONLINE (OK)" } else { "STARTING/FAILED" })) -ForegroundColor $(if ($visionOk) { "Green" } else { "Red" })
Write-Host "  ----------------------------------------------------------------`n" -ForegroundColor Gray

if ($chatOk -and $embedOk -and $visionOk) {
    Write-Host "🎉 All 3 Llama Servers are ACTIVE and healthy in the background!" -ForegroundColor Green
} else {
    Write-Host "⚠️ Some servers are still initializing. Check logs in $logsDir." -ForegroundColor Yellow
}
