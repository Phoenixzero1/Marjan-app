@echo off
start cmd /k "npm run dev"
timeout /t 5
ssh -o StrictHostKeyChecking=no -R 80:localhost:3000 serveo.net
