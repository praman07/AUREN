# AUREN - Stop All Llama Servers
# Stops any llama-server.exe processes on ports 8081 and 8083
$ErrorActionPreference = "Continue"

Write-Host "`nStopping AUREN llama servers..." -ForegroundColor Yellow

$ports = @(8081, 8082, 8083, 8084)
$stopped = 0

foreach ($p in $ports) {
    try {
        $conns = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue
        foreach ($conn in $conns) {
            $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
            if ($proc) {
                Write-Host "  Stopping $($proc.Name) (PID: $($proc.Id)) on port $p..." -ForegroundColor DarkYellow
                Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
                $stopped++
            }
        }
    } catch {}
}

# Also kill any orphaned llama-server processes
$orphans = Get-Process -Name "llama-server" -ErrorAction SilentlyContinue
foreach ($proc in $orphans) {
    Write-Host "  Stopping orphan $($proc.Name) (PID: $($proc.Id))..." -ForegroundColor DarkYellow
    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    $stopped++
}

if ($stopped -eq 0) {
    Write-Host "  No running llama-server processes found." -ForegroundColor Gray
} else {
    Write-Host "  Stopped $stopped process(es)." -ForegroundColor Green
}

Write-Host "Done." -ForegroundColor Green
