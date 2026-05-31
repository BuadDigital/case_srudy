# Run once as Administrator so colleagues on the same Wi‑Fi can open the demo.
# Right-click PowerShell → Run as administrator, then:
#   cd path\to\project1_case_study\apps\shell\scripts
#   .\open-firewall.ps1

$ErrorActionPreference = "Stop"

$ruleName = "Ejada Next.js Dev 3000"

$existing = netsh advfirewall firewall show rule name="$ruleName" 2>$null
if ($LASTEXITCODE -eq 0) {
  Write-Host "Firewall rule already exists: $ruleName"
  exit 0
}

netsh advfirewall firewall add rule `
  name="$ruleName" `
  dir=in `
  action=allow `
  protocol=TCP `
  localport=3000 `
  profile=private `
  description="Allow LAN access to Ejada shell (npm run dev)"

Write-Host ""
Write-Host "Done. Port 3000 is open on Private networks (home/office Wi‑Fi)."
Write-Host "Share the URL printed when you run: npm run dev"
Write-Host ""
