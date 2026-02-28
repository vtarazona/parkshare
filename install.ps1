$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
Set-Location "C:\Users\victa\claude\parkshare"
Write-Host "Node version:" (& node --version)
Write-Host "NPM version:" (& npm --version)
Write-Host "Installing dependencies..."
& npm install
Write-Host "Done!"
