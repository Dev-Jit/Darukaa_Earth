# Run the FastAPI dev server with the project virtualenv (not global Python).
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Test-Path ".venv\Scripts\python.exe")) {
    Write-Host "Creating virtualenv..."
    python -m venv .venv
    .\.venv\Scripts\pip install -r requirements.txt
}

if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "Created .env from .env.example (check DATABASE_URL port 5433 if using Docker)."
    }
}

Write-Host "Starting API on http://127.0.0.1:8001 ..."
.\.venv\Scripts\uvicorn app.main:app --reload --port 8001
