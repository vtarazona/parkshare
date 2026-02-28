$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
Set-Location "C:\Users\victa\claude\parkshare"
Write-Host "Starting ParkShare..."
& npx expo start
