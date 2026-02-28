$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
Set-Location "C:\Users\victa\claude\parkshare"
Write-Host "Upgrading Expo to SDK 52 (compatible with Node 24)..."
& npx expo install expo@latest --fix
