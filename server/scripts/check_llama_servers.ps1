# AUREN - Check Status of 3 Llama Servers
$ErrorActionPreference = "SilentlyContinue"

Write-Host "`n=== AUREN Llama Servers Health Status ===" -ForegroundColor Cyan

$services = @(
    @{ Name = "Chat (Port 8083)"; Url = "http://127.0.0.1:8083/health"; Port = 8083 },
    @{ Name = "Embedding (Port 8081)"; Url = "http://127.0.0.1:8081/health"; Port = 8081 },
    @{ Name = "Vision (Port 8082)"; Url = "http://127.0.0.1:8082/health"; Port = 8082 }
)

foreach ($s in $services) {
    $conn = Get-NetTCPConnection -LocalPort $s.Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    $pidStr = if ($conn) { $conn.OwningProcess } else { "None" }
    
    $isHealthy = $false
    try {
        $resp = Invoke-WebRequest -Uri $s.Url -Method Get -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
        if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 400) {
            $isHealthy = $true
        }
    } catch {}

    if ($isHealthy) {
        Write-Host "  ✅ $($s.Name) - ONLINE (PID: $pidStr)" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $($s.Name) - OFFLINE / UNHEALTHY (PID: $pidStr)" -ForegroundColor Red
    }
}
Write-Host ""
