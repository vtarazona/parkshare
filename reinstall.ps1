$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
Set-Location "C:\Users\victa\claude\parkshare"
Write-Host "Removing node_modules..."
Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
Remove-Item -Force "package-lock.json" -ErrorAction SilentlyContinue
Write-Host "Installing fresh..."
& npm install --legacy-peer-deps
Write-Host "Done!"
