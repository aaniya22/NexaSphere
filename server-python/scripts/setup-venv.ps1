# One-time Python dev environment setup for server-python
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

Set-Location $root

if (-not (Test-Path .venv)) {
    python -m venv .venv
}

.\.venv\Scripts\pip install --upgrade pip
.\.venv\Scripts\pip install -r requirements.txt

Write-Host "Done. Select interpreter: $root\.venv\Scripts\python.exe"
