# Quick smoke test for observability stack (run after compose up)
param(
    [string]$ApiUrl = "http://localhost/health",
    [string]$PrometheusUrl = "http://localhost:9090",
    [string]$GrafanaUrl = "http://localhost:3000",
    [string]$JaegerUrl = "http://localhost:16686",
    [string]$KibanaUrl = "http://localhost:5601"
)

$ErrorActionPreference = "Stop"
$passed = 0
$failed = 0

function Test-Endpoint {
    param([string]$Name, [string]$Url)
    try {
        $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 10
        if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 400) {
            Write-Host "[PASS] $Name ($Url)"
            $script:passed++
        } else {
            Write-Host "[FAIL] $Name — status $($r.StatusCode)"
            $script:failed++
        }
    } catch {
        Write-Host "[FAIL] $Name — $($_.Exception.Message)"
        $script:failed++
    }
}

Write-Host "NexaSphere observability smoke test"
Write-Host "====================================="

Test-Endpoint "API health (via gateway)" $ApiUrl
Test-Endpoint "Prometheus" "$PrometheusUrl/-/healthy"
Test-Endpoint "Grafana" "$GrafanaUrl/api/health"
Test-Endpoint "Jaeger" "$JaegerUrl"
Test-Endpoint "Kibana" "$KibanaUrl/api/status"

try {
    $metrics = Invoke-WebRequest -Uri "http://localhost:8787/metrics" -UseBasicParsing -TimeoutSec 5
    if ($metrics.Content -match "http_requests_total") {
        Write-Host "[PASS] Prometheus metrics endpoint"
        $passed++
    } else {
        Write-Host "[FAIL] Metrics endpoint missing http_requests_total"
        $failed++
    }
} catch {
    Write-Host "[SKIP] Direct /metrics (only reachable inside Docker network)"
}

Write-Host ""
Write-Host "Results: $passed passed, $failed failed"
if ($failed -gt 0) { exit 1 }
