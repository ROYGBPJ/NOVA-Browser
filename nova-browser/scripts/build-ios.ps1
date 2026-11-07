param(
  [ValidateSet('development','preview','production')][string]$Profile = 'development'
)
$ErrorActionPreference = 'Stop'
if (-not (Get-Command eas -ErrorAction SilentlyContinue)) { throw "eas-cli missing. Run .\scripts\setup.ps1" }
eas whoami | Out-Null
if ($LASTEXITCODE -ne 0) { throw "Not logged in. Run: eas login" }
# Cloud build on Apple infrastructure; no local Mac or Xcode needed.
# EAS prompts for your Apple Developer login the first time to create certificates/profiles.
eas build --platform ios --profile $Profile
