# AUREN - Stop All 3 Llama Servers (Ports 8081, 8082, 8083)
$ErrorActionPreference = "SilentlyContinue"

Write-Host "Stopping Llama Servers on ports 8081, 8082, 8083..." -ForegroundColor Cyan

$ports = @(8081, 8082, 8083)
$stoppedCount = 0

foreach ($p in $ports) {
    try {
        $conns = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue
        foreach ($conn in $conns) {
            $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
            if ($proc) {
                Write-Host "  Terminating PID $($proc.Id) ($($proc.Name)) listening on port $p..." -ForegroundColor Yellow
                Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
                $stoppedCount++
            }
        }
    } catch {}
}

# Also kill any orphan llama-server.exe
$llamaProcs = Get-Process -Name "llama-server" -ErrorAction SilentlyContinue
foreach ($lp in $llamaProcs) {
    Write-Host "  Stopping llama-server process (PID: $($lp.Id))..." -ForegroundColor Yellow
    Stop-Process -Id $lp.Id -Force -ErrorAction SilentlyContinue
    $stoppedCount++
}

Write-Host "Done. Stopped $stoppedCount process(es)." -ForegroundColor Green
