# Run in PowerShell from the project folder: .\scripts\setup.ps1
$ErrorActionPreference = 'Stop'
foreach ($tool in 'node','npm','git') {
  if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) { throw "$tool is not installed. Install Node 20+ LTS and Git first." }
}
Write-Host "Node $(node --version)"
npm install
npm install --global eas-cli
npm run typecheck
npm test
Write-Host "Setup complete. Next: eas login ; eas build:configure ; .\scripts\build-ios.ps1"
